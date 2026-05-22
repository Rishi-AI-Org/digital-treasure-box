import type { CabinetItem } from "@dtb/core";

interface EmbedRendererProps {
  item: CabinetItem;
  compact?: boolean;
}

export function EmbedRenderer({ item, compact = false }: EmbedRendererProps) {
  const embed = item.embed ?? item.metadata?.embed;

  if (embed?.kind === "iframe" && embed.src) {
    return (
      <div className={`embed-box ${compact ? "compact" : ""}`} style={{ aspectRatio: embed.aspectRatio ?? "16/9" }}>
        <iframe
          src={embed.src}
          title={item.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
      </div>
    );
  }

  if (item.metadata?.imageUrl) {
    return (
      <div className={`image-preview ${compact ? "compact" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.metadata.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
      </div>
    );
  }

  return (
    <div className={`link-card ${compact ? "compact" : ""}`}>
      <span>{item.sourceType}</span>
      <strong>{item.title}</strong>
      {item.canonicalUrl ? <small>{new URL(item.canonicalUrl).hostname.replace(/^www\./, "")}</small> : null}
    </div>
  );
}

