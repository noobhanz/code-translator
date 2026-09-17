import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { x as extractTar } from "tar";
import { HostedError } from "../errors";
import { githubHeaders } from "./app-auth";
import type { GitHubGateway } from "./types";

export interface CheckoutResult {
  rootPath: string;
  cleanup: () => Promise<void>;
}

export async function withTempDirectory<T>(fn: (rootPath: string) => Promise<T>): Promise<T> {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), "codetranslate-"));
  try {
    return await fn(rootPath);
  } finally {
    await safeRemove(rootPath);
  }
}

export async function safeRemove(rootPath: string): Promise<void> {
  await fs.rm(rootPath, { recursive: true, force: true });
}

export async function checkoutGitHubRepository(input: {
  gateway: GitHubGateway;
  owner: string;
  repo: string;
  sha: string;
}): Promise<CheckoutResult> {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), "codetranslate-"));
  const cleanup = async () => {
    await safeRemove(rootPath);
  };
  try {
    await input.gateway.downloadTarball(input.owner, input.repo, input.sha, rootPath);
    const extractedRoot = await resolveExtractedRoot(rootPath);
    return {
      rootPath: extractedRoot,
      cleanup,
    };
  } catch (error) {
    await cleanup();
    throw error;
  }
}

export async function downloadGitHubTarball(input: {
  owner: string;
  repo: string;
  sha: string;
  destination: string;
  token: string;
  fetchImpl?: typeof fetch;
}): Promise<void> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const apiUrl = `https://api.github.com/repos/${input.owner}/${input.repo}/tarball/${input.sha}`;
  const first = await fetchImpl(apiUrl, {
    headers: githubHeaders(input.token),
    redirect: "manual",
  });
  const downloadUrl =
    first.status === 302 || first.status === 301 ? (first.headers.get("location") ?? undefined) : undefined;
  const archive = downloadUrl
    ? await fetchImpl(downloadUrl)
    : first.ok
      ? first
      : await fetchImpl(apiUrl, { headers: githubHeaders(input.token) });
  if (!archive.ok || !archive.body) {
    if (archive.status === 404) {
      throw new HostedError("NOT_FOUND", "We couldn't find that GitHub project.", 404);
    }
    if (archive.status === 401 || archive.status === 403) {
      throw new HostedError("GITHUB_PERMISSION", "We couldn't access that GitHub project.", archive.status);
    }
    throw new HostedError("ANALYSIS_FAILED", "We couldn't get this app from GitHub.");
  }
  const nodeStream = Readable.fromWeb(archive.body as never);
  await pipeline(nodeStream, extractTar({ cwd: input.destination, gzip: true }));
}

export async function resolveExtractedRoot(destination: string): Promise<string> {
  const entries = await fs.readdir(destination, { withFileTypes: true });
  const dirs = entries.filter((entry) => entry.isDirectory());
  if (dirs.length === 1 && dirs[0]) {
    return path.join(destination, dirs[0].name);
  }
  return destination;
}
