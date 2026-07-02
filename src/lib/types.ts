export type ConfidenceLevel = "high" | "medium" | "low" | "none";

export interface FieldEvidence {
  rationale: string;
  sourceExcerpt: string;
}

export interface ParsedDocument {
  name: string;
  text: string;
  type: "text" | "image";
  mimeType: string;
  base64?: string;
}

export interface LOAField {
  fieldName: string;
  value: string;
  sourceDocument: string;
  confidence: ConfidenceLevel;
  evidence: FieldEvidence;
}

export interface LOAGenerationResult {
  fields: LOAField[];
  completedLoa: string;
  notes: string[];
  missingFields: string[];
}

export type UploadStatus = "idle" | "generating" | "success" | "error";
