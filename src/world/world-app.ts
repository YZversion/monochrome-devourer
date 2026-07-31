import { Application, Graphics, Rectangle } from "pixi.js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  collapseWorld,
  getWorldState,
  onWorldState,
  type WorldSnapshot,
} from "../window-runtime";
import { FixedStepClock } from "./fixed-step";
import { DirectionInput } from "./input";
import { SumiPet } from "./sumi-pet";

interface Simulation {
  ticks: number;
  elapsedSeconds: number;
}

export async function mountWorld(root: HTMLDivElement): Promise<void> {
  root.innerHTML = `
    <main class="world" aria-label="展开的黑白星球">
      <output class="world__status" aria-live="off">PAUSED</output>
      <div class="world__hint">W/A/S/D 移动 · Esc 或点击猫咪外部折叠</div>
    </main>
  `;

  const host = root.querySelector<HTMLElement>(".world");
  const status = root.querySelector<HTMLOutputElement>(".world__status");
  if (!host || !status) {
    throw new Error("Failed to create world overlay");
  }

  const app = new Application();
  await app.init({
    resizeTo: window,
    backgroundAlpha: 0,
    antialias: false,
    autoDensity: true,
    resolution: window.devicePixelRatio,
    preference: "webgl",
    roundPixels: true,
    autoStart: false,
  });
  host.prepend(app.canvas);

  const backdrop = new Graphics();
  backdrop.rect(0, 0, 1, 1).fill({ color: 0x000000, alpha: 0.01 });
  backdrop.eventMode = "static";
  backdrop.on("pointerdown", () => {
    void collapseWorld();
  });
  app.stage.addChild(backdrop);

  const creature = await SumiPet.create();
  creature.place(window.innerWidth / 2, window.innerHeight / 2);
  app.stage.addChild(creature.view);

  const onWorldPointerDown = (event: PointerEvent): void => {
    if (active && !creature.containsClientPoint(event.clientX, event.clientY)) {
      void collapseWorld();
    }
  };
  host.addEventListener("pointerdown", onWorldPointerDown);

  const input = new DirectionInput();
  const clock = new FixedStepClock(1 / 60);
  const simulation: Simulation = { ticks: 0, elapsedSeconds: 0 };
  let active = false;
  let fpsSampleStarted = performance.now();
  let renderedFrames = 0;
  let displayedFps = 0;
  let creaturePlaced = false;
  let pausedAtTick: number | null = null;
  let pausedAtTime = 0;
  let lastPauseEvidence = "PAUSE · not measured";

  const resizeScene = (): void => {
    backdrop.clear();
    backdrop
      .rect(0, 0, app.screen.width, app.screen.height)
      .fill({ color: 0x000000, alpha: 0.01 });
    app.stage.hitArea = new Rectangle(0, 0, app.screen.width, app.screen.height);
  };
  resizeScene();
  window.addEventListener("resize", resizeScene);

  app.ticker.add((ticker) => {
    if (!active) {
      return;
    }

    clock.advance(ticker.deltaMS / 1000, (dt) => {
      creature.update(input.read(), dt, app.screen.width, app.screen.height);
      simulation.ticks += 1;
      simulation.elapsedSeconds += dt;
    });

    renderedFrames += 1;
    const now = performance.now();
    const sampleDuration = now - fpsSampleStarted;
    if (sampleDuration >= 500) {
      displayedFps = Math.round((renderedFrames * 1000) / sampleDuration);
      renderedFrames = 0;
      fpsSampleStarted = now;
      status.value =
        `ACTIVE · ${displayedFps} FPS · VIEW ${Math.round(app.screen.width)}×${Math.round(app.screen.height)} · ` +
        `BUFFER ${app.canvas.width}×${app.canvas.height}\n` +
        `TICKS · ${simulation.ticks} · POS ${Math.round(creature.view.x)},${Math.round(creature.view.y)}\n` +
        lastPauseEvidence;
    }
  });

  const applyState = (snapshot: WorldSnapshot): void => {
    if (snapshot.active === active) {
      return;
    }

    active = snapshot.active;
    input.setActive(active);
    if (active) {
      if (pausedAtTick !== null) {
        lastPauseEvidence =
          `PAUSE · ${Math.round(performance.now() - pausedAtTime)} ms · ` +
          `TICK Δ ${simulation.ticks - pausedAtTick}`;
        pausedAtTick = null;
      }
      app.renderer.resize(window.innerWidth, window.innerHeight);
      resizeScene();
      if (!creaturePlaced) {
        creature.place(app.screen.width / 2, app.screen.height / 2);
        creaturePlaced = true;
      }
      fpsSampleStarted = performance.now();
      renderedFrames = 0;
      status.value = "ACTIVE · WARMING UP";
      app.start();
    } else {
      app.stop();
      clock.reset();
      creature.resetAnimation();
      pausedAtTick = simulation.ticks;
      pausedAtTime = performance.now();
      status.value = `PAUSED\nTICKS · ${simulation.ticks}`;
    }
  };

  const unlistenState = await onWorldState(applyState);
  applyState(await getWorldState());

  const currentWindow = getCurrentWindow();
  const unlistenFocus = await currentWindow.onFocusChanged(({ payload: focused }) => {
    if (!focused && active) {
      void collapseWorld();
    }
  });

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && active) {
      event.preventDefault();
      void collapseWorld();
    }
  };
  window.addEventListener("keydown", onKeyDown);

  window.addEventListener(
    "beforeunload",
    () => {
      app.stop();
      input.destroy();
      unlistenState();
      unlistenFocus();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", resizeScene);
      host.removeEventListener("pointerdown", onWorldPointerDown);
      app.destroy(true);
    },
    { once: true },
  );
}
