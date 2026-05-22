import type { CabinetItem } from "./types";

export function buildArchiveSearchDocument(item: CabinetItem): string {
  return [
    item.title,
    item.note,
    item.quoteText,
    item.canonicalUrl,
    item.metadata?.description,
    item.metadata?.siteName,
    ...item.tags
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 8000);
}

export function localArchiveSearch(items: CabinetItem[], query: string): CabinetItem[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) {
    return items;
  }

  return items.filter((item) => {
    const haystack = buildArchiveSearchDocument(item).toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

