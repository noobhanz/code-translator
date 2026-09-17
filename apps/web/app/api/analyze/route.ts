import { NextResponse } from "next/server";
import { isHostedMode } from "@codetranslate/hosted";
import { analyzeLocalProject, toUserError } from "../../../src/lib/analyze-local";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  if (isHostedMode()) {
    return NextResponse.json(
      { error: "Local path analysis is available in the open-source app." },
      { status: 404 },
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "We couldn't read that request." }, { status: 400 });
  }
  const path = typeof body === "object" && body && "path" in body ? String(body.path) : "";
  try {
    const result = await analyzeLocalProject(path);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: toUserError(error) }, { status: 400 });
  }
}
