import type { CreateCaptureRequest } from "@dtb/api";
import { buildArchiveSearchDocument, type CabinetItem } from "@dtb/core";
import { createEmbedding } from "./embeddings";
import { resolveCaptureMetadata } from "./metadata";

export interface WorkerCapturePayload extends CreateCaptureRequest {
  itemId?: string;
  ownerId?: string;
}

interface JobEnv {
  OPENAI_API_KEY?: string;
  EMBEDDING_MODEL?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export async function processCaptureJob(payload: WorkerCapturePayload, env: JobEnv): Promise<void> {
  const metadata = await resolveCaptureMetadata(payload);
  const document = buildArchiveSearchDocument({
    id: payload.itemId ?? "pending",
    userId: payload.ownerId ?? "pending",
    cabinetId: payload.cabinetId ?? "pending",
    sourceType: "link",
    visibility: "inbox",
    position: null,
    canonicalUrl: metadata.canonicalUrl,
    title: metadata.title ?? payload.title ?? metadata.canonicalUrl,
    note: payload.note,
    tags: payload.tags ?? [],
    metadata,
    embed: metadata.embed,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as CabinetItem);
  const embedding = await createEmbedding(document, env);

  if (payload.itemId) {
    await updateSupabaseItem(payload.itemId, {
      canonical_url: metadata.canonicalUrl,
      title: metadata.title ?? payload.title,
      provider_metadata: metadata,
      embed_config: metadata.embed ?? {},
      embedding,
      safety_status: "safe",
      updated_at: new Date().toISOString()
    }, env);
  }
}

async function updateSupabaseItem(itemId: string, update: Record<string, unknown>, env: JobEnv): Promise<void> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }

  const cleanUpdate = Object.fromEntries(Object.entries(update).filter(([, value]) => value !== undefined));

  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/cabinet_items?id=eq.${itemId}`, {
    method: "PATCH",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
      prefer: "return=minimal"
    },
    body: JSON.stringify(cleanUpdate)
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase item update failed with ${response.status}: ${detail}`);
  }
}
