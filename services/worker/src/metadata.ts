import type { CreateCaptureRequest } from "@dtb/api";
import { buildFallbackLinkCard, buildProviderMetadata, parsePublicUrl, type ProviderMetadata } from "@dtb/core";
import { assertSafeCaptureUrl } from "./security";

const HTML_BYTES_LIMIT = 250_000;

export async function resolveCaptureMetadata(payload: CreateCaptureRequest): Promise<ProviderMetadata> {
  const parsed = parsePublicUrl(payload.url);
  if (!parsed.ok) {
    throw new Error(`Invalid capture URL: ${parsed.reason}`);
  }

  assertSafeCaptureUrl(parsed.url);

  const providerMetadata = buildProviderMetadata(parsed.normalizedUrl);
  if (providerMetadata.provider !== "generic") {
    return providerMetadata;
  }

  const og = await fetchOpenGraph(parsed.url);
  const metadata: ProviderMetadata = {
    canonicalUrl: og.canonicalUrl ?? parsed.normalizedUrl,
    provider: "generic",
    title: og.title ?? payload.title ?? parsed.url.hostname,
    embed: buildFallbackLinkCard(og.canonicalUrl ?? parsed.normalizedUrl)
  };

  if (og.description) {
    metadata.description = og.description;
  }
  if (og.imageUrl) {
    metadata.imageUrl = og.imageUrl;
  }
  if (og.siteName) {
    metadata.siteName = og.siteName;
  }

  return metadata;
}

async function fetchOpenGraph(url: URL): Promise<Partial<ProviderMetadata>> {
  const response = await fetch(url.toString(), {
    redirect: "follow",
    headers: {
      accept: "text/html,application/xhtml+xml"
    },
    signal: AbortSignal.timeout(5000)
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("text/html")) {
    return {};
  }

  const html = (await response.text()).slice(0, HTML_BYTES_LIMIT);
  const metadata: Partial<ProviderMetadata> = {};
  const title = readMeta(html, "og:title") ?? readTitle(html);
  const description = readMeta(html, "og:description") ?? readMeta(html, "description");
  const imageUrl = absolutize(readMeta(html, "og:image"), url);
  const siteName = readMeta(html, "og:site_name");
  const canonicalUrl = absolutize(readMeta(html, "og:url") ?? readCanonical(html), url);

  if (title) {
    metadata.title = title;
  }
  if (description) {
    metadata.description = description;
  }
  if (imageUrl) {
    metadata.imageUrl = imageUrl;
  }
  if (siteName) {
    metadata.siteName = siteName;
  }
  if (canonicalUrl) {
    metadata.canonicalUrl = canonicalUrl;
  }

  return metadata;
}

function readMeta(html: string, key: string): string | undefined {
  const propertyPattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escapeRegExp(key)}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const contentFirstPattern = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapeRegExp(key)}["'][^>]*>`,
    "i"
  );

  return decodeHtml(propertyPattern.exec(html)?.[1] ?? contentFirstPattern.exec(html)?.[1]);
}

function readTitle(html: string): string | undefined {
  return decodeHtml(/<title[^>]*>([^<]+)<\/title>/i.exec(html)?.[1]);
}

function readCanonical(html: string): string | undefined {
  return decodeHtml(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i.exec(html)?.[1]);
}

function absolutize(value: string | undefined, base: URL): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value, base).toString();
  } catch {
    return undefined;
  }
}

function decodeHtml(value: string | undefined): string | undefined {
  return value
    ?.replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
