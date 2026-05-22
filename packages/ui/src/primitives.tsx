import type { PropsWithChildren } from "react";

export function RetroFrame({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <div className={`retro-frame ${className}`.trim()}>{children}</div>;
}

export function ItemChrome({ children, tone = "light" }: PropsWithChildren<{ tone?: "light" | "dark" }>) {
  return <article className={`item-chrome item-chrome-${tone}`}>{children}</article>;
}

