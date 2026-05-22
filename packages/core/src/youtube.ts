import type { EmbedConfig, YouTubeClip } from "./types";

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export function parseYouTubeClip(input: string, overrides: Partial<YouTubeClip> = {}): YouTubeClip | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  let videoId: string | null = null;

  if (host === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
  }

  if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/")) {
      videoId = url.pathname.split("/").filter(Boolean)[1] ?? null;
    }
  }

  if (!videoId || !YOUTUBE_ID_PATTERN.test(videoId)) {
    return null;
  }

  const startSeconds =
    overrides.startSeconds ??
    readTimeParam(url.searchParams.get("start")) ??
    readTimeParam(url.searchParams.get("t"));
  const endSeconds = overrides.endSeconds ?? readTimeParam(url.searchParams.get("end"));

  const clip: YouTubeClip = { videoId };
  if (startSeconds !== undefined) {
    clip.startSeconds = startSeconds;
  }
  if (endSeconds !== undefined) {
    clip.endSeconds = endSeconds;
  }

  return sanitizeYouTubeClip(clip);
}

export function sanitizeYouTubeClip(clip: YouTubeClip): YouTubeClip {
  const clean: YouTubeClip = { videoId: clip.videoId };
  const start = positiveIntegerOrUndefined(clip.startSeconds);
  const end = positiveIntegerOrUndefined(clip.endSeconds);

  if (start !== undefined) {
    clean.startSeconds = start;
  }

  if (end !== undefined && (start === undefined || end > start)) {
    clean.endSeconds = end;
  }

  return clean;
}

export function buildYouTubeEmbedUrl(clip: YouTubeClip): string {
  const clean = sanitizeYouTubeClip(clip);
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1"
  });

  if (clean.startSeconds !== undefined) {
    params.set("start", String(clean.startSeconds));
  }

  if (clean.endSeconds !== undefined) {
    params.set("end", String(clean.endSeconds));
  }

  return `https://www.youtube.com/embed/${clean.videoId}?${params.toString()}`;
}

export function buildYouTubeEmbedConfig(clip: YouTubeClip): EmbedConfig {
  return {
    provider: "youtube",
    kind: "iframe",
    src: buildYouTubeEmbedUrl(clip),
    aspectRatio: "16/9"
  };
}

export function readTimeParam(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  if (/^\d+$/.test(value)) {
    return positiveIntegerOrUndefined(Number(value));
  }

  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/.exec(value);
  if (!match) {
    return undefined;
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const total = hours * 3600 + minutes * 60 + seconds;
  return positiveIntegerOrUndefined(total);
}

function positiveIntegerOrUndefined(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  const rounded = Math.max(0, Math.floor(value));
  return rounded > 0 ? rounded : undefined;
}
