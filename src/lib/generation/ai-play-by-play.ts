export interface DocumentSummary {
  name: string;
  type: "text" | "image";
  textLength: number;
}

export interface GeneratingPlayByPlayContext {
  templateName: string;
  templateTextLength: number;
  documents: DocumentSummary[];
  model: string;
}

function formatChars(count: number): string {
  if (count < 1000) return `${count.toLocaleString()} characters`;
  if (count < 1_000_000) return `${(count / 1000).toFixed(1)}K characters`;
  return `${(count / 1_000_000).toFixed(2)}M characters`;
}

export function buildInitialPlayByPlay(
  context: GeneratingPlayByPlayContext,
): string[] {
  const textDocs = context.documents.filter((doc) => doc.type === "text");
  const imageDocs = context.documents.filter((doc) => doc.type === "image");
  const totalTextChars =
    context.templateTextLength +
    textDocs.reduce((sum, doc) => sum + doc.textLength, 0);

  const lines = [
    `Using ${context.model} to fill the LOA for AT&T → CallTower porting.`,
    `LOA template: ${context.templateName} (${formatChars(context.templateTextLength)} extracted)`,
    `Context package: ${context.documents.length} file(s) — ${textDocs.length} text/PDF/Word, ${imageDocs.length} image(s)`,
    `Total text sent to AI: ~${formatChars(totalTextChars)}`,
    "Files included in this AI request:",
  ];

  for (const doc of context.documents) {
    if (doc.type === "image") {
      lines.push(`• ${doc.name} — image (vision OCR for porting fields)`);
    } else {
      lines.push(`• ${doc.name} — ${formatChars(doc.textLength)} extracted text`);
    }
  }

  lines.push(
    "The AI will map these sources to LOA fields such as BTN, account numbers, authorized contacts, service addresses, and PINs.",
    "Each filled field will include evidence, source excerpts, and a confidence score.",
  );

  return lines;
}

export function buildRotationPlayByPlay(
  context: GeneratingPlayByPlayContext,
): string[] {
  const steps: string[] = [];

  for (const doc of context.documents) {
    if (doc.type === "image") {
      steps.push(
        `Reading ${doc.name} with vision — looking for account numbers, phone numbers, and authorized names…`,
      );
    } else {
      steps.push(
        `Analyzing ${doc.name} — searching for BTNs, billing details, and porting authorization data…`,
      );
    }
  }

  steps.push(
    `Matching values from ${context.documents.length} source file(s) to fields in ${context.templateName}…`,
    "Extracting billing telephone numbers (BTN) and AT&T account identifiers…",
    "Identifying authorized signer names, titles, and company legal names…",
    "Pulling service addresses and customer contact information…",
    "Checking PINs, account numbers, and port dates where present…",
    "Comparing source documents for conflicting values…",
    "Assigning confidence levels (high / medium / low) per field…",
    "Writing evidence notes and source excerpts for each LOA field…",
    "Building the completed LOA form text for download…",
    "Formatting structured JSON output for review and export…",
  );

  return steps;
}

export function createPlayByPlayTracker(context: GeneratingPlayByPlayContext) {
  const activityLog = buildInitialPlayByPlay(context);
  const rotationSteps = buildRotationPlayByPlay(context);
  let rotationIndex = 0;
  let lastRotationAt = Date.now();
  const rotationIntervalMs = 12_000;

  return {
    getLog(): string[] {
      return [...activityLog];
    },
    getLatestMessage(): string {
      return activityLog[activityLog.length - 1] ?? "Generating LOA with AI…";
    },
    tick(): boolean {
      const now = Date.now();
      if (now - lastRotationAt < rotationIntervalMs) {
        return false;
      }

      activityLog.push(rotationSteps[rotationIndex % rotationSteps.length]);
      rotationIndex++;
      lastRotationAt = now;
      return true;
    },
    complete(): void {
      activityLog.push(
        "AI response received — validating LOA fields and evidence…",
      );
    },
  };
}
