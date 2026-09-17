import { NextResponse } from "next/server";
import { getUserProject, removeUserProject } from "@codetranslate/hosted";
import { getHostedRuntime } from "../../../../../src/lib/hosted-runtime";
import { hostedErrorResponse } from "../../../../../src/lib/http";
import { requireSessionUser } from "../../../../../src/lib/session";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await context.params;
    const user = await requireSessionUser();
    const runtime = getHostedRuntime();
    const project = await getUserProject(runtime.store, user.id, id);
    return NextResponse.json({ project });
  } catch (error) {
    return hostedErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await context.params;
    const user = await requireSessionUser();
    const runtime = getHostedRuntime();
    await removeUserProject(runtime.store, user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return hostedErrorResponse(error);
  }
}
