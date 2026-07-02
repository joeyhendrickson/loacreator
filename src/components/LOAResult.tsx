"use client";

import { FieldEvidenceList } from "@/components/FieldEvidenceList";
import type { LOAGenerationResult } from "@/lib/types";

interface LOAResultProps {
  result: LOAGenerationResult;
  onReset: () => void;
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function LOAResult({ result, onReset }: LOAResultProps) {
  const jsonExport = JSON.stringify(result, null, 2);

  return (
    <section className="space-y-6">
      <div className="card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="badge-brand mb-3">Complete</span>
            <h2 className="text-2xl font-bold text-slate-900">Completed LOA</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review the filled form and evidence for each field, then download
              or start over.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                downloadText(result.completedLoa, "completed-loa.txt")
              }
              className="btn-primary"
            >
              Download LOA
            </button>
            <button
              type="button"
              onClick={() => downloadText(jsonExport, "loa-fields.json")}
              className="btn-secondary"
            >
              Download JSON
            </button>
            <button type="button" onClick={onReset} className="btn-secondary">
              Start Over
            </button>
          </div>
        </div>
      </div>

      {result.missingFields.length > 0 && (
        <div className="alert-warning">
          <h3 className="font-semibold">Missing Fields</h3>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {result.missingFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      )}

      {result.notes.length > 0 && (
        <div className="card bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
            {result.notes.map((note, index) => (
              <li key={`${note}-${index}`}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      <FieldEvidenceList fields={result.fields} />

      <div className="card">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Filled LOA Preview
        </h3>
        <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-5 font-mono text-sm leading-relaxed text-slate-800 ring-1 ring-slate-200">
          {result.completedLoa}
        </pre>
      </div>
    </section>
  );
}
