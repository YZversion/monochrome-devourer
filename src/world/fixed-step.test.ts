import { describe, expect, it, vi } from "vitest";
import { FixedStepClock } from "./fixed-step";

describe("FixedStepClock", () => {
  it("advances simulation at a fixed 60 Hz step", () => {
    const tick = vi.fn();
    const clock = new FixedStepClock(1 / 60);

    const result = clock.advance(1 / 30, tick);

    expect(result.steps).toBe(2);
    expect(tick).toHaveBeenCalledTimes(2);
    expect(tick).toHaveBeenNthCalledWith(1, 1 / 60);
  });

  it("discards accumulated time when reset on collapse", () => {
    const tick = vi.fn();
    const clock = new FixedStepClock(1 / 60);

    clock.advance(1 / 120, tick);
    clock.reset();
    const result = clock.advance(1 / 120, tick);

    expect(result.steps).toBe(0);
    expect(tick).not.toHaveBeenCalled();
  });

  it("caps catch-up work after a long stall", () => {
    const tick = vi.fn();
    const clock = new FixedStepClock(1 / 60, 0.25, 8);

    const result = clock.advance(10, tick);

    expect(result.steps).toBe(8);
    expect(tick).toHaveBeenCalledTimes(8);
  });
});
