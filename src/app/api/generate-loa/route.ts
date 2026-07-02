import { NextResponse } from "next/server";

import { MAX_CONTEXT_DOCUMENTS } from "@/lib/constants";
import { generateLOA, parseUploadedFile } from "@/lib/openai/generate-loa";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const templateFile = formData.get("template");

    if (!(templateFile instanceof File) || templateFile.size === 0) {
      return NextResponse.json(
        { error: "An LOA template file is required." },
        { status: 400 },
      );
    }

    const contextFiles = formData
      .getAll("documents")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (contextFiles.length === 0) {
      return NextResponse.json(
        { error: "At least one context document is required." },
        { status: 400 },
      );
    }

    if (contextFiles.length > MAX_CONTEXT_DOCUMENTS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_CONTEXT_DOCUMENTS} context documents allowed.` },
        { status: 400 },
      );
    }

    const [template, ...contextDocuments] = await Promise.all([
      parseUploadedFile(templateFile),
      ...contextFiles.map(parseUploadedFile),
    ]);

    const result = await generateLOA(template, contextDocuments);

    return NextResponse.json(result);
  } catch (error) {
    console.error("LOA generation failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate LOA.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
