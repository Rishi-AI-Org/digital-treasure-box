"use client";

import {
  Archive,
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  Inbox,
  LinkIcon,
  Plus,
  Search,
  Shield
} from "lucide-react";
import {
  MAX_VISIBLE_ITEMS,
  enforceVisibleLimit,
  localArchiveSearch,
  moveItem,
  type CabinetItem
} from "@dtb/core";
import type { CreateCaptureResponse } from "@dtb/api";
import type { ArchiveSearchResponse } from "@dtb/api";
import { useEffect, useMemo, useState } from "react";
import { EmbedRenderer } from "./EmbedRenderer";

interface DashboardShellProps {
  initialItems: CabinetItem[];
  cabinet: {
    title: string;
    ownerName: string;
    shareId: string;
    theme: "mono" | "ruby" | "forest" | "paper";
  };
  cabinetId: string;
}

export function DashboardShell({ initialItems, cabinet, cabinetId }: DashboardShellProps) {
  const [items, setItems] = useState<CabinetItem[]>(initialItems);
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialItems[0]?.id ?? "");
  const [theme, setTheme] = useState(cabinet.theme);
  const [error, setError] = useState("");
  const [remoteArchiveItems, setRemoteArchiveItems] = useState<CabinetItem[] | null>(null);

  const visibleItems = useMemo(
    () =>
      items
        .filter((item) => item.visibility === "visible")
        .sort((a, b) => (a.position ?? 999) - (b.position ?? 999)),
    [items]
  );
  const inboxItems = items.filter((item) => item.visibility === "inbox");
  const localArchiveItems = localArchiveSearch(
    items.filter((item) => item.visibility === "archived"),
    query
  );
  const archiveItems = remoteArchiveItems ?? localArchiveItems;
  const selectedItem = items.find((item) => item.id === selectedId) ?? visibleItems[0] ?? items[0];

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/archive/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        if (!response.ok) {
          setRemoteArchiveItems(null);
          return;
        }

        const data = (await response.json()) as ArchiveSearchResponse;
        setRemoteArchiveItems(data.items);
      } catch {
        if (!controller.signal.aborted) {
          setRemoteArchiveItems(null);
        }
      }
    }, 220);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  async function addCapture() {
    setError("");
    const response = await fetch("/api/captures", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        cabinetId,
        url,
        note,
        sourceApp: "web-paste"
      })
    });

    if (!response.ok) {
      setError("This URL cannot be captured.");
      return;
    }

    const data = (await response.json()) as CreateCaptureResponse;
    if (data.capture.item) {
      setItems((current) => [data.capture.item!, ...current]);
      setSelectedId(data.capture.item.id);
      setUrl("");
      setNote("");
    }
  }

  async function setVisibility(itemId: string, visibility: CabinetItem["visibility"]) {
    setItems((current) => {
      const next = current.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const position =
          visibility === "visible"
            ? current.filter((candidate) => candidate.visibility === "visible").length
            : null;

        return { ...item, visibility, position, updatedAt: new Date().toISOString() };
      });

      return enforceVisibleLimit(next);
    });

    const response = await fetch(`/api/items/${itemId}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ visibility })
    });

    if (response.ok) {
      const data = (await response.json()) as { item: CabinetItem };
      setItems((current) => current.map((item) => (item.id === itemId ? data.item : item)));
    }
  }

  function updateSelected(patch: Partial<CabinetItem>) {
    if (!selectedItem) {
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === selectedItem.id
          ? { ...item, ...patch, updatedAt: new Date().toISOString() }
          : item
      )
    );
  }

  function updateTags(value: string) {
    updateSelected({
      tags: value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    });
  }

  async function saveSelectedItem() {
    if (!selectedItem) {
      return;
    }

    const response = await fetch(`/api/items/${selectedItem.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        title: selectedItem.title,
        note: selectedItem.note ?? "",
        tags: selectedItem.tags
      })
    });

    if (response.ok) {
      const data = (await response.json()) as { item: CabinetItem };
      setItems((current) => current.map((item) => (item.id === selectedItem.id ? data.item : item)));
    }
  }

  async function moveVisibleItem(itemId: string, direction: "up" | "down") {
    setItems((current) => moveItem(current, itemId, direction));
    const response = await fetch(`/api/items/${itemId}/move`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ direction })
    });

    if (response.ok) {
      const data = (await response.json()) as { items: CabinetItem[] };
      const byId = new Map(data.items.map((item) => [item.id, item]));
      setItems((current) => current.map((item) => byId.get(item.id) ?? item));
    }
  }

  return (
    <main className={`app-shell theme-${theme}`}>
      <section className="topbar">
        <div>
          <p className="eyebrow">Private cabinet</p>
          <h1>{cabinet.title}</h1>
        </div>
        <a className="public-link" href={`/c/${cabinet.shareId}`} target="_blank" rel="noreferrer">
          <Eye size={18} />
          Public view
        </a>
      </section>

      <section className="workspace-grid">
        <aside className="control-rail">
          <form
            className="capture-panel"
            onSubmit={(event) => {
              event.preventDefault();
              addCapture();
            }}
          >
            <label>
              <span>Capture URL</span>
              <div className="input-row">
                <LinkIcon size={18} />
                <input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://..."
                />
              </div>
            </label>
            <label>
              <span>Note</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="primary-action" type="submit">
              <Plus size={18} />
              Save capture
            </button>
          </form>

          <div className="theme-panel">
            <p className="panel-label">Theme</p>
            <div className="segmented">
              {(["mono", "ruby", "forest", "paper"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={theme === option ? "active" : ""}
                  onClick={() => setTheme(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="privacy-panel">
            <Shield size={19} />
            <span>No public index, no likes, no follower graph.</span>
          </div>
        </aside>

        <section className="shelf-column">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Visible shelf</p>
              <h2>{visibleItems.length}/{MAX_VISIBLE_ITEMS}</h2>
            </div>
          </div>

          <div className="visible-shelf">
            {Array.from({ length: MAX_VISIBLE_ITEMS }, (_, index) => {
              const item = visibleItems[index];
              return item ? (
                <article
                  key={item.id}
                  className={`shelf-item ${selectedId === item.id ? "selected" : ""}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="item-actions">
                    <button title="Move up" type="button" onClick={() => void moveVisibleItem(item.id, "up")}>
                      <ArrowUp size={15} />
                    </button>
                    <button title="Move down" type="button" onClick={() => void moveVisibleItem(item.id, "down")}>
                      <ArrowDown size={15} />
                    </button>
                    <button title="Archive" type="button" onClick={() => void setVisibility(item.id, "archived")}>
                      <Archive size={15} />
                    </button>
                  </div>
                  <EmbedRenderer item={item} compact />
                  <h3>{item.title}</h3>
                  {item.note ? <p>{item.note}</p> : null}
                </article>
              ) : (
                <div key={`slot-${index}`} className="empty-slot">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="right-rail">
          <section className="editor-panel">
            <p className="panel-label">Selected item</p>
            {selectedItem ? (
              <>
                <input
                  className="title-input"
                  value={selectedItem.title}
                  onChange={(event) => updateSelected({ title: event.target.value })}
                />
                <textarea
                  value={selectedItem.note ?? ""}
                  onChange={(event) => updateSelected({ note: event.target.value })}
                  rows={4}
                />
                <input
                  value={selectedItem.tags.join(", ")}
                  onChange={(event) => updateTags(event.target.value)}
                  placeholder="tags"
                />
                {selectedItem.canonicalUrl ? (
                  <a className="source-link" href={selectedItem.canonicalUrl} target="_blank" rel="noreferrer">
                    <ExternalLink size={16} />
                    Source
                  </a>
                ) : null}
                <button className="primary-action" type="button" onClick={() => void saveSelectedItem()}>
                  Save item
                </button>
              </>
            ) : (
              <p className="muted">No item selected.</p>
            )}
          </section>

          <section className="inbox-panel">
            <div className="panel-title-row">
              <Inbox size={18} />
              <p className="panel-label">Inbox</p>
            </div>
            {inboxItems.map((item) => (
              <button key={item.id} className="queue-item" type="button" onClick={() => setSelectedId(item.id)}>
                <span>{item.title}</span>
                <Eye size={15} onClick={() => void setVisibility(item.id, "visible")} />
              </button>
            ))}
            {inboxItems.length === 0 ? <p className="muted">Inbox empty.</p> : null}
          </section>

          <section className="archive-panel">
            <div className="panel-title-row">
              <Search size={18} />
              <p className="panel-label">Archive</p>
            </div>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search archive" />
            <div className="archive-results">
              {archiveItems.map((item) => (
                <button key={item.id} className="queue-item" type="button" onClick={() => setSelectedId(item.id)}>
                  <span>{item.title}</span>
                  <Plus size={15} onClick={() => void setVisibility(item.id, "visible")} />
                </button>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
