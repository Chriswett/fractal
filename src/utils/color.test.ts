import { describe, expect, it } from "vitest";
import { sampleGradient } from "./color";

const stops = [
  { t: 0, color: { r: 0, g: 0, b: 0, a: 1 } },
  { t: 1, color: { r: 1, g: 1, b: 1, a: 1 } }
];

describe("color utilities", () => {
  it("samples gradient endpoints", () => {
    expect(sampleGradient(stops, 0)).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    expect(sampleGradient(stops, 1)).toEqual({ r: 1, g: 1, b: 1, a: 1 });
  });

  it("interpolates between stops", () => {
    const mid = sampleGradient(stops, 0.5);
    expect(mid.r).toBeCloseTo(0.5, 6);
    expect(mid.g).toBeCloseTo(0.5, 6);
    expect(mid.b).toBeCloseTo(0.5, 6);
  });
});
