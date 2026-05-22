import { MAX_VISIBLE_ITEMS, type CabinetItem } from "./types";

export function enforceVisibleLimit(items: CabinetItem[], maxVisible = MAX_VISIBLE_ITEMS): CabinetItem[] {
  const visible = items
    .filter((item) => item.visibility === "visible")
    .sort(compareVisibleItems);

  const overflowIds = new Set(visible.slice(maxVisible).map((item) => item.id));

  return normalizePositions(
    items.map((item) =>
      overflowIds.has(item.id)
        ? { ...item, visibility: "archived", position: null, updatedAt: new Date().toISOString() }
        : item
    )
  );
}

export function normalizePositions(items: CabinetItem[]): CabinetItem[] {
  let position = 0;
  const visible = items
    .filter((item) => item.visibility === "visible")
    .sort(compareVisibleItems)
    .map((item) => ({ ...item, position: position++ }));

  const byId = new Map(visible.map((item) => [item.id, item]));
  return items.map((item) => byId.get(item.id) ?? (item.visibility === "visible" ? { ...item, position: null } : item));
}

export function moveItem(items: CabinetItem[], itemId: string, direction: "up" | "down"): CabinetItem[] {
  const visible = items
    .filter((item) => item.visibility === "visible")
    .sort(compareVisibleItems);
  const index = visible.findIndex((item) => item.id === itemId);

  if (index < 0) {
    return items;
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= visible.length) {
    return items;
  }

  const nextVisible = [...visible];
  const current = nextVisible[index];
  const target = nextVisible[targetIndex];
  if (!current || !target) {
    return items;
  }

  nextVisible[index] = target;
  nextVisible[targetIndex] = current;

  const reordered = new Map(
    nextVisible.map((item, nextPosition) => [item.id, { ...item, position: nextPosition }])
  );

  return items.map((item) => reordered.get(item.id) ?? item);
}

export function createSecretShareId(byteLength = 18): string {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

function compareVisibleItems(a: CabinetItem, b: CabinetItem): number {
  const positionA = a.position ?? Number.MAX_SAFE_INTEGER;
  const positionB = b.position ?? Number.MAX_SAFE_INTEGER;
  if (positionA !== positionB) {
    return positionA - positionB;
  }

  return Date.parse(a.createdAt) - Date.parse(b.createdAt);
}

function base64UrlEncode(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
