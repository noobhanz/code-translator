import { NextResponse } from "next/server";
import { retryUserProject } from "@codetranslate/hosted";
import { getHostedRuntime } from "../../../../../../src/lib/hosted-runtime";
import { hostedErrorResponse } from "../../../../../../src/lib/http";
import { requireSessionUser } from "../../../../../../src/lib/session";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await context.params;
    const user = await requireSessionUser();
    const runtime = getHostedRuntime();
    const github = await runtime.githubForUser(user);
    const result = await retryUserProject({
      store: runtime.store,
      github,
      userId: user.id,
      projectId: id,
    });
    return NextResponse.json({
      project: result.project,
      run: { id: result.run.id, status: result.run.status },
    });
  } catch (error) {
    return hostedErrorResponse(error);
  }
}
