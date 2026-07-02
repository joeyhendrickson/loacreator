import { runGeneration } from "@/lib/generation/run-generation";
import type { GenerationProgressEvent } from "@/lib/generation/progress";

// Vercel Hobby max is 300s. Local dev does not enforce this strictly.
export const maxDuration = 300;

export async function POST(request: Request) {
  const formData = await request.formData();
  const startTime = Date.now();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (update: GenerationProgressEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(update)}\n`));
      };

      try {
        await runGeneration(formData, send, startTime);
      } catch (error) {
        console.error("LOA generation failed:", error);
        const message =
          error instanceof Error ? error.message : "Failed to generate LOA.";
        send({
          stage: "error",
          progress: 0,
          message,
          error: message,
          elapsedMs: Date.now() - startTime,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
