import type { CreateCaptureRequest, ResolveCaptureResponse } from "@dtb/api";
import { createEmbedding } from "./embeddings";
import { processCaptureJob, type WorkerCapturePayload } from "./jobs";
import { resolveCaptureMetadata } from "./metadata";

interface Env {
  CAPTURE_QUEUE?: Queue<WorkerCapturePayload>;
  CAPTURE_WORKER_TOKEN: string;
  OPENAI_API_KEY?: string;
  EMBEDDING_MODEL?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({ ok: true });
    }

    if (url.pathname === "/captures/resolve" && request.method === "POST") {
      const unauthorized = authorize(request, env);
      if (unauthorized) {
        return unauthorized;
      }

      const payload = (await request.json()) as CreateCaptureRequest;
      const metadata = await resolveCaptureMetadata(payload);
      const response: ResolveCaptureResponse = {
        metadata,
        status: "ready"
      };

      return json(response, 202);
    }

    if (url.pathname === "/captures/enqueue" && request.method === "POST") {
      const unauthorized = authorize(request, env);
      if (unauthorized) {
        return unauthorized;
      }

      if (!env.CAPTURE_QUEUE) {
        return json({ error: "Queue binding is missing." }, 500);
      }

      const payload = (await request.json()) as WorkerCapturePayload;
      await env.CAPTURE_QUEUE.send(payload);
      return json({ status: "queued" }, 202);
    }

    if (url.pathname === "/archive/embed" && request.method === "POST") {
      const unauthorized = authorize(request, env);
      if (unauthorized) {
        return unauthorized;
      }

      const body = (await request.json()) as { text?: string };
      if (!body.text) {
        return json({ error: "Text is required." }, 400);
      }

      const embedding = await createEmbedding(body.text, env);
      return json({ embedding }, 200);
    }

    return json({ error: "Not found" }, 404);
  },

  async queue(batch: MessageBatch<WorkerCapturePayload>, env: Env): Promise<void> {
    await Promise.all(
      batch.messages.map(async (message) => {
        await processCaptureJob(message.body, env);
        message.ack();
      })
    );
  }
};

function authorize(request: Request, env: Env): Response | null {
  const expected = `Bearer ${env.CAPTURE_WORKER_TOKEN}`;
  if (request.headers.get("authorization") !== expected) {
    return json({ error: "Unauthorized" }, 401);
  }

  return null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer"
    }
  });
}
