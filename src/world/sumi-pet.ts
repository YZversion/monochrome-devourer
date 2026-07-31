import { Assets, Container, Rectangle, Sprite, Texture } from "pixi.js";
import sumiSpriteSheetUrl from "../assets/pets/sumi.png";
import type { Direction } from "./input";
import { PetAnimation, type PetAnimationState } from "./pet-animation";

const CELL_WIDTH = 192;
const CELL_HEIGHT = 208;
const SPEED = 190;
const HORIZONTAL_EXTENT = CELL_WIDTH / 2;
const VERTICAL_EXTENT = CELL_HEIGHT / 2;

const ROWS: Record<PetAnimationState, { row: number; frames: number }> = {
  idle: { row: 0, frames: 6 },
  down: { row: 1, frames: 8 },
  up: { row: 2, frames: 8 },
  left: { row: 3, frames: 8 },
  right: { row: 4, frames: 8 },
};

type PetTextures = Record<PetAnimationState, Texture[]>;

function createTextures(atlas: Texture): PetTextures {
  atlas.source.scaleMode = "nearest";
  const textures = {} as PetTextures;

  for (const [state, spec] of Object.entries(ROWS) as [
    PetAnimationState,
    { row: number; frames: number },
  ][]) {
    textures[state] = Array.from(
      { length: spec.frames },
      (_, column) =>
        new Texture({
          source: atlas.source,
          frame: new Rectangle(
            column * CELL_WIDTH,
            spec.row * CELL_HEIGHT,
            CELL_WIDTH,
            CELL_HEIGHT,
          ),
          label: `sumi-${state}-${column}`,
        }),
    );
  }

  return textures;
}

export class SumiPet {
  public readonly view = new Container();
  private readonly animation = new PetAnimation();
  private readonly sprite: Sprite;

  private constructor(private readonly textures: PetTextures) {
    this.sprite = new Sprite(textures.idle[0]);
    this.sprite.anchor.set(0.5);
    this.sprite.roundPixels = true;
    this.view.addChild(this.sprite);
    this.view.eventMode = "static";
    this.view.cursor = "pointer";
    this.view.on("pointerdown", (event) => {
      event.stopPropagation();
    });
  }

  public static async create(): Promise<SumiPet> {
    const atlas = await Assets.load<Texture>(sumiSpriteSheetUrl);
    return new SumiPet(createTextures(atlas));
  }

  public place(x: number, y: number): void {
    this.view.position.set(Math.round(x), Math.round(y));
  }

  public containsClientPoint(x: number, y: number): boolean {
    return (
      Math.abs(x - this.view.x) <= HORIZONTAL_EXTENT &&
      Math.abs(y - this.view.y) <= VERTICAL_EXTENT
    );
  }

  public update(input: Direction, dt: number, width: number, height: number): void {
    const pose = this.animation.update(input, dt);
    this.sprite.texture = this.textures[pose.state][pose.frame];

    const nextX = this.view.x + input.x * SPEED * dt;
    const nextY = this.view.y + input.y * SPEED * dt;
    this.view.x = Math.round(
      Math.max(HORIZONTAL_EXTENT, Math.min(width - HORIZONTAL_EXTENT, nextX)),
    );
    this.view.y = Math.round(
      Math.max(VERTICAL_EXTENT, Math.min(height - VERTICAL_EXTENT, nextY)),
    );
  }

  public resetAnimation(): void {
    const pose = this.animation.reset();
    this.sprite.texture = this.textures[pose.state][pose.frame];
  }
}
