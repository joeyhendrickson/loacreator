import type { LOAGenerationResult } from "@/lib/types";

export type ProgressStage =
  | "validating"
  | "parsing_template"
  | "parsing_documents"
  | "generating"
  | "finalizing"
  | "complete"
  | "error";

export interface ProgressUpdate {
  stage: ProgressStage;
  progress: number;
  message: string;
  elapsedMs: number;
  documentIndex?: number;
  documentTotal?: number;
  activityLog?: string[];
}

export interface CompleteProgressUpdate extends ProgressUpdate {
  stage: "complete";
  result: LOAGenerationResult;
}

export interface ErrorProgressUpdate extends ProgressUpdate {
  stage: "error";
  error: string;
}

export type GenerationProgressEvent =
  | ProgressUpdate
  | CompleteProgressUpdate
  | ErrorProgressUpdate;

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export const STAGE_LABELS: Record<ProgressStage, string> = {
  validating: "Validating uploads",
  parsing_template: "Parsing LOA template",
  parsing_documents: "Parsing context documents",
  generating: "Generating LOA with AI",
  finalizing: "Finalizing results",
  complete: "Complete",
  error: "Error",
};
