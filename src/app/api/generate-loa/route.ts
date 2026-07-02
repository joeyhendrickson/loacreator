import { runGeneration } from "@/lib/generation/run-generation";
import type { GenerationProgressEvent } from "@/lib/generation/progress";

// Vercel Hobby caps serverless functions at 300s; allow longer runs locally.
export const maxDuration = process.env.VERCEL ? 300 : 7200;

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
