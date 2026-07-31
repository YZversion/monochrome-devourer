import { Application, Graphics } from "pixi.js";
import type { Direction } from "./input";
import { SumiPet } from "./sumi-pet";

const directions = {
  idle: { x: 0, y: 0 },
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  down: { x: 0, y: 1 },
  right: { x: 1, y: 0 },
} satisfies Record<string, Direction>;

type PreviewState = keyof typeof directions;

const preview = document.querySelector<HTMLDivElement>("#preview");
const stateOutput = document.querySelector<HTMLOutputElement>("#state");
const buttons = [...document.querySelectorAll<HTMLButtonElement>("[data-state]")];
if (!preview || !stateOutput || buttons.length !== 5) {
  throw new Error("Sumi preview controls are incomplete");
}
const previewRoot = preview;
const stateLabel = stateOutput;
const controls = buttons;

const app = new Application();
await app.init({
  width: 854,
  height: 520,
  backgroundAlpha: 0,
  antialias: false,
  autoDensity: true,
  resolution: window.devicePixelRatio,
  preference: "webgl",
  roundPixels: true,
});
previewRoot.append(app.canvas);

const boundsGuide = new Graphics();
boundsGuide
  .rect(1, 1, app.screen.width - 2, app.screen.height - 2)
  .stroke({ color: 0x000000, width: 2, alpha: 0.35 });
app.stage.addChild(boundsGuide);

const pet = await SumiPet.create();
// Fixed logical coordinates keep the QA subject fully visible across browser DPRs.
const center = { x: 300, y: 140 };
pet.place(center.x, center.y);
app.stage.addChild(pet.view);

let activeState: PreviewState = "idle";
let direction: Direction = directions.idle;

function chooseState(state: PreviewState): void {
  activeState = state;
  direction = directions[state];
  pet.place(center.x, center.y);
  stateLabel.value = state.toUpperCase();
  for (const button of controls) {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.state === activeState),
    );
  }
}

for (const button of controls) {
  button.addEventListener("click", () => {
    const state = button.dataset.state as PreviewState;
    chooseState(state);
  });
}

app.ticker.add((ticker) => {
  pet.update(direction, ticker.deltaMS / 1000, app.screen.width, app.screen.height);
  if (activeState !== "idle") {
    pet.place(center.x, center.y);
  }
});
