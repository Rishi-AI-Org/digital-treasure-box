import {
  buildFallbackLinkCard,
  buildYouTubeEmbedConfig,
  parseYouTubeClip,
  type CabinetItem
} from "@dtb/core";
import type { PublicCabinetResponse } from "@dtb/api";

const now = new Date("2026-05-22T12:00:00.000Z").toISOString();

const youtubeClip = parseYouTubeClip("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&end=92");

const videoItem: CabinetItem = {
  id: "item-1",
  userId: "demo-user",
  cabinetId: "demo-cabinet",
  sourceType: "youtube",
  visibility: "visible",
  position: 0,
  originalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&end=92",
  canonicalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  title: "A perfect 50-second video fragment",
  note: "Saved for the exact middle stretch.",
  tags: ["video", "reference"],
  createdAt: now,
  updatedAt: now
};

if (youtubeClip) {
  videoItem.embed = buildYouTubeEmbedConfig(youtubeClip);
}

const items: CabinetItem[] = [
  videoItem,
  {
    id: "item-2",
    userId: "demo-user",
    cabinetId: "demo-cabinet",
    sourceType: "quote",
    visibility: "visible",
    position: 1,
    title: "Line I keep returning to",
    note: "The shelf should feel selected, not accumulated.",
    quoteText: "A small thing can carry a whole season.",
    tags: ["quote", "memory"],
    createdAt: now,
    updatedAt: now
  },
  {
    id: "item-3",
    userId: "demo-user",
    cabinetId: "demo-cabinet",
    sourceType: "link",
    visibility: "visible",
    position: 2,
    canonicalUrl: "https://oembed.com/",
    title: "oEmbed specification",
    note: "The quiet backbone for safer previews.",
    tags: ["web", "architecture"],
    embed: buildFallbackLinkCard("https://oembed.com/"),
    createdAt: now,
    updatedAt: now
  },
  {
    id: "item-4",
    userId: "demo-user",
    cabinetId: "demo-cabinet",
    sourceType: "link",
    visibility: "archived",
    position: null,
    canonicalUrl: "https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag",
    title: "Noindex reference",
    note: "Privacy signal, not access control.",
    tags: ["privacy", "search"],
    embed: buildFallbackLinkCard("https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag"),
    createdAt: now,
    updatedAt: now
  }
];

export function getDemoCabinet(): PublicCabinetResponse {
  return {
    cabinet: {
      title: "Current taste, not a feed",
      ownerName: "Rishi",
      shareId: "demo-private-cabinet",
      theme: "mono"
    },
    items
  };
}

export function getDemoPublicCabinet(shareId: string): PublicCabinetResponse {
  const data = getDemoCabinet();
  return {
    cabinet: {
      ...data.cabinet,
      shareId
    },
    items: data.items.filter((item) => item.visibility === "visible")
  };
}
