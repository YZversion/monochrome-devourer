# Monochrome Devourer — Agent Instructions

Read `README.md`, `architecture.md`, and `handoff.md` before changing the project.

## Current scope

The active milestone is **Phase 0 — Windows Windowing Spike**. Do not add DeepSeek,
evolution, file feeding, persistence, ecology, combat, or other later-phase features
until every Phase 0 acceptance item has evidence.

## Non-negotiable boundaries

- Target Windows only for the MVP.
- Keep one Tauri process with the pre-created `star-core` and `world-overlay` windows.
- Rust owns window visibility, focus, fullscreen state, the global shortcut, and the
  authoritative active/collapsed state.
- TypeScript/PixiJS owns rendering, input, and the fixed-step simulation.
- Never send per-frame simulation traffic through Tauri IPC.
- A collapsed world has a stopped Pixi ticker, a reset fixed-step accumulator, and
  no direction-key listeners.
- Use only pure black and pure white for game art. Express gray through pixel
  dithering, disable antialiasing, use nearest-neighbor presentation, and align
  graphics to integer coordinates.
- Reuse the two windows; do not destroy/recreate them during expand/collapse.

## Required verification

For relevant changes, run:

```powershell
npm.cmd test
npm.cmd run build
scripts\cargo-msvc.cmd check --manifest-path src-tauri\Cargo.toml
npm.cmd run tauri:build
```

On Windows, also perform the manual checks in `handoff.md`, including 100 consecutive
expand/collapse cycles. In a development build, focus `star-core` and press `F8` to
run the instrumented 100-cycle visibility/focus test. Record concrete results in
`handoff.md`; do not claim native window behavior from unit tests alone.

## Living documentation

Update documentation in the same change whenever reality moves:

- `architecture.md`: durable structure, ownership, invariants, and decisions.
- `handoff.md`: current status, verified evidence, blockers, and exact next actions.
- `AGENTS.md`: durable instructions for future agents.
- `agent.md`: human-friendly index pointing to the canonical agent instructions.

Keep README product scope authoritative. If implementation and README disagree, stop
and resolve the discrepancy rather than silently changing the product.
