# Handoff

Last updated: 2026-07-31
Milestone: Phase 0 — Windows Windowing Spike
Status: Phase 0 implemented; selected Sumi idle/four-direction runtime passed QA

## Scope frozen by README

Phase 0 must prove:

- transparent, borderless, always-on-top `star-core`;
- transparent fullscreen `world-overlay`;
- expansion by star-core click or global shortcut;
- collapse by `Esc` or clicking outside the creature;
- zero simulation ticks and no direction-key capture while collapsed;
- 100 consecutive transitions without focus loss, black screen, or zombie windows;
- stable rendering of one monochrome pixel character at 1080p.

DeepSeek and evolution remain explicitly out of scope.

## Current implementation

- Vite + strict TypeScript + PixiJS 8 frontend.
- Tauri 2 Rust shell with two pre-created windows.
- Rust-owned active/collapsed state and `Ctrl+Alt+Shift+M` global shortcut.
- PixiJS 60 Hz fixed-step clock, active-only `W/A/S/D` input, FPS/tick HUD.
- Selected Sumi longhair kitten with six-frame idle and eight-frame
  `up/down/left/right` animation rows.
- Unit tests for fixed-step timing and collapse reset behavior.
- Ten original six-frame idle candidates remain under `assets/pet-candidates/`;
  candidate 07 is the only identity included in the runtime bundle.

## Verification evidence

Verified on 2026-07-30:

- `npm.cmd test`: 10/10 Vitest tests passed. Input coverage proves active input captures
  physical `W/A/S/D`, ignores `ArrowRight`, normalizes diagonal movement, and returns
  to zero listeners with cleared held-key state when collapsed. Animation coverage
  proves row selection, directional changes, frame advancement, idle return, and
  collapse reset.
- `npm.cmd run build`: strict TypeScript and Vite production build passed.
- `scripts\cargo-msvc.cmd fmt --manifest-path src-tauri\Cargo.toml --all -- --check`:
  passed.
- `scripts\cargo-msvc.cmd check --manifest-path src-tauri\Cargo.toml`: passed.
- `scripts\cargo-msvc.cmd test --manifest-path src-tauri\Cargo.toml`: 1/1 Rust test
  passed.
- `npm.cmd run tauri:build`: release executable built successfully at
  `src-tauri/target/release/monochrome-devourer.exe` (9,762,816 bytes).
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
- Pixel-cat visual QA: the real PixiJS `PixelCat` renderer was loaded in a local
  1280×720 preview and inspected against a neutral background. The pure black/white,
  integer-aligned output clearly showed pointed ears, a front-facing face, short
  paws, fur dithering, and a raised tail.
- Pause proof: an `Esc` collapse lasting 2,068 ms reported `TICK Δ 0`; resume returned
  to 62 FPS.
- Rendering proof: 60 FPS with a 1707×1067 logical viewport and a 2561×1601 physical
  Pixi framebuffer, which exceeds 1920×1080.
- Background click proof: `star-core visible=true`, `world-overlay visible=false`.
  Clicking the creature itself preserved the inverse state.

The only repeated compiler warning is localized MSVC linker stdout announcing the
generated import library; it is not a code or linkage failure.

Pet candidate selection evidence:

- `scripts/build_pet_candidate_overview.py` validated 10 candidates × 6 idle frames.
- Every frame is 192×208 RGBA with visible pixels restricted to pure black and white.
- Every preview GIF contains six frames.
- Independent visual QA passed identity stability, visible idle motion, clipping,
  hard-edge rendering, 50% scale readability, and absence of detached effects for
  all ten candidates.
- Selection artifacts are
  `assets/pet-candidates/qa/contact-sheet.gif` and
  `assets/pet-candidates/qa/contact-sheet.png`.

Sumi integration evidence verified on 2026-07-31:

- Candidate 07 was selected by the user.
- `scripts/build_sumi_sprite_sheet.py` validated 38 non-empty 192×208 frames and a
  visible palette limited to `#000000`, `#ffffff`, and transparency.
- Runtime atlas `src/assets/pets/sumi.png` is 1536×1040 and contains one six-frame
  idle row plus four eight-frame directional rows.
- Five GIFs and `assets/pet-candidates/07-sumi/qa/contact-sheet.png` were generated.
- Independent visual QA passed identity, proportions, direction semantics,
  alternating gait, loop stability, clipping, size stability, chroma cleanup, and
  absence of detached effects across all five states.
- The first derived left row was rejected because unequal source slots clipped three
  frames. A native left row replaced it and passed the same QA.
- The isolated `qa/sumi-preview.html` harness loaded the production `SumiPet` class
  and production atlas in PixiJS. `idle`, `up`, `left`, `down`, and `right` were each
  selected and visually checked; browser console warnings/errors: zero.
- `npm.cmd test`, `npm.cmd run build`,
  `scripts\cargo-msvc.cmd check --manifest-path src-tauri\Cargo.toml`, and
  `npm.cmd run tauri:build` all passed after final integration. The release bundle
  includes the lossless Sumi PNG.

The remaining user-side acceptance action is to run the native app on the actual
desktop and confirm the chosen animation's perceived size and `W/A/S/D` feel. Native
window reuse, focus, pause, and 100-cycle evidence remain valid because this change
did not alter Rust window coordination.

## Windows manual acceptance run

Use a 1920×1080 display at 100% scaling for the baseline run.

1. Launch with `npm.cmd run tauri:dev`.
2. Confirm only a 96×96 transparent, borderless star core appears in the lower-right.
3. Click the core; confirm the fullscreen transparent world receives focus.
4. Move with each of `W`, `A`, `S`, and `D`; confirm Sumi remains crisp, plays the
   matching directional loop,
   arrow keys are not captured.
5. Press `Esc`; confirm the world disappears immediately and `W/A/S/D` work in
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
