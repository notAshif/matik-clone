import { describe, it, expect } from "bun:test";
import { calculateElo } from "./index";

describe("calculateElo", () => {
  it("rewards winning equally rated players with +16 points", () => {
    const { newRatingA, deltaA } = calculateElo(1200, 1200, 1);
    expect(deltaA).toBe(16);
    expect(newRatingA).toBe(1216);
  });

  it("penalizes losing equally rated players with -16 points", () => {
    const { newRatingA, deltaA } = calculateElo(1200, 1200, 0);
    expect(deltaA).toBe(-16);
    expect(newRatingA).toBe(1184);
  });

  it("rewards upset win against higher rated player with more points", () => {
    const { newRatingA, deltaA } = calculateElo(1000, 1400, 1);
    expect(deltaA).toBeGreaterThan(25);
    expect(newRatingA).toBe(1000 + deltaA);
  });

  it("penalizes upset loss against lower rated player with more points", () => {
    const { newRatingA, deltaA } = calculateElo(1400, 1000, 0);
    expect(deltaA).toBeLessThan(-25);
    expect(newRatingA).toBe(1400 + deltaA);
  });

  it("leaves ratings identical or nearly identical on tie between equal players", () => {
    const { newRatingA, deltaA } = calculateElo(1200, 1200, 0.5);
    expect(deltaA).toBe(0);
    expect(newRatingA).toBe(1200);
  });

  it("enforces rating floor of 100", () => {
    const { newRatingA, deltaA } = calculateElo(105, 1800, 0);
    expect(newRatingA).toBeGreaterThanOrEqual(100);
  });
});
