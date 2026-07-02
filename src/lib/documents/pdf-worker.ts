import { createRequire } from "node:module";
import path from "node:path";

let configured = false;

export async function configurePdfWorker(): Promise<void> {
  if (configured) return;

  const { PDFParse } = await import("pdf-parse");
  const require = createRequire(import.meta.url);
  const pdfParseEntry = require.resolve("pdf-parse");
  const workerPath = path.join(
    path.dirname(pdfParseEntry),
    "../esm/pdf.worker.mjs",
  );

  PDFParse.setWorker(workerPath);
  configured = true;
}
