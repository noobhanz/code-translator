import { NextResponse } from "next/server";
import { getHostedRuntime } from "../../../../src/lib/hosted-runtime";
import { hostedErrorResponse } from "../../../../src/lib/http";
import { requireSessionUser } from "../../../../src/lib/session";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireSessionUser();
    const runtime = getHostedRuntime();
    const github = await runtime.githubForUser(user);
    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? undefined;
    const repos = await github.listRepositories(query ?? undefined);
    return NextResponse.json({ repos });
  } catch (error) {
    return hostedErrorResponse(error);
  }
}
