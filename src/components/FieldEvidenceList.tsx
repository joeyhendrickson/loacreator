"use client";

import { useMemo, useState } from "react";

import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import type { ConfidenceLevel, LOAField } from "@/lib/types";

interface FieldEvidenceListProps {
  fields: LOAField[];
}

function ConfidenceSummary({ fields }: { fields: LOAField[] }) {
  const counts = useMemo(() => {
    const tally: Record<ConfidenceLevel, number> = {
      high: 0,
      medium: 0,
      low: 0,
      none: 0,
    };
    for (const field of fields) {
      tally[field.confidence]++;
    }
    return tally;
  }, [fields]);

  const items: { level: ConfidenceLevel; label: string }[] = [
    { level: "high", label: "High confidence" },
    { level: "medium", label: "Medium confidence" },
    { level: "low", label: "Low confidence" },
    { level: "none", label: "No data" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ level, label }) => (
        <div
          key={level}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
        >
          <p className="text-2xl font-bold text-slate-900">{counts[level]}</p>
          <div className="mt-1 flex items-center gap-2">
            <ConfidenceBadge level={level} showLabel={false} />
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FieldRow({
  field,
  showEvidence,
  isExpanded,
  onToggle,
}: {
  field: LOAField;
  showEvidence: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasEvidence =
    field.evidence.rationale || field.evidence.sourceExcerpt;

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-slate-900">{field.fieldName}</p>
            {showEvidence && <ConfidenceBadge level={field.confidence} />}
          </div>
          <p className="mt-1 break-words text-sm text-slate-700">
            {field.value || (
              <span className="italic text-slate-400">Not filled</span>
            )}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Source: {field.sourceDocument || "—"}
          </p>
        </div>

        {showEvidence && hasEvidence && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isExpanded}
            className="btn-secondary shrink-0 self-start text-xs"
          >
            {isExpanded ? "Hide evidence" : "Show evidence"}
          </button>
        )}
      </div>

      {showEvidence && isExpanded && hasEvidence && (
        <div className="mx-6 mb-4 rounded-xl border border-brand-100 bg-brand-50/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
            Decision rationale
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {field.evidence.rationale}
          </p>

          {field.evidence.sourceExcerpt && (
            <>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-brand-700">
                Source excerpt
              </p>
              <blockquote className="mt-2 border-l-4 border-brand-300 bg-white/80 px-4 py-3 text-sm italic leading-relaxed text-slate-700">
                &ldquo;{field.evidence.sourceExcerpt}&rdquo;
              </blockquote>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function FieldEvidenceList({ fields }: FieldEvidenceListProps) {
  const [showEvidence, setShowEvidence] = useState(true);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(
    () => new Set(),
  );
  const [filter, setFilter] = useState<ConfidenceLevel | "all">("all");

  const filteredFields = useMemo(() => {
    if (filter === "all") return fields;
    return fields.filter((field) => field.confidence === filter);
  }, [fields, filter]);

  const allExpanded =
    filteredFields.length > 0 &&
    filteredFields.every((field) => expandedFields.has(field.fieldName));

  const toggleField = (fieldName: string) => {
    setExpandedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldName)) {
        next.delete(fieldName);
      } else {
        next.add(fieldName);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedFields(new Set());
    } else {
      setExpandedFields(new Set(filteredFields.map((field) => field.fieldName)));
    }
  };

  const filterOptions: { value: ConfidenceLevel | "all"; label: string }[] = [
    { value: "all", label: "All fields" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
    { value: "none", label: "No data" },
  ];

  return (
    <div className="card overflow-hidden p-0">
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Extracted Fields & Evidence
            </h3>
            <p className="text-xs text-slate-500">
              {fields.length} fields · toggle evidence to review each decision
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={showEvidence}
                onChange={(event) => setShowEvidence(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Show evidence & confidence
            </label>

            {showEvidence && (
              <button type="button" onClick={toggleAll} className="btn-secondary text-xs">
                {allExpanded ? "Collapse all" : "Expand all evidence"}
              </button>
            )}
          </div>
        </div>

        {showEvidence && (
          <div className="mt-4 space-y-4">
            <ConfidenceSummary fields={fields} />
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFilter(option.value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    filter === option.value
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        {filteredFields.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-500">
            No fields match this confidence filter.
          </p>
        ) : (
          filteredFields.map((field) => (
            <FieldRow
              key={field.fieldName}
              field={field}
              showEvidence={showEvidence}
              isExpanded={expandedFields.has(field.fieldName)}
              onToggle={() => toggleField(field.fieldName)}
            />
          ))
        )}
      </div>
    </div>
  );
}
