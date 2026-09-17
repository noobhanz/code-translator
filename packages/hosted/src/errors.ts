export class HostedError extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(code: string, message: string, httpStatus = 400) {
    super(message);
    this.name = "HostedError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export function isHostedError(error: unknown): error is HostedError {
  return error instanceof HostedError;
}

export function humanHostedError(error: unknown): string {
  if (error instanceof HostedError) {
    return error.message;
  }
  if (error instanceof Error) {
    const lower = error.message.toLowerCase();
    if (lower.includes("too large") || lower.includes("file limit")) {
      return "This app is too large for the current analysis limits.";
    }
    if (lower.includes("does not exist") || lower.includes("not found") || lower.includes("404")) {
      return "We couldn't find that app.";
    }
    if (lower.includes("401") || lower.includes("unauthorized") || lower.includes("expired")) {
      return "GitHub access expired. Please sign in again.";
    }
    if (lower.includes("403") || lower.includes("forbidden") || lower.includes("permission")) {
      return "We couldn't access that GitHub project.";
    }
  }
  return "We couldn't analyze this app.";
}
