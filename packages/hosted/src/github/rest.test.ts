import { describe, expect, it } from "vitest";
import { RestGitHubGateway } from "./rest";

describe("GitHub REST gateway", () => {
  it("maps 404 to a human error and never includes the token", async () => {
    const token = "gho_supersecretvalue";
    const gateway = new RestGitHubGateway({
      userAccessToken: token,
      fetchImpl: async (url, init) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("authorization")).toContain(token);
        expect(String(url)).not.toContain(token);
        return new Response("{}", { status: 404 });
      },
    });
    await expect(gateway.getRepository("ada", "missing")).rejects.toMatchObject({
      message: "We couldn't find that GitHub project.",
    });
  });

  it("lists and filters repositories from the GitHub payload", async () => {
    const gateway = new RestGitHubGateway({
      userAccessToken: "gho_test",
      fetchImpl: async (url) => {
        const href = String(url);
        if (href.includes("/user/installations") && !href.includes("/repositories")) {
          return Response.json({ installations: [] });
        }
        return Response.json([
          {
            id: 1,
            name: "my-saas",
            full_name: "ada/my-saas",
            description: null,
            private: true,
            default_branch: "main",
            owner: { login: "ada" },
          },
          {
            id: 2,
            name: "notes",
            full_name: "ada/notes",
            description: null,
            private: false,
            default_branch: "main",
            owner: { login: "ada" },
          },
        ]);
      },
    });
    const found = await gateway.listRepositories("saas");
    expect(found.map((item) => item.name)).toEqual(["my-saas"]);
    expect(found[0]?.visibility).toBe("private");
  });
});
