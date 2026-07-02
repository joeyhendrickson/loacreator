import { MAX_CONTEXT_DOCUMENTS } from "@/lib/constants";
import type { GenerationProgressEvent, ProgressUpdate } from "@/lib/generation/progress";
import { generateLOA, parseUploadedFile } from "@/lib/openai/generate-loa";

type ProgressCallback = (update: GenerationProgressEvent) => void;

export async function runGeneration(
  formData: FormData,
  onProgress: ProgressCallback,
  startTime = Date.now(),
): Promise<void> {
  const elapsedMs = () => Date.now() - startTime;

  const report = (update: Omit<ProgressUpdate, "elapsedMs">): void => {
    onProgress({ ...update, elapsedMs: elapsedMs() });
  };

  if (!process.env.OPENAI_API_KEY) {
    onProgress({
      stage: "error",
      progress: 0,
      message: "OPENAI_API_KEY is not configured.",
      error: "OPENAI_API_KEY is not configured.",
      elapsedMs: elapsedMs(),
    });
    return;
  }

  report({
    stage: "validating",
    progress: 5,
    message: "Validating uploaded files…",
  });

  const templateFile = formData.get("template");

  if (!(templateFile instanceof File) || templateFile.size === 0) {
    onProgress({
      stage: "error",
      progress: 0,
      message: "An LOA template file is required.",
      error: "An LOA template file is required.",
      elapsedMs: elapsedMs(),
    });
    return;
  }

  const contextFiles = formData
    .getAll("documents")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (contextFiles.length === 0) {
    onProgress({
      stage: "error",
      progress: 0,
      message: "At least one context document is required.",
      error: "At least one context document is required.",
      elapsedMs: elapsedMs(),
    });
    return;
  }

  if (contextFiles.length > MAX_CONTEXT_DOCUMENTS) {
    onProgress({
      stage: "error",
      progress: 0,
      message: `Maximum ${MAX_CONTEXT_DOCUMENTS} context documents allowed.`,
      error: `Maximum ${MAX_CONTEXT_DOCUMENTS} context documents allowed.`,
      elapsedMs: elapsedMs(),
    });
    return;
  }

  report({
    stage: "parsing_template",
    progress: 12,
    message: `Parsing LOA template: ${templateFile.name}`,
  });

  const template = await parseUploadedFile(templateFile);

  const contextDocuments = [];
  for (let index = 0; index < contextFiles.length; index++) {
    const file = contextFiles[index];
    const progress = 15 + Math.round(((index + 1) / contextFiles.length) * 30);

    report({
      stage: "parsing_documents",
      progress,
      message: `Parsing document ${index + 1} of ${contextFiles.length}: ${file.name}`,
      documentIndex: index + 1,
      documentTotal: contextFiles.length,
    });

    contextDocuments.push(await parseUploadedFile(file));
  }

  report({
    stage: "generating",
    progress: 50,
    message: "AI is reviewing documents and filling the LOA template…",
  });

  const generatingStartedAt = Date.now();
  const heartbeat = setInterval(() => {
    const minutes = Math.floor((Date.now() - generatingStartedAt) / 60000);
    report({
      stage: "generating",
      progress: Math.min(88, 50 + minutes * 3),
      message: `AI is still processing your documents (${minutes} min so far)…`,
    });
  }, 30_000);

  let result;
  try {
    result = await generateLOA(template, contextDocuments);
  } finally {
    clearInterval(heartbeat);
  }

  report({
    stage: "finalizing",
    progress: 95,
    message: "Preparing your completed LOA…",
  });

  onProgress({
    stage: "complete",
    progress: 100,
    message: "LOA generation complete.",
    elapsedMs: elapsedMs(),
    result,
  });
}
