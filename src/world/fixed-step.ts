export interface FixedStepResult {
  steps: number;
  alpha: number;
}

export class FixedStepClock {
  private accumulatorSeconds = 0;

  public constructor(
    public readonly stepSeconds = 1 / 60,
    private readonly maxFrameSeconds = 0.25,
    private readonly maxStepsPerFrame = 8,
  ) {
    if (stepSeconds <= 0) {
      throw new Error("stepSeconds must be positive");
    }
  }

  public advance(elapsedSeconds: number, tick: (dt: number) => void): FixedStepResult {
    const clampedElapsed = Math.max(
      0,
      Math.min(elapsedSeconds, this.maxFrameSeconds),
    );
    this.accumulatorSeconds += clampedElapsed;

    let steps = 0;
    while (
      this.accumulatorSeconds >= this.stepSeconds &&
      steps < this.maxStepsPerFrame
    ) {
      tick(this.stepSeconds);
      this.accumulatorSeconds -= this.stepSeconds;
      steps += 1;
    }

    if (steps === this.maxStepsPerFrame) {
      this.accumulatorSeconds %= this.stepSeconds;
    }

    return {
      steps,
      alpha: this.accumulatorSeconds / this.stepSeconds,
    };
  }

  public reset(): void {
    this.accumulatorSeconds = 0;
  }
}
