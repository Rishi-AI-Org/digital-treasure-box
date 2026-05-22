import type { EmbedConfig, ProviderMetadata } from "./types";
import { parsePublicUrl } from "./url";
import { buildYouTubeEmbedConfig, parseYouTubeClip } from "./youtube";

export const EMBED_ALLOWLIST = new Set([
  "youtube.com",
  "youtu.be",
  "m.youtube.com",
  "x.com",
  "twitter.com",
  "instagram.com",
  "open.spotify.com"
]);

export function buildProviderMetadata(inputUrl: string): ProviderMetadata {
  const parsed = parsePublicUrl(inputUrl);
  if (!parsed.ok) {
    throw new Error(`Cannot build metadata for URL: ${parsed.reason}`);
  }

  if (parsed.provider === "youtube") {
    const clip = parseYouTubeClip(parsed.normalizedUrl);
    if (clip) {
      return {
        canonicalUrl: parsed.normalizedUrl,
        provider: "youtube",
        title: "YouTube clip",
        embed: buildYouTubeEmbedConfig(clip)
      };
    }
  }

  return {
    canonicalUrl: parsed.normalizedUrl,
    provider: providerNameForHost(parsed.url.hostname),
    title: parsed.url.hostname,
    embed: buildFallbackLinkCard(parsed.normalizedUrl)
  };
}

export function buildFallbackLinkCard(url: string): EmbedConfig {
  return {
    provider: "generic",
    kind: "link-card",
    src: url,
    aspectRatio: "auto"
  };
}

function providerNameForHost(hostname: string): ProviderMetadata["provider"] {
  const host = hostname.replace(/^www\./i, "").toLowerCase();

  if (host === "x.com" || host === "twitter.com") {
    return "x";
  }

  if (host === "instagram.com") {
    return "instagram";
  }

  if (host === "open.spotify.com") {
    return "spotify";
  }

  return "generic";
}

