import type { PublicCabinetResponse } from "@dtb/api";
import type { CabinetItem, EmbedConfig, ItemSourceType, ItemVisibility, ProviderMetadata } from "@dtb/core";
import { buildArchiveSearchDocument, buildProviderMetadata, createSecretShareId, parsePublicUrl } from "@dtb/core";
import { getDemoCabinet, getDemoPublicCabinet } from "./demo-data";
import { createSupabaseServiceClient } from "./supabase-server";

interface CabinetRow {
  id: string;
  owner_id: string;
  title: string;
  theme: "mono" | "ruby" | "forest" | "paper";
}

interface ProfileRow {
  id: string;
  display_name: string;
}

interface ShareLinkRow {
  share_id: string;
  cabinet_id: string;
  status: "active" | "paused" | "revoked";
}

interface ItemRow {
  id: string;
  cabinet_id: string;
  owner_id: string;
  source_type: ItemSourceType;
  visibility: ItemVisibility;
  position: number | null;
  original_url: string | null;
  canonical_url: string | null;
  title: string;
  note: string | null;
  quote_text: string | null;
  tags: string[];
  provider_metadata: ProviderMetadata | Record<string, never>;
  embed_config: EmbedConfig | Record<string, never>;
  created_at: string;
  updated_at: string;
}

export interface UserCabinetData extends PublicCabinetResponse {
  cabinetId: string;
}

export async function getUserCabinet(userId: string): Promise<UserCabinetData> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    const demo = getDemoCabinet();
    return { ...demo, cabinetId: "demo-cabinet" };
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", userId)
    .single<ProfileRow>();

  if (!profile) {
    const { data: createdProfile } = await supabase
      .from("profiles")
      .insert({ id: userId, display_name: "Anonymous curator" })
      .select("id, display_name")
      .single<ProfileRow>();

    profile = createdProfile;
  }

  let { data: cabinet } = await supabase
    .from("cabinets")
    .select("id, owner_id, title, theme")
    .eq("owner_id", userId)
    .single<CabinetRow>();

  if (!cabinet) {
    const { data: createdCabinet } = await supabase
      .from("cabinets")
      .insert({ owner_id: userId })
      .select("id, owner_id, title, theme")
      .single<CabinetRow>();

    if (!createdCabinet) {
      throw new Error("Cabinet was not found for this user.");
    }

    cabinet = createdCabinet;
  }

  let { data: shareLink } = await supabase
    .from("share_links")
    .select("share_id, cabinet_id, status")
    .eq("cabinet_id", cabinet.id)
    .eq("status", "active")
    .single<ShareLinkRow>();

  if (!shareLink) {
    const { data: createdShareLink } = await supabase
      .from("share_links")
      .insert({ cabinet_id: cabinet.id, share_id: createSecretShareId() })
      .select("share_id, cabinet_id, status")
      .single<ShareLinkRow>();

    shareLink = createdShareLink;
  }

  const { data: rows } = await supabase
    .from("cabinet_items")
    .select("*")
    .eq("cabinet_id", cabinet.id)
    .order("position", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<ItemRow[]>();

  return {
    cabinetId: cabinet.id,
    cabinet: {
      title: cabinet.title,
      ownerName: profile?.display_name ?? "Anonymous curator",
      shareId: shareLink?.share_id ?? createSecretShareId(),
      theme: cabinet.theme
    },
    items: (rows ?? []).map(mapItemRow)
  };
}

export async function getPublicCabinetByShareId(shareId: string): Promise<PublicCabinetResponse | null> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return getDemoPublicCabinet(shareId);
  }

  const { data: shareLink } = await supabase
    .from("share_links")
    .select("share_id, cabinet_id, status")
    .eq("share_id", shareId)
    .eq("status", "active")
    .single<ShareLinkRow>();

  if (!shareLink) {
    return null;
  }

  const { data: cabinet } = await supabase
    .from("cabinets")
    .select("id, owner_id, title, theme")
    .eq("id", shareLink.cabinet_id)
    .single<CabinetRow>();

  if (!cabinet) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", cabinet.owner_id)
    .single<ProfileRow>();

  const { data: rows } = await supabase
    .from("cabinet_items")
    .select("*")
    .eq("cabinet_id", cabinet.id)
    .eq("visibility", "visible")
    .order("position", { ascending: true })
    .returns<ItemRow[]>();

  return {
    cabinet: {
      title: cabinet.title,
      ownerName: profile?.display_name ?? "Anonymous curator",
      shareId,
      theme: cabinet.theme
    },
    items: (rows ?? []).map(mapItemRow)
  };
}

