# Architecture

Last updated: 2026-07-30
Active milestone: Phase 0 — Windows Windowing Spike

## System boundary

Monochrome Devourer is one Windows Tauri 2 process containing two long-lived webview
windows. Rust is the window coordinator. A TypeScript/PixiJS frontend renders either
the compact star core or the expanded world according to the window URL.

```text
Windows global shortcut / star-core click / Esc / background click
                              |
                              v
                    Rust WorldRuntime state
                     active + transition count
                         /            \
                        v              v
              star-core window   world-overlay window
               CSS pixel art      PixiJS fixed-step world
                                    |
                              no per-frame IPC
```

## Runtime components

### Rust / Tauri

`src-tauri/src/lib.rs` is the window coordinator and authoritative state owner.

- Creates both windows from `tauri.conf.json` at process startup.
- Keeps both windows alive and alternates their visibility.
- Positions `star-core` at the lower-right of the current monitor.
- Expands, focuses, and collapses `world-overlay`.
- Registers `Ctrl+Alt+Shift+M` through the native global-shortcut plugin. A shortcut
  conflict is reported but never aborts application startup.
- Emits low-frequency `world-state` lifecycle events.
- Exposes idempotent expand/collapse commands and a toggle command.
- Provides a development-only F8 entry point for an instrumented 100-cycle window
  reuse test; the Rust command checks both window handles, visibility, and focus on
  every transition.

The only runtime state in Phase 0 is `WorldRuntime.active` plus a diagnostic
transition count. Window state is never inferred from animation state.

### TypeScript shell

`src/main.ts` selects a frontend from the `window` query parameter:

- `star-core`: a keyboard-focusable button with CSS pixel art.
- `world-overlay`: a transparent full-screen PixiJS application.

`src/window-runtime.ts` is the typed boundary for lifecycle commands and events.
No game-loop values cross this boundary.

### PixiJS world

`src/world/world-app.ts` owns the renderer and lifecycle.

- `Application.init()` is asynchronous as required by PixiJS 8.
- WebGL is preferred, antialiasing is disabled, and pixel rounding is enabled. The
  renderer uses `devicePixelRatio` with auto-density, so the
  framebuffer covers physical display pixels while simulation remains in logical,
  integer-aligned coordinates.
- The Pixi ticker starts only when Rust reports `active: true`.
- Collapsing stops the ticker, clears direction input, and resets accumulated time.
- `FixedStepClock` advances simulation at 60 Hz and limits catch-up work.
- A pure black/white procedural creature is drawn from integer-aligned rectangles.
- A 1%-alpha black Pixi backdrop keeps the Windows compositor hit-testable without
  visibly obscuring the desktop. A DOM pointer handler collapses only when the click
  falls outside the creature's logical bounds.

## State transitions

### Expand

1. Rust changes `WorldRuntime.active` to `true`.
2. Rust hides `star-core`.
3. Rust makes `world-overlay` fullscreen, shows it, and gives it focus.
4. Rust emits `world-state`.
5. The overlay installs direction input and starts the Pixi ticker.

### Collapse

1. Rust changes `WorldRuntime.active` to `false`.
2. Rust hides `world-overlay`.
3. Rust repositions, shows, and focuses `star-core`.
4. Rust emits `world-state`.
5. The overlay removes direction input, stops the ticker, and resets the fixed-step
   accumulator.

Collapse can be requested by `Esc`, clicking outside the creature, overlay focus
loss, or the global shortcut. Repeated requests are idempotent.

## Phase 0 invariants

- Exactly one process and exactly two reusable windows.
- At most one of the two windows is visible after a transition completes.
- Simulation ticks occur only while `WorldRuntime.active` is true.
- Arrow keys are prevented only while the world is active.
- `Esc` and background clicks collapse rather than close the process.
- Window lifecycle IPC is low-frequency; rendering and simulation never use IPC.
- Game art uses `#000000` and `#ffffff`; transparency is allowed for the desktop
  overlay and gray appearance comes from spatial dithering.
- Later-phase subsystems do not exist in the Phase 0 dependency graph.

## Known platform risks

- Transparent fullscreen WebView2 behavior, focus transfer, and global shortcut
  conflicts require testing on a real Windows desktop.
- A fully transparent fullscreen window still owns pointer input. Phase 0 treats a
  click outside the creature as the explicit collapse gesture.
- `Ctrl+Alt+Shift+M` may conflict with another application; a later settings surface may
  make it configurable, but that is outside Phase 0.
