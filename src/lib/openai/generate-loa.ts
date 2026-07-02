import OpenAI from "openai";

import { parseDocument } from "@/lib/documents/parse-document";
import { LOA_SYSTEM_PROMPT, LOA_USER_PROMPT } from "@/lib/prompts/loa-prompt";
import type { LOAGenerationResult, ParsedDocument } from "@/lib/types";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-5.5";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return new OpenAI({
    apiKey,
    // Allow long-running LOA generation to finish without client-side cutoff.
    timeout: 2 * 60 * 60 * 1000,
    maxRetries: 3,
  });
}

const responseSchema = {
  type: "object",
  properties: {
    fields: {
      type: "array",
      items: {
        type: "object",
        properties: {
          fieldName: { type: "string" },
          value: { type: "string" },
          sourceDocument: { type: "string" },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low", "none"],
          },
          evidence: {
            type: "object",
            properties: {
              rationale: { type: "string" },
              sourceExcerpt: { type: "string" },
            },
            required: ["rationale", "sourceExcerpt"],
            additionalProperties: false,
          },
        },
        required: [
          "fieldName",
          "value",
          "sourceDocument",
          "confidence",
          "evidence",
        ],
        additionalProperties: false,
      },
    },
    completedLoa: { type: "string" },
    notes: {
      type: "array",
      items: { type: "string" },
    },
    missingFields: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["fields", "completedLoa", "notes", "missingFields"],
  additionalProperties: false,
} as const;

export async function parseUploadedFile(
  file: File,
): Promise<ParsedDocument> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await parseDocument(buffer, file.type, file.name);

  return {
    name: file.name,
    text: parsed.text,
    type: parsed.type,
    mimeType: parsed.mimeType,
    base64: parsed.base64,
  };
}

export async function generateLOA(
  template: ParsedDocument,
  contextDocuments: ParsedDocument[],
): Promise<LOAGenerationResult> {
  const textDocuments = contextDocuments.filter((doc) => doc.type === "text");
  const imageDocuments = contextDocuments.filter((doc) => doc.type === "image");

  const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    {
      type: "text",
      text: LOA_USER_PROMPT(
        template.name,
        template.text,
        textDocuments.map((doc) => ({
          name: doc.name,
          content: doc.text,
        })),
      ),
    },
  ];

  for (const image of imageDocuments) {
    if (!image.base64) continue;
    userContent.push({
      type: "text",
      text: `\n\nSource image: ${image.name}`,
    });
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:${image.mimeType};base64,${image.base64}`,
      },
    });
  }

  const openai = getOpenAIClient();

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: LOA_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "loa_generation_result",
        strict: true,
        schema: responseSchema,
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  return JSON.parse(content) as LOAGenerationResult;
}
