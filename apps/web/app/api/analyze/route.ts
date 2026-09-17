import { NextResponse } from "next/server";
import { analyzeLocalProject, toUserError } from "../../../src/lib/analyze-local";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
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
