"use client";

import { useEffect, useState } from "react";

import {
  STAGE_LABELS,
  formatElapsed,
  type ProgressStage,
  type ProgressUpdate,
} from "@/lib/generation/progress";

interface GenerationProgressProps {
  progress: ProgressUpdate;
  startedAt: number;
}

const ORDERED_STAGES: ProgressStage[] = [
  "validating",
  "parsing_template",
  "parsing_documents",
  "generating",
  "finalizing",
  "complete",
];

function stageIndex(stage: ProgressStage): number {
  return ORDERED_STAGES.indexOf(stage);
}

export function GenerationProgress({
  progress,
  startedAt,
}: GenerationProgressProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  void tick;
  const displayElapsed = Math.max(progress.elapsedMs, Date.now() - startedAt);
  const currentIndex = stageIndex(progress.stage);

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-brand-100 bg-brand-50/60 p-5 ring-1 ring-brand-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-brand-900">
            {STAGE_LABELS[progress.stage]}
          </p>
          <p className="mt-1 text-sm text-brand-800">{progress.message}</p>
          {progress.documentIndex && progress.documentTotal ? (
            <p className="mt-1 text-xs text-brand-700">
              Document {progress.documentIndex} of {progress.documentTotal}
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
            Elapsed
          </p>
          <p className="font-mono text-sm font-semibold text-brand-900">
            {formatElapsed(displayElapsed)}
          </p>
          <p className="text-xs text-brand-700">Runs until complete</p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-brand-800">
          <span>Progress</span>
          <span>{progress.progress}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white ring-1 ring-brand-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-500 ease-out"
            style={{ width: `${progress.progress}%` }}
          />
        </div>
      </div>

      <ol className="grid gap-2 sm:grid-cols-2">
        {ORDERED_STAGES.filter((stage) => stage !== "complete").map((stage) => {
          const index = stageIndex(stage);
          const isComplete = currentIndex > index;
          const isCurrent = progress.stage === stage;

          return (
            <li
              key={stage}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                isCurrent
                  ? "bg-white font-semibold text-brand-900 ring-1 ring-brand-200"
                  : isComplete
                    ? "text-emerald-800"
                    : "text-slate-500"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                  isComplete
                    ? "bg-emerald-100 text-emerald-700"
                    : isCurrent
                      ? "bg-brand-600 text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {isComplete ? "✓" : index + 1}
              </span>
              {STAGE_LABELS[stage]}
            </li>
          );
        })}
      </ol>

      {progress.stage === "generating" && (
        <div className="rounded-lg border border-brand-200 bg-white/80 px-3 py-2 text-xs text-brand-800">
          Large document sets can take a while. This will keep running until the
          AI finishes — you can leave this tab open.
        </div>
      )}
    </div>
  );
}
