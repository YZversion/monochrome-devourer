import type { Direction } from "./input";

export type PetAnimationState = "idle" | "down" | "up" | "left" | "right";

export interface PetPose {
  state: PetAnimationState;
  frame: number;
}

const IDLE_DURATIONS = [0.28, 0.11, 0.11, 0.14, 0.14, 0.32] as const;
const WALK_DURATIONS = [0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.22] as const;

function stateForDirection(input: Direction): PetAnimationState {
  if (input.x === 0 && input.y === 0) {
    return "idle";
  }
  if (Math.abs(input.x) >= Math.abs(input.y)) {
    return input.x < 0 ? "left" : "right";
  }
  return input.y < 0 ? "up" : "down";
}

function durationsForState(state: PetAnimationState): readonly number[] {
  return state === "idle" ? IDLE_DURATIONS : WALK_DURATIONS;
}

export class PetAnimation {
  private state: PetAnimationState = "idle";
  private frame = 0;
  private elapsed = 0;

  public update(input: Direction, dt: number): PetPose {
    const nextState = stateForDirection(input);
    if (nextState !== this.state) {
      this.state = nextState;
      this.frame = 0;
      this.elapsed = 0;
    }

    const durations = durationsForState(this.state);
    this.elapsed += Math.max(0, dt);
    while (this.elapsed >= durations[this.frame]) {
      this.elapsed -= durations[this.frame];
      this.frame = (this.frame + 1) % durations.length;
    }

    return this.read();
  }

  public reset(): PetPose {
    this.state = "idle";
    this.frame = 0;
    this.elapsed = 0;
    return this.read();
  }

  public read(): PetPose {
    return { state: this.state, frame: this.frame };
  }
}
