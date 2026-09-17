import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { inspectRepository } from "@codetranslate/ingest";
import {
  HostedError,
  MemoryHostedStore,
  MockGitHubGateway,
  addGitHubApp,
  analyzeHostedProject,
  getUserAnalysisRun,
  getUserProject,
  listUserProjects,
  refreshUserProject,
  removeUserProject,
  retryUserProject,
} from "@codetranslate/hosted";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = path.join(root, "fixtures/app-saas-basic");

async function setup() {
  const store = new MemoryHostedStore();
  const user = await store.createUser({ githubUserId: "99", githubLogin: "ada" });
  const github = new MockGitHubGateway();
  github.repos = [
    {
      id: "123",
      owner: "ada",
      name: "my-saas",
      fullName: "ada/my-saas",
      visibility: "private",
      defaultBranch: "main",
    },
  ];
  github.commits.set("ada/my-saas", "aaa111");
  github.fixtureByRepo.set("ada/my-saas", fixture);
  return { store, user, github };
}

async function copyCheckout(destination: string): Promise<void> {
  await fs.cp(fixture, destination, { recursive: true });
}

describe("hosted projects and analysis", () => {
  it("adds an app, persists the overview, and reuses the same commit", async () => {
    const { store, user, github } = await setup();
    const created = await addGitHubApp({
      store,
      github,
      userId: user.id,
      owner: "ada",
      repo: "my-saas",
    });
    expect(created.created).toBe(true);
    expect(created.project.visibility).toBe("private");
    expect(created.run.status).toBe("completed");
    expect(created.run.applicationModel?.summary.primaryFramework).toBe("Next.js");
    expect(created.run.applicationModel?.areas.some((area) => area.name === "Payments")).toBe(true);
    expect(created.run.repositoryAnalysis?.repository.rootPath).toBe("github:ada/my-saas");
    expect(created.run.repositoryAnalysis?.repository.source.path).not.toContain(os.tmpdir());

    const again = await addGitHubApp({
      store,
      github,
      userId: user.id,
      owner: "ada",
      repo: "my-saas",
    });
    expect(again.created).toBe(false);
    expect(again.project.id).toBe(created.project.id);
    expect(again.run.id).toBe(created.run.id);

    const listed = await listUserProjects(store, user.id);
    expect(listed).toHaveLength(1);
  });

  it("does not let another user open or delete the project", async () => {
    const { store, user, github } = await setup();
    const { project } = await addGitHubApp({
      store,
      github,
      userId: user.id,
      owner: "ada",
      repo: "my-saas",
    });
    const other = await store.createUser({ githubUserId: "100", githubLogin: "eve" });
    await expect(getUserProject(store, other.id, project.id)).rejects.toBeInstanceOf(HostedError);
    await expect(removeUserProject(store, other.id, project.id)).rejects.toBeInstanceOf(HostedError);
    await expect(listUserProjects(store, other.id)).resolves.toEqual([]);
    await expect(getUserProject(store, user.id, project.id)).resolves.toMatchObject({ id: project.id });
  });

  it("creates a new analysis run when the commit changes", async () => {
    const { store, user, github } = await setup();
    const first = await addGitHubApp({
      store,
      github,
      userId: user.id,
      owner: "ada",
      repo: "my-saas",
    });
    github.commits.set("ada/my-saas", "bbb222");
    const refreshed = await refreshUserProject({
      store,
      github,
      userId: user.id,
      projectId: first.project.id,
    });
    expect(refreshed.unchanged).toBe(false);
    expect(refreshed.run.id).not.toBe(first.run.id);
    expect(refreshed.run.commitSha).toBe("bbb222");
    const history = await store.listAnalysisRuns(first.project.id);
    expect(history).toHaveLength(2);
    const previous = await getUserAnalysisRun(store, user.id, first.project.id, first.run.id);
    expect(previous.applicationModel?.summary.primaryFramework).toBe("Next.js");
  });

  it("reuses a completed run for the same commit and analyzer version", async () => {
    const { store, user, github } = await setup();
    const first = await addGitHubApp({
      store,
      github,
      userId: user.id,
      owner: "ada",
      repo: "my-saas",
    });
    const refreshed = await refreshUserProject({
      store,
      github,
      userId: user.id,
      projectId: first.project.id,
    });
    expect(refreshed.unchanged).toBe(true);
    expect(refreshed.run.id).toBe(first.run.id);
  });

  it("creates a new run when the analyzer version changes", async () => {
    const { store, user, github } = await setup();
    const first = await addGitHubApp({
      store,
      github,
      userId: user.id,
      owner: "ada",
      repo: "my-saas",
    });
    const next = await analyzeHostedProject({
      store,
      github,
      userId: user.id,
      projectId: first.project.id,
      analyzerVersion: "9.9.9",
    });
    expect(next.id).not.toBe(first.run.id);
    expect(next.analyzerVersion).toBe("9.9.9");
  });

  it("retries a failed run without re-adding the app", async () => {
    const { store, user, github } = await setup();
    github.failDownload = true;
    const created = await addGitHubApp({
      store,
      github,
      userId: user.id,
      owner: "ada",
      repo: "my-saas",
    });
    expect(created.run.status).toBe("failed");
    github.failDownload = false;
    const retried = await retryUserProject({
      store,
      github,
      userId: user.id,
      projectId: created.project.id,
    });
    expect(retried.run.status).toBe("completed");
    expect(retried.project.id).toBe(created.project.id);
  });

  it("cleans up temporary source after success and failure", async () => {
    const { store, user, github } = await setup();
    const dirs: string[] = [];
    const checkout = async () => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ct-test-"));
      dirs.push(dir);
      await copyCheckout(dir);
      return {
        rootPath: dir,
        cleanup: async () => {
          await fs.rm(dir, { recursive: true, force: true });
        },
      };
    };

    await analyzeHostedProject({
      store,
      github,
      userId: user.id,
      projectId: (
        await addGitHubApp({ store, github, userId: user.id, owner: "ada", repo: "my-saas" })
      ).project.id,
      inspect: inspectRepository,
      checkout,
      force: true,
    });
    for (const dir of dirs) {
      await expect(fs.stat(dir)).rejects.toMatchObject({ code: "ENOENT" });
    }

    const project = (await listUserProjects(store, user.id))[0];
    expect(project).toBeDefined();
    dirs.length = 0;
    await expect(
      analyzeHostedProject({
        store,
        github,
        userId: user.id,
        projectId: project?.id ?? "",
        analyzerVersion: "cleanup-fail",
        checkout,
        inspect: async () => {
          throw new Error("parse exploded");
        },
        force: true,
      }),
    ).rejects.toBeInstanceOf(HostedError);
    for (const dir of dirs) {
      await expect(fs.stat(dir)).rejects.toMatchObject({ code: "ENOENT" });
    }
  });

  it("removes an app and its analysis history", async () => {
    const { store, user, github } = await setup();
    const created = await addGitHubApp({
      store,
      github,
      userId: user.id,
      owner: "ada",
      repo: "my-saas",
    });
    await removeUserProject(store, user.id, created.project.id);
    expect(await store.getProject(created.project.id)).toBeUndefined();
    expect(await store.listAnalysisRuns(created.project.id)).toEqual([]);
  });

  it("filters repositories by name or owner", async () => {
    const github = new MockGitHubGateway();
    github.repos = [
      {
        id: "1",
        owner: "ada",
        name: "my-saas",
        fullName: "ada/my-saas",
        visibility: "private",
        defaultBranch: "main",
      },
      {
        id: "2",
        owner: "ada",
        name: "portfolio",
        fullName: "ada/portfolio",
        visibility: "public",
        defaultBranch: "main",
      },
    ];
    expect((await github.listRepositories("port")).map((item) => item.name)).toEqual(["portfolio"]);
    expect((await github.listRepositories("ADA")).map((item) => item.name)).toEqual(["my-saas", "portfolio"]);
  });
});
