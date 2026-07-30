# Handoff

Last updated: 2026-07-30
Milestone: Phase 0 — Windows Windowing Spike
Status: Phase 0 implemented and locally accepted

## Scope frozen by README

Phase 0 must prove:

- transparent, borderless, always-on-top `star-core`;
- transparent fullscreen `world-overlay`;
- expansion by star-core click or global shortcut;
- collapse by `Esc` or clicking outside the creature;
- zero simulation ticks and no direction-key capture while collapsed;
- 100 consecutive transitions without focus loss, black screen, or zombie windows;
- stable rendering of one monochrome pixel creature at 1080p.

DeepSeek and evolution remain explicitly out of scope.

## Current implementation

- Vite + strict TypeScript + PixiJS 8 frontend.
- Tauri 2 Rust shell with two pre-created windows.
- Rust-owned active/collapsed state and `Ctrl+Alt+Shift+M` global shortcut.
- PixiJS 60 Hz fixed-step clock, active-only arrow input, FPS/tick HUD.
- Procedural pure black/white pixel creature.
- Unit tests for fixed-step timing and collapse reset behavior.

## Verification evidence

Verified on 2026-07-30:

- `npm.cmd test`: 5/5 Vitest tests passed, including proof that collapsed input has
  zero listeners, does not prevent arrow-key defaults, and clears held-key state.
- `npm.cmd run build`: strict TypeScript and Vite production build passed.
- `scripts\cargo-msvc.cmd fmt --manifest-path src-tauri\Cargo.toml --all -- --check`:
  passed.
- `scripts\cargo-msvc.cmd check --manifest-path src-tauri\Cargo.toml`: passed.
- `scripts\cargo-msvc.cmd test --manifest-path src-tauri\Cargo.toml`: 1/1 Rust test
  passed.
- `npm.cmd run tauri:build`: release executable built successfully at
  `src-tauri/target/release/monochrome-devourer.exe` (9,612,800 bytes).
- The final release executable was launched independently: it remained responsive
  and displayed the transparent, borderless black/white star core in the physical
  2560×1600 desktop's lower-right corner.
- Production star-core click proof: the measured window rectangle was
  `(1556,955)–(1691,1051)` in logical coordinates; clicking its exact center changed
  visibility to `star-core=false`, `world-overlay=true`.
- Native window enumeration found the same `star-core` and `world-overlay` handles
  throughout the run; collapsed state showed only `star-core`.
- Instrumented F8 run: 100 cycles, 200 transitions, 9,074 ms, zero visibility/focus
  failures, process responsive.
- Global `Ctrl+Alt+Shift+M` expanded the world from another foreground app.
- Direction input: holding Right for 1 second moved the integer position from
  `(854, 534)` to `(1034, 534)`.
- Pause proof: an `Esc` collapse lasting 2,068 ms reported `TICK Δ 0`; resume returned
  to 62 FPS.
- Rendering proof: 60 FPS with a 1707×1067 logical viewport and a 2561×1601 physical
  Pixi framebuffer, which exceeds 1920×1080.
- Background click proof: `star-core visible=true`, `world-overlay visible=false`.
  Clicking the creature itself preserved the inverse state.

The only repeated compiler warning is localized MSVC linker stdout announcing the
generated import library; it is not a code or linkage failure.

## Windows manual acceptance run

Use a 1920×1080 display at 100% scaling for the baseline run.

1. Launch with `npm.cmd run tauri:dev`.
2. Confirm only a 96×96 transparent, borderless star core appears in the lower-right.
3. Click the core; confirm the fullscreen transparent world receives focus.
4. Move with each arrow key and confirm the pixel creature remains crisp.
5. Press `Esc`; confirm the world disappears immediately and arrow keys work in
   another foreground application.
6. Expand again and click outside the creature; confirm the same collapse behavior.
7. Toggle with `Ctrl+Alt+Shift+M` from another foreground application.
8. Repeat expand/collapse 100 times, alternating click, `Esc`, and shortcut.
   For the instrumented run, focus the collapsed star core and press `F8`; inspect
   the console/table result and the updated window tooltip.
9. During the run, reject any focus loss, black flash that persists beyond one
   frame, duplicate window, unresponsive window, or process growth indicating leaked
   windows.
10. At 1080p, keep the overlay active for at least 60 seconds and record the HUD FPS.

For future hardware runs, record the machine, scaling, min/average observed FPS,
transition count, and any failure here.

## Environment note

Node.js 24, Rust 1.97.1 (stable MSVC), Visual Studio 2022 C++ Build Tools, and the
Windows 11 SDK are installed. The npm Tauri scripts enter the MSVC developer
environment through `scripts/tauri-msvc.cmd`; Cargo-only commands use
`scripts/cargo-msvc.cmd`.
