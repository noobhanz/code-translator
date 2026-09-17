import { createSign } from "node:crypto";
import { HostedError } from "../errors";

export function createGitHubAppJwt(appId: string, privateKey: string, now = Date.now()): string {
  const issuedAt = Math.floor(now / 1000) - 60;
  const expiresAt = issuedAt + 600;
  const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = toBase64Url(JSON.stringify({ iat: issuedAt, exp: expiresAt, iss: appId }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = signer.sign(privateKey, "base64url");
  return `${unsigned}.${signature}`;
}

export async function createInstallationToken(input: {
  appId: string;
  privateKey: string;
  installationId: string;
  fetchImpl?: typeof fetch;
}): Promise<string> {
  const jwt = createGitHubAppJwt(input.appId, input.privateKey);
  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl(
    `https://api.github.com/app/installations/${input.installationId}/access_tokens`,
    {
      method: "POST",
      headers: githubHeaders(jwt, "Bearer"),
    },
  );
  if (!response.ok) {
    throw new HostedError(
      "GITHUB_PERMISSION",
      "We couldn't access GitHub with the installed app.",
      response.status === 401 ? 401 : 403,
    );
  }
  const body = (await response.json()) as { token?: string };
  if (!body.token) {
    throw new HostedError("GITHUB_PERMISSION", "We couldn't access GitHub with the installed app.", 403);
  }
  return body.token;
}

export function githubHeaders(token: string, scheme: "Bearer" | "token" = "Bearer"): Record<string, string> {
  return {
    Authorization: `${scheme} ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "code-translator",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function toBase64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}
