"use client";

import { useState } from "react";

import { FileUploadZone } from "@/components/FileUploadZone";
import { GenerationProgress } from "@/components/GenerationProgress";
import { LOAResult } from "@/components/LOAResult";
import { Spinner } from "@/components/Spinner";
import { MAX_CONTEXT_DOCUMENTS } from "@/lib/constants";
import type {
  CompleteProgressUpdate,
  ErrorProgressUpdate,
  GenerationProgressEvent,
  ProgressUpdate,
} from "@/lib/generation/progress";
import type { LOAGenerationResult, UploadStatus } from "@/lib/types";

const INITIAL_PROGRESS: ProgressUpdate = {
  stage: "validating",
  progress: 0,
  message: "Starting LOA generation…",
  elapsedMs: 0,
};

export function LOACreatorApp() {
  const [templateFile, setTemplateFile] = useState<File[]>([]);
  const [contextFiles, setContextFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LOAGenerationResult | null>(null);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const canGenerate =
    templateFile.length === 1 &&
    contextFiles.length > 0 &&
    status !== "generating";

  const handleGenerate = async () => {
    if (!canGenerate) return;

    const generationStartedAt = Date.now();
    setStartedAt(generationStartedAt);
    setStatus("generating");
    setError(null);
    setProgress(INITIAL_PROGRESS);

    const formData = new FormData();
    formData.append("template", templateFile[0]);
    for (const file of contextFiles) {
      formData.append("documents", file);
    }

    try {
      const response = await fetch("/api/generate-loa", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Generation failed.");
      }

      if (!response.body) {
        throw new Error("No response stream received.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalResult: LOAGenerationResult | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;

          const event = JSON.parse(line) as GenerationProgressEvent;

          if (event.stage === "error") {
            throw new Error((event as ErrorProgressUpdate).error);
          }

          if (event.stage === "complete") {
            finalResult = (event as CompleteProgressUpdate).result;
            setProgress({
              stage: "complete",
              progress: 100,
              message: event.message,
              elapsedMs: event.elapsedMs,
            });
            continue;
          }

          setProgress(event);
        }
      }

      if (!finalResult) {
        throw new Error("Generation finished without a result.");
      }

      setResult(finalResult);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setProgress(null);
      setStartedAt(null);
    }
  };

  const handleReset = () => {
    setTemplateFile([]);
    setContextFiles([]);
    setResult(null);
    setError(null);
    setStatus("idle");
    setProgress(null);
    setStartedAt(null);
  };

  if (result) {
    return <LOAResult result={result} onReset={handleReset} />;
  }

  return (
    <div className="space-y-6">
      <FileUploadZone
        step={1}
        label="LOA Template"
        description="Upload the blank LOA form template to fill (AT&T to CallTower porting)."
        files={templateFile}
        onFilesChange={setTemplateFile}
        required
      />

      <FileUploadZone
        step={2}
        label="Context Documents"
        description={`Upload up to ${MAX_CONTEXT_DOCUMENTS} source documents containing account details, BTNs, authorized contacts, and other LOA fields.`}
        files={contextFiles}
        onFilesChange={setContextFiles}
        multiple
        maxFiles={MAX_CONTEXT_DOCUMENTS}
        required
      />

      {error && <div className="alert-error">{error}</div>}

      <section className="card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
              3
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Generate LOA
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {templateFile.length === 1
                  ? `Template: ${templateFile[0].name}`
                  : "No template selected yet"}
              </p>
              <p className="text-sm text-slate-500">
                {contextFiles.length} of {MAX_CONTEXT_DOCUMENTS} context
                documents uploaded
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="btn-primary w-full sm:w-auto"
          >
            {status === "generating" ? (
              <>
                <Spinner />
                Generating LOA…
              </>
            ) : (
              "Generate LOA"
            )}
          </button>
        </div>

        {status === "generating" && progress && startedAt !== null && (
          <GenerationProgress progress={progress} startedAt={startedAt} />
        )}
      </section>
    </div>
  );
}
