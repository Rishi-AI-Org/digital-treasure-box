import type { CabinetItem } from "@dtb/core";
import { EmbedRenderer } from "./EmbedRenderer";

interface PublicCabinetProps {
  cabinet: {
    title: string;
    ownerName: string;
    shareId: string;
    theme: "mono" | "ruby" | "forest" | "paper";
  };
  items: CabinetItem[];
}

export function PublicCabinet({ cabinet, items }: PublicCabinetProps) {
  return (
    <main className={`public-cabinet theme-${cabinet.theme}`}>
      <header className="public-header">
        <p className="eyebrow">DTB21</p>
        <h1>{cabinet.ownerName}</h1>
        <p>{cabinet.title}</p>
      </header>

      <section className="public-stack">
        {items.map((item, index) => (
          <article key={item.id} className="public-card">
            <div className="card-index">{String(index + 1).padStart(2, "0")}</div>
            <EmbedRenderer item={item} />
            <div className="public-card-copy">
              <h2>{item.title}</h2>
              {item.note ? <p>{item.note}</p> : null}
              {item.tags.length > 0 ? (
                <div className="tag-row">
                  {item.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
