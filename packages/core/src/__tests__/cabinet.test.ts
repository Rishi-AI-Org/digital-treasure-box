import { describe, expect, it } from "vitest";
import { createSecretShareId, enforceVisibleLimit } from "../cabinet";
import type { CabinetItem } from "../types";

describe("cabinet rules", () => {
  it("archives items beyond the visible limit", () => {
    const items = Array.from({ length: 23 }, (_, index) => makeItem(index));
    const result = enforceVisibleLimit(items);

    expect(result.filter((item) => item.visibility === "visible")).toHaveLength(21);
    expect(result.filter((item) => item.visibility === "archived")).toHaveLength(2);
  });

  it("generates unguessable share ids", () => {
    const id = createSecretShareId();
    expect(id.length).toBeGreaterThanOrEqual(20);
    expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

function makeItem(position: number): CabinetItem {
  return {
    id: `item-${position}`,
    userId: "user-1",
    cabinetId: "cabinet-1",
    sourceType: "link",
    visibility: "visible",
    position,
    title: `Item ${position}`,
    tags: [],
    createdAt: new Date(position * 1000).toISOString(),
    updatedAt: new Date(position * 1000).toISOString()
  };
}

