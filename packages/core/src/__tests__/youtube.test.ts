import { describe, expect, it } from "vitest";
import { buildYouTubeEmbedUrl, parseYouTubeClip, readTimeParam } from "../youtube";

describe("youtube clips", () => {
  it("parses watch URLs with timestamp params", () => {
    expect(parseYouTubeClip("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m15s")).toEqual({
      videoId: "dQw4w9WgXcQ",
      startSeconds: 75
    });
  });

  it("builds embed URLs with absolute start and end seconds", () => {
    expect(
      buildYouTubeEmbedUrl({
        videoId: "dQw4w9WgXcQ",
        startSeconds: 90,
        endSeconds: 135
      })
    ).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&start=90&end=135");
  });

  it("drops invalid end values that are before the start", () => {
    expect(
      buildYouTubeEmbedUrl({
        videoId: "dQw4w9WgXcQ",
        startSeconds: 120,
        endSeconds: 30
      })
    ).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&start=120");
  });

  it("reads compact time strings", () => {
    expect(readTimeParam("2h3m4s")).toBe(7384);
  });
});

