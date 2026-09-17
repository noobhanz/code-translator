import { NextResponse } from "next/server";
import { HostedError, humanHostedError, redactSecrets } from "@codetranslate/hosted";

export function hostedErrorResponse(error: unknown): Response {
  const message = redactSecrets(humanHostedError(error));
  const status = error instanceof HostedError ? error.httpStatus : 400;
  return NextResponse.json({ error: message }, { status });
}
