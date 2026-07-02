"use client";

import { useState } from "react";

import { FileUploadZone } from "@/components/FileUploadZone";
import { LOAResult } from "@/components/LOAResult";
import { Spinner } from "@/components/Spinner";
import { MAX_CONTEXT_DOCUMENTS } from "@/lib/constants";
import type { LOAGenerationResult, UploadStatus } from "@/lib/types";

export function LOACreatorApp() {
  const [templateFile, setTemplateFile] = useState<File[]>([]);
  const [contextFiles, setContextFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LOAGenerationResult | null>(null);

  const canGenerate =
    templateFile.length === 1 &&
    contextFiles.length > 0 &&
    status !== "generating";

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setStatus("generating");
    setError(null);

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Generation failed.");
      }

      setResult(data as LOAGenerationResult);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const handleReset = () => {
    setTemplateFile([]);
    setContextFiles([]);
    setResult(null);
    setError(null);
    setStatus("idle");
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

        {status === "generating" && (
          <div className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700 ring-1 ring-brand-100">
            AI is reviewing your documents and filling the LOA template. This
            may take a minute.
          </div>
        )}
      </section>
    </div>
  );
}