export async function createCaptureForUser(input: {
  userId: string;
  cabinetId: string;
  url: string;
  title?: string;
  note?: string;
  tags?: string[];
  sourceApp?: string;
}) {
  const parsed = parsePublicUrl(input.url);
  if (!parsed.ok) {
    throw new Error(parsed.reason);
  }

  const metadata = buildProviderMetadata(parsed.normalizedUrl);
  const now = new Date().toISOString();
  const supabase = createSupabaseServiceClient();

  const item: CabinetItem = {
    id: crypto.randomUUID(),
    userId: input.userId,
    cabinetId: input.cabinetId,
    sourceType: parsed.provider,
    visibility: "inbox",
    position: null,
    originalUrl: input.url,
    canonicalUrl: metadata.canonicalUrl,
    title: input.title || metadata.title || parsed.url.hostname,
    tags: input.tags ?? [],
    metadata,
    createdAt: now,
    updatedAt: now
  };

  if (input.note) {
    item.note = input.note;
  }
  if (metadata.embed) {
    item.embed = metadata.embed;
  }

  if (!supabase) {
    return item;
  }

  const { data, error } = await supabase
    .from("cabinet_items")
    .insert({
      cabinet_id: input.cabinetId,
      owner_id: input.userId,
      source_type: parsed.provider,
      visibility: "inbox",
      original_url: input.url,
      canonical_url: metadata.canonicalUrl,
      title: item.title,
      note: input.note,
      tags: input.tags ?? [],
      provider_metadata: metadata,
      embed_config: metadata.embed ?? {}
    })
    .select("*")
    .single<ItemRow>();

  if (error) {
    throw error;
  }

  const savedItem = mapItemRow(data);
  const payload: Record<string, unknown> = {
    url: input.url
  };
  if (input.title) {
    payload.title = input.title;
  }
  if (input.note) {
    payload.note = input.note;
  }
  if (input.tags) {
    payload.tags = input.tags;
  }
  if (input.sourceApp) {
    payload.sourceApp = input.sourceApp;
  }

  await supabase.from("capture_jobs").insert({
    cabinet_id: input.cabinetId,
    owner_id: input.userId,
    item_id: savedItem.id,
    status: "pending",
    payload
  });

  void enqueueWorkerCapture({
    ...payload,
    itemId: savedItem.id,
    ownerId: input.userId,
    cabinetId: input.cabinetId
  });

  return savedItem;
}

export async function updateItemForUser(
  userId: string,
  itemId: string,
  patch: {
    title?: string;
    note?: string;
    tags?: string[];
    visibility?: ItemVisibility;
  }
): Promise<CabinetItem> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    throw new Error("Persistence is not configured.");
  }

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (patch.title !== undefined) {
    update.title = patch.title;
  }
  if (patch.note !== undefined) {
    update.note = patch.note;
  }
  if (patch.tags !== undefined) {
    update.tags = patch.tags;
  }
  if (patch.visibility !== undefined) {
    update.visibility = patch.visibility;
    update.position = patch.visibility === "visible" ? await nextVisiblePosition(userId) : null;
  }

  const { data, error } = await supabase
    .from("cabinet_items")
    .update(update)
    .eq("id", itemId)
    .eq("owner_id", userId)
    .select("*")
    .single<ItemRow>();

  if (error) {
    throw error;
  }

  return mapItemRow(data);
}

