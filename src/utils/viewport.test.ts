import { describe, expect, it } from "vitest";
import { interpolateViewport, panViewport, zoomViewport } from "./viewport";

const baseViewport = { centerX: 0, centerY: 0, scale: 1, rotation: 0 };

describe("viewport math", () => {
  it("interpolates scale in log space", () => {
    const a = { ...baseViewport, scale: 1 };
    const b = { ...baseViewport, scale: 100 };
    const mid = interpolateViewport(a, b, 0.5);
    expect(mid.scale).toBeCloseTo(10, 6);
  });

  it("zooms around screen center without drifting", () => {
    const next = zoomViewport(baseViewport, 0.5, 50, 50, 100, 100);
    expect(next.centerX).toBeCloseTo(0, 6);
    expect(next.centerY).toBeCloseTo(0, 6);
    expect(next.scale).toBeCloseTo(0.5, 6);
  });

  it("pans by screen delta scaled to world units", () => {
    const next = panViewport(baseViewport, 10, -5);
    expect(next.centerX).toBeCloseTo(-10, 6);
    expect(next.centerY).toBeCloseTo(5, 6);
  });
});
