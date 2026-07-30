import { Container, Graphics } from "pixi.js";
import type { Direction } from "./input";

const PIXEL = 4;
const SPEED = 190;

export class PixelCreature {
  public readonly view = new Container();
  private readonly body = new Graphics();
  private direction = 1;

  public constructor() {
    this.draw();
    this.view.addChild(this.body);
    this.view.eventMode = "static";
    this.view.cursor = "pointer";
    this.view.on("pointerdown", (event) => {
      event.stopPropagation();
    });
  }

  public place(x: number, y: number): void {
    this.view.position.set(Math.round(x), Math.round(y));
  }

  public containsClientPoint(x: number, y: number): boolean {
    return (
      Math.abs(x - this.view.x) <= 16 * PIXEL &&
      Math.abs(y - this.view.y) <= 10 * PIXEL
    );
  }

  public update(input: Direction, dt: number, width: number, height: number): void {
    if (input.x !== 0) {
      this.direction = Math.sign(input.x);
    }

    const halfWidth = 13 * PIXEL;
    const halfHeight = 9 * PIXEL;
    const nextX = this.view.x + input.x * SPEED * dt;
    const nextY = this.view.y + input.y * SPEED * dt;
    this.view.x = Math.round(Math.max(halfWidth, Math.min(width - halfWidth, nextX)));
    this.view.y = Math.round(
      Math.max(halfHeight, Math.min(height - halfHeight, nextY)),
    );
    this.body.scale.x = this.direction;
  }

  private draw(): void {
    const g = this.body;

    // Two-tone silhouette: black exterior remains visible on bright desktops,
    // while the white interior remains visible on dark desktops.
    g.rect(-13 * PIXEL, -6 * PIXEL, 26 * PIXEL, 12 * PIXEL).fill(0x000000);
    g.rect(-10 * PIXEL, -8 * PIXEL, 17 * PIXEL, 16 * PIXEL).fill(0x000000);
    g.rect(-7 * PIXEL, -9 * PIXEL, 11 * PIXEL, 18 * PIXEL).fill(0x000000);

    g.rect(-11 * PIXEL, -4 * PIXEL, 22 * PIXEL, 8 * PIXEL).fill(0xffffff);
    g.rect(-8 * PIXEL, -6 * PIXEL, 13 * PIXEL, 12 * PIXEL).fill(0xffffff);

    // Head, eye, tail and monochrome dithering.
    g.rect(7 * PIXEL, -3 * PIXEL, 7 * PIXEL, 6 * PIXEL).fill(0xffffff);
    g.rect(10 * PIXEL, -2 * PIXEL, 2 * PIXEL, 2 * PIXEL).fill(0x000000);
    g.rect(-15 * PIXEL, -PIXEL, 4 * PIXEL, 2 * PIXEL).fill(0xffffff);
    g.rect(-5 * PIXEL, -4 * PIXEL, PIXEL, PIXEL).fill(0x000000);
    g.rect(-PIXEL, 2 * PIXEL, PIXEL, PIXEL).fill(0x000000);
    g.rect(3 * PIXEL, -2 * PIXEL, PIXEL, PIXEL).fill(0x000000);
  }
}