export async function moveItemForUser(userId: string, itemId: string, direction: "up" | "down"): Promise<CabinetItem[]> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    throw new Error("Persistence is not configured.");
  }

  const { data: currentRows, error } = await supabase
    .from("cabinet_items")
    .select("*")
    .eq("owner_id", userId)
    .eq("visibility", "visible")
    .order("position", { ascending: true })
    .returns<ItemRow[]>();

  if (error) {
    throw error;
  }

  const rows = currentRows ?? [];
  const index = rows.findIndex((row) => row.id === itemId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= rows.length) {
    return rows.map(mapItemRow);
  }

  const reordered = [...rows];
  const current = reordered[index];
  const target = reordered[targetIndex];
  if (!current || !target) {
    return rows.map(mapItemRow);
  }

  reordered[index] = target;
  reordered[targetIndex] = current;

  await Promise.all(
    reordered.map((row, position) =>
      supabase.from("cabinet_items").update({ position, updated_at: new Date().toISOString() }).eq("id", row.id)
    )
  );

  return reordered.map((row, position) => mapItemRow({ ...row, position }));
}

export async function searchArchiveForUser(userId: string, query: string): Promise<CabinetItem[]> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return [];
  }

  const queryEmbedding = query.trim() ? await createQueryEmbedding(query) : null;
  if (queryEmbedding) {
    const { data: semanticRows, error: semanticError } = await supabase
      .rpc("match_archive_items", {
        match_owner_id: userId,
        query_embedding: queryEmbedding,
        match_count: 20
      })
      .returns<ItemRow[]>();

    if (!semanticError && Array.isArray(semanticRows)) {
      return semanticRows.map((row) => mapItemRow(row as ItemRow));
    }
  }

  const { data: rows, error } = await supabase
    .from("cabinet_items")
    .select("*")
    .eq("owner_id", userId)
    .eq("visibility", "archived")
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<ItemRow[]>();

  if (error) {
    throw error;
  }

  const terms = query.trim().toLowerCase();
  const items = (rows ?? []).map(mapItemRow);
  if (!terms) {
    return items;
  }

  return items.filter((item) => buildArchiveSearchDocument(item).toLowerCase().includes(terms));
}

function mapItemRow(row: ItemRow): CabinetItem {
  const metadata = isEmptyObject(row.provider_metadata) ? undefined : row.provider_metadata;
  const embed = isEmptyObject(row.embed_config) ? undefined : row.embed_config;
  const item: CabinetItem = {
    id: row.id,
    userId: row.owner_id,
    cabinetId: row.cabinet_id,
    sourceType: row.source_type,
    visibility: row.visibility,
    position: row.position,
    title: row.title,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  if (row.original_url) {
    item.originalUrl = row.original_url;
  }
  if (row.canonical_url) {
    item.canonicalUrl = row.canonical_url;
  }
  if (row.note) {
    item.note = row.note;
  }
  if (row.quote_text) {
    item.quoteText = row.quote_text;
  }
  if (metadata) {
    item.metadata = metadata as ProviderMetadata;
  }
  if (embed) {
    item.embed = embed as EmbedConfig;
  }

  return item;
}

async function nextVisiblePosition(userId: string): Promise<number> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return 0;
  }

  const { count } = await supabase
    .from("cabinet_items")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)
    .eq("visibility", "visible");

  return count ?? 0;
}

async function enqueueWorkerCapture(payload: Record<string, unknown>) {
  const workerUrl = process.env.CAPTURE_WORKER_URL;
  const token = process.env.CAPTURE_WORKER_TOKEN;
  if (!workerUrl || !token) {
    return;
  }

  await fetch(`${workerUrl}/captures/enqueue`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  }).catch(() => undefined);
}

async function createQueryEmbedding(query: string): Promise<number[] | null> {
  const workerUrl = process.env.CAPTURE_WORKER_URL;
  const token = process.env.CAPTURE_WORKER_TOKEN;
  if (!workerUrl || !token) {
    return null;
  }

  const response = await fetch(`${workerUrl}/archive/embed`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ text: query })
  }).catch(() => null);

  if (!response?.ok) {
    return null;
  }

  const data = (await response.json()) as { embedding?: number[] | null };
  return data.embedding ?? null;
}

function isEmptyObject(value: unknown): boolean {
  return !value || (typeof value === "object" && Object.keys(value).length === 0);
}
