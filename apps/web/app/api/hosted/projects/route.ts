import { NextResponse } from "next/server";
import { addGitHubApp, listUserProjects } from "@codetranslate/hosted";
import { getHostedRuntime } from "../../../../src/lib/hosted-runtime";
import { hostedErrorResponse } from "../../../../src/lib/http";
import { requireSessionUser } from "../../../../src/lib/session";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(): Promise<Response> {
  try {
    const user = await requireSessionUser();
    const runtime = getHostedRuntime();
    const projects = await listUserProjects(runtime.store, user.id);
    return NextResponse.json({ projects });
  } catch (error) {
    return hostedErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await requireSessionUser();
    const runtime = getHostedRuntime();
    const body = (await request.json()) as { owner?: string; repo?: string };
    if (!body.owner || !body.repo) {
      return NextResponse.json({ error: "Choose a GitHub project." }, { status: 400 });
    }
    const github = await runtime.githubForUser(user);
    const result = await addGitHubApp({
      store: runtime.store,
      github,
      userId: user.id,
      owner: body.owner,
      repo: body.repo,
    });
    return NextResponse.json({
      project: result.project,
      run: {
        id: result.run.id,
        status: result.run.status,
        errorMessage: result.run.errorMessage,
      },
      created: result.created,
    });
  } catch (error) {
    return hostedErrorResponse(error);
  }
}
