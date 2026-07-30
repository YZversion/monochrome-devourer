export interface Direction {
  x: number;
  y: number;
}

export interface KeyboardEventTarget {
  addEventListener(
    type: "keydown" | "keyup",
    listener: (event: KeyboardEvent) => void,
    options?: AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: "keydown" | "keyup",
    listener: (event: KeyboardEvent) => void,
  ): void;
}

const DIRECTION_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

export class DirectionInput {
  private readonly pressed = new Set<string>();
  private active = false;

  public constructor(private readonly target: KeyboardEventTarget = window) {}

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.active || !DIRECTION_KEYS.has(event.key)) {
      return;
    }
    event.preventDefault();
    this.pressed.add(event.key);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    if (!this.active || !DIRECTION_KEYS.has(event.key)) {
      return;
    }
    event.preventDefault();
    this.pressed.delete(event.key);
  };

  public setActive(active: boolean): void {
    if (active === this.active) {
      return;
    }

    this.active = active;
    this.pressed.clear();
    if (active) {
      this.target.addEventListener("keydown", this.onKeyDown, { passive: false });
      this.target.addEventListener("keyup", this.onKeyUp, { passive: false });
    } else {
      this.target.removeEventListener("keydown", this.onKeyDown);
      this.target.removeEventListener("keyup", this.onKeyUp);
    }
  }

  public read(): Direction {
    const x =
      Number(this.pressed.has("ArrowRight")) -
      Number(this.pressed.has("ArrowLeft"));
    const y =
      Number(this.pressed.has("ArrowDown")) -
      Number(this.pressed.has("ArrowUp"));
    const length = Math.hypot(x, y);

    return length > 0 ? { x: x / length, y: y / length } : { x: 0, y: 0 };
  }

  public destroy(): void {
    this.setActive(false);
  }
}
