export const MAX_VISIBLE_ITEMS = 21;

export type ItemSourceType =
  | "link"
  | "youtube"
  | "x_post"
  | "instagram"
  | "spotify"
  | "quote"
  | "text"
  | "image"
  | "unknown";

export type ItemVisibility = "visible" | "archived" | "inbox";

export type CaptureStatus =
  | "pending"
  | "processing"
  | "ready"
  | "failed"
  | "blocked";

export interface YouTubeClip {
  videoId: string;
  startSeconds?: number;
  endSeconds?: number;
}

export interface EmbedConfig {
  provider: "youtube" | "x" | "instagram" | "spotify" | "generic";
  kind: "iframe" | "scriptless-oembed" | "link-card";
  src?: string;
  html?: string;
  aspectRatio?: "16/9" | "9/16" | "1/1" | "auto";
}

export interface ProviderMetadata {
  canonicalUrl: string;
  provider: EmbedConfig["provider"];
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  embed?: EmbedConfig;
}

export interface CabinetItem {
  id: string;
  userId: string;
  cabinetId: string;
  sourceType: ItemSourceType;
  visibility: ItemVisibility;
  position: number | null;
  originalUrl?: string;
  canonicalUrl?: string;
  title: string;
  note?: string;
  tags: string[];
  quoteText?: string;
  embed?: EmbedConfig;
  metadata?: ProviderMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface CapturePayload {
  url?: string;
  text?: string;
  title?: string;
  note?: string;
  tags?: string[];
  sourceApp?: string;
  selectedText?: string;
  youtubeStartSeconds?: number;
  youtubeEndSeconds?: number;
}

