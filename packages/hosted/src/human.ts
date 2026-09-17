import type { AnalysisStatus } from "./models";

export function analysisStatusCopy(status: AnalysisStatus): string {
  switch (status) {
    case "queued":
      return "Getting your app ready...";
    case "running":
      return "Understanding your app...";
    case "failed":
      return "We couldn't analyze this app.";
    case "completed":
      return "Ready";
  }
}

export const FIRST_ANALYSIS_STAGES = [
  "Getting your app from GitHub...",
  "Reading the important parts...",
  "Finding how everything fits together...",
  "Preparing your overview...",
] as const;

export const REFRESH_STAGES = [
  "Checking GitHub for updates...",
  "Updating your app...",
  "Preparing your overview...",
] as const;
