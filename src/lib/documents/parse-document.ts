import mammoth from "mammoth";

export interface ParseResult {
  text: string;
  type: "text" | "image";
  mimeType: string;
  base64?: string;
}

const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

export async function parseDocument(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<ParseResult> {
  const normalizedMime = mimeType || guessMimeType(fileName);

  if (IMAGE_TYPES.has(normalizedMime)) {
    return {
      text: `[Image document: ${fileName}]`,
      type: "image",
      mimeType: normalizedMime,
      base64: buffer.toString("base64"),
    };
  }

  if (normalizedMime === "application/pdf") {
    const { extractText } = await import("unpdf");
    const { text } = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    });
    return {
      text: text.trim() || `[PDF had no extractable text: ${fileName}]`,
      type: "text",
      mimeType: normalizedMime,
    };
  }

  if (
    normalizedMime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    normalizedMime === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value.trim() || `[Word doc had no extractable text: ${fileName}]`,
      type: "text",
      mimeType: normalizedMime,
    };
  }

  if (
    normalizedMime === "text/plain" ||
    normalizedMime === "text/csv" ||
    normalizedMime.includes("spreadsheet") ||
    normalizedMime.includes("excel")
  ) {
    return {
      text: buffer.toString("utf-8").trim(),
      type: "text",
      mimeType: normalizedMime,
    };
  }

  return {
    text: buffer.toString("utf-8").trim() || `[Unsupported or empty file: ${fileName}]`,
    type: "text",
    mimeType: normalizedMime,
  };
}

function guessMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    txt: "text/plain",
    csv: "text/csv",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return map[ext ?? ""] ?? "application/octet-stream";
}
