import type { ItemSourceType } from "./types";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^0\.0\.0\.0$/,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^\[?::1\]?$/i
];

export interface ParsedUrl {
  ok: true;
  url: URL;
  normalizedUrl: string;
  provider: ItemSourceType;
}

export interface UrlParseError {
  ok: false;
  reason: "missing_url" | "invalid_url" | "unsupported_protocol" | "private_host";
}

export function parsePublicUrl(input?: string): ParsedUrl | UrlParseError {
  if (!input?.trim()) {
    return { ok: false, reason: "missing_url" };
  }

  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    try {
      url = new URL(`https://${input.trim()}`);
    } catch {
      return { ok: false, reason: "invalid_url" };
    }
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return { ok: false, reason: "unsupported_protocol" };
  }

  if (isPrivateHost(url.hostname)) {
    return { ok: false, reason: "private_host" };
  }

  url.hash = "";
  return {
    ok: true,
    url,
    normalizedUrl: url.toString(),
    provider: detectSourceType(url)
  };
}

export function detectSourceType(url: URL): ItemSourceType {
  const host = url.hostname.replace(/^www\./i, "").toLowerCase();

  if (host === "youtube.com" || host === "youtu.be" || host === "m.youtube.com") {
    return "youtube";
  }

  if (host === "x.com" || host === "twitter.com" || host === "mobile.twitter.com") {
    return "x_post";
  }

  if (host === "instagram.com") {
    return "instagram";
  }

  if (host === "open.spotify.com") {
    return "spotify";
  }

  return "link";
}

export function isPrivateHost(hostname: string): boolean {
  return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}
