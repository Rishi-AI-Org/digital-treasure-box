import { describe, expect, it } from "vitest";
import { parsePublicUrl } from "../url";

describe("public URL parsing", () => {
  it("normalizes bare domains", () => {
    expect(parsePublicUrl("example.com")).toMatchObject({
      ok: true,
      normalizedUrl: "https://example.com/"
    });
  });

  it("blocks local network targets", () => {
    expect(parsePublicUrl("http://127.0.0.1:3000")).toEqual({
      ok: false,
      reason: "private_host"
    });
  });
});

