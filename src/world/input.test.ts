import { describe, expect, it } from "vitest";
import { DirectionInput, type KeyboardEventTarget } from "./input";

class FakeKeyboardTarget implements KeyboardEventTarget {
  private readonly listeners = new Map<
    "keydown" | "keyup",
    Set<(event: KeyboardEvent) => void>
  >();

  public addEventListener(
    type: "keydown" | "keyup",
    listener: (event: KeyboardEvent) => void,
  ): void {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  public removeEventListener(
    type: "keydown" | "keyup",
    listener: (event: KeyboardEvent) => void,
  ): void {
    this.listeners.get(type)?.delete(listener);
  }

  public dispatch(type: "keydown" | "keyup", code: string): boolean {
    let prevented = false;
    const event = {
      code,
      preventDefault: () => {
        prevented = true;
      },
    } as KeyboardEvent;
    this.listeners.get(type)?.forEach((listener) => listener(event));
    return prevented;
  }

  public listenerCount(): number {
    return [...this.listeners.values()].reduce(
      (total, listeners) => total + listeners.size,
      0,
    );
  }
}

describe("DirectionInput", () => {
  it("does not capture WASD while collapsed", () => {
    const target = new FakeKeyboardTarget();
    const input = new DirectionInput(target);

    expect(target.listenerCount()).toBe(0);
    expect(target.dispatch("keydown", "KeyD")).toBe(false);
    expect(input.read()).toEqual({ x: 0, y: 0 });
  });

  it("captures only WASD while active", () => {
    const target = new FakeKeyboardTarget();
    const input = new DirectionInput(target);
    input.setActive(true);

    expect(target.listenerCount()).toBe(2);
    expect(target.dispatch("keydown", "ArrowRight")).toBe(false);
    expect(target.dispatch("keydown", "KeyD")).toBe(true);
    expect(input.read()).toEqual({ x: 1, y: 0 });

    expect(target.dispatch("keydown", "KeyW")).toBe(true);
    expect(input.read().x).toBeCloseTo(Math.SQRT1_2);
    expect(input.read().y).toBeCloseTo(-Math.SQRT1_2);
  });

  it("removes listeners and clears held keys when collapsed", () => {
    const target = new FakeKeyboardTarget();
    const input = new DirectionInput(target);
    input.setActive(true);
    target.dispatch("keydown", "KeyD");

    input.setActive(false);

    expect(target.listenerCount()).toBe(0);
    expect(input.read()).toEqual({ x: 0, y: 0 });
    expect(target.dispatch("keydown", "KeyD")).toBe(false);
  });
});
