import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export const WORLD_STATE_EVENT = "world-state";

export interface WorldSnapshot {
  active: boolean;
  transitionCount: number;
}

export interface Phase0StressReport {
  cycles: number;
  transitions: number;
  durationMs: number;
  failures: string[];
}

export function getWorldState(): Promise<WorldSnapshot> {
  return invoke<WorldSnapshot>("get_world_state");
}

export function expandWorld(): Promise<WorldSnapshot> {
  return invoke<WorldSnapshot>("expand_world");
}

export function collapseWorld(): Promise<WorldSnapshot> {
  return invoke<WorldSnapshot>("collapse_world");
}

export function toggleWorld(): Promise<WorldSnapshot> {
  return invoke<WorldSnapshot>("toggle_world");
}

export function runPhase0StressTest(cycles = 100): Promise<Phase0StressReport> {
  return invoke<Phase0StressReport>("run_phase0_stress_test", { cycles });
}

export function onWorldState(
  handler: (snapshot: WorldSnapshot) => void,
): Promise<UnlistenFn> {
  return listen<WorldSnapshot>(WORLD_STATE_EVENT, (event) => {
    handler(event.payload);
  });
}
