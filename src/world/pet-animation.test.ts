import { describe, expect, it } from "vitest";
import { PetAnimation } from "./pet-animation";

describe("PetAnimation", () => {
  it("maps WASD direction vectors to the matching movement row", () => {
    const animation = new PetAnimation();

    expect(animation.update({ x: 0, y: -1 }, 0).state).toBe("up");
    expect(animation.update({ x: 0, y: 1 }, 0).state).toBe("down");
    expect(animation.update({ x: -1, y: 0 }, 0).state).toBe("left");
    expect(animation.update({ x: 1, y: 0 }, 0).state).toBe("right");
  });

  it("uses horizontal facing for an exact diagonal", () => {
    const animation = new PetAnimation();

    expect(animation.update({ x: -Math.SQRT1_2, y: -Math.SQRT1_2 }, 0).state).toBe(
      "left",
    );
  });

  it("advances walk frames and resets to the idle loop when movement stops", () => {
    const animation = new PetAnimation();

    expect(animation.update({ x: 1, y: 0 }, 0.12)).toEqual({
      state: "right",
      frame: 1,
    });
    expect(animation.update({ x: 0, y: 0 }, 0)).toEqual({
      state: "idle",
      frame: 0,
    });
  });

  it("resets animation state for a collapsed world", () => {
    const animation = new PetAnimation();
    animation.update({ x: 0, y: 1 }, 0.5);

    expect(animation.reset()).toEqual({ state: "idle", frame: 0 });
  });
});
