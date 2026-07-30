use serde::Serialize;
use std::sync::{
    atomic::{AtomicBool, AtomicU64, Ordering},
    Mutex,
};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, State, WebviewWindow, WindowEvent};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, ShortcutState};

const STAR_CORE: &str = "star-core";
const WORLD_OVERLAY: &str = "world-overlay";
const WORLD_STATE_EVENT: &str = "world-state";

#[derive(Default)]
struct WorldRuntime {
    active: Mutex<bool>,
    transition_count: AtomicU64,
    stress_running: AtomicBool,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
struct WorldSnapshot {
    active: bool,
    transition_count: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct Phase0StressReport {
    cycles: u16,
    transitions: u64,
    duration_ms: u64,
    failures: Vec<String>,
}

fn snapshot(runtime: &WorldRuntime) -> Result<WorldSnapshot, String> {
    let active = *runtime
        .active
        .lock()
        .map_err(|_| "world state lock is poisoned".to_string())?;
    Ok(WorldSnapshot {
        active,
        transition_count: runtime.transition_count.load(Ordering::Relaxed),
    })
}

fn window(app: &AppHandle, label: &str) -> Result<WebviewWindow, String> {
    app.get_webview_window(label)
        .ok_or_else(|| format!("missing webview window: {label}"))
}

fn position_star_core(app: &AppHandle) -> Result<(), String> {
    let star = window(app, STAR_CORE)?;
    let monitor = star
        .current_monitor()
        .map_err(|error| error.to_string())?
        .or_else(|| app.primary_monitor().ok().flatten())
        .ok_or_else(|| "no monitor available for star core".to_string())?;
    let monitor_position = monitor.position();
    let monitor_size = monitor.size();
    let window_size = star.outer_size().map_err(|error| error.to_string())?;
    let margin = 24_i32;
    let x = monitor_position.x + monitor_size.width as i32 - window_size.width as i32 - margin;
    let y = monitor_position.y + monitor_size.height as i32 - window_size.height as i32 - margin;
    star.set_position(PhysicalPosition::new(x, y))
        .map_err(|error| error.to_string())
}

fn apply_world_state(app: &AppHandle, next_active: bool) -> Result<WorldSnapshot, String> {
    let runtime = app.state::<WorldRuntime>();
    let star = window(app, STAR_CORE)?;
    let overlay = window(app, WORLD_OVERLAY)?;

    let changed = {
        let mut active = runtime
            .active
            .lock()
            .map_err(|_| "world state lock is poisoned".to_string())?;
        let changed = *active != next_active;
        *active = next_active;
        changed
    };

    if next_active {
        star.hide().map_err(|error| error.to_string())?;
        overlay
            .set_fullscreen(true)
            .map_err(|error| error.to_string())?;
        overlay.show().map_err(|error| error.to_string())?;
        overlay.set_focus().map_err(|error| error.to_string())?;
    } else {
        overlay.hide().map_err(|error| error.to_string())?;
        position_star_core(app)?;
        star.show().map_err(|error| error.to_string())?;
        star.set_focus().map_err(|error| error.to_string())?;
    }

    if changed {
        runtime.transition_count.fetch_add(1, Ordering::Relaxed);
    }
    let current = snapshot(&runtime)?;
    app.emit(WORLD_STATE_EVENT, current)
        .map_err(|error| error.to_string())?;
    Ok(current)
}

fn toggle_world_inner(app: &AppHandle) -> Result<WorldSnapshot, String> {
    let active = snapshot(&app.state::<WorldRuntime>())?.active;
    apply_world_state(app, !active)
}

#[tauri::command]
fn get_world_state(runtime: State<'_, WorldRuntime>) -> Result<WorldSnapshot, String> {
    snapshot(&runtime)
}

#[tauri::command]
fn expand_world(app: AppHandle) -> Result<WorldSnapshot, String> {
    apply_world_state(&app, true)
}

#[tauri::command]
fn collapse_world(app: AppHandle) -> Result<WorldSnapshot, String> {
    apply_world_state(&app, false)
}

#[tauri::command]
fn toggle_world(app: AppHandle) -> Result<WorldSnapshot, String> {
    toggle_world_inner(&app)
}

fn verify_window_pair(app: &AppHandle, active: bool, cycle: u16) -> Vec<String> {
    let mut failures = Vec::new();
    let Ok(star) = window(app, STAR_CORE) else {
        return vec![format!("cycle {cycle}: star-core window is missing")];
    };
    let Ok(overlay) = window(app, WORLD_OVERLAY) else {
        return vec![format!("cycle {cycle}: world-overlay window is missing")];
    };

    match star.is_visible() {
        Ok(visible) if visible == !active => {}
        Ok(visible) => failures.push(format!(
            "cycle {cycle}: star-core visible={visible}, expected {}",
            !active
        )),
        Err(error) => failures.push(format!("cycle {cycle}: star visibility error: {error}")),
    }
    match overlay.is_visible() {
        Ok(visible) if visible == active => {}
        Ok(visible) => failures.push(format!(
            "cycle {cycle}: world-overlay visible={visible}, expected {active}"
        )),
        Err(error) => failures.push(format!("cycle {cycle}: overlay visibility error: {error}")),
    }
    match if active {
        overlay.is_focused()
    } else {
        star.is_focused()
    } {
        Ok(true) => {}
        Ok(false) => failures.push(format!(
            "cycle {cycle}: expected {} to own focus",
            if active { WORLD_OVERLAY } else { STAR_CORE }
        )),
        Err(error) => failures.push(format!("cycle {cycle}: focus query error: {error}")),
    }
    failures
}

#[tauri::command]
async fn run_phase0_stress_test(
    app: AppHandle,
    cycles: Option<u16>,
) -> Result<Phase0StressReport, String> {
    if app
        .state::<WorldRuntime>()
        .stress_running
        .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
        .is_err()
    {
        return Err("a Phase 0 stress test is already running".to_string());
    }

    let cycles = cycles.unwrap_or(100).clamp(1, 100);
    let task_app = app.clone();
    let joined = tauri::async_runtime::spawn_blocking(move || {
        let started = Instant::now();
        let mut failures = Vec::new();

        for cycle in 1..=cycles {
            apply_world_state(&task_app, true)?;
            std::thread::sleep(Duration::from_millis(35));
            failures.extend(verify_window_pair(&task_app, true, cycle));

            apply_world_state(&task_app, false)?;
            std::thread::sleep(Duration::from_millis(35));
            failures.extend(verify_window_pair(&task_app, false, cycle));

            if failures.len() >= 20 {
                failures.push("stopped after reaching 20 recorded failures".to_string());
                break;
            }
        }

        let final_snapshot = snapshot(&task_app.state::<WorldRuntime>())?;
        Ok::<Phase0StressReport, String>(Phase0StressReport {
            cycles,
            transitions: final_snapshot.transition_count,
            duration_ms: started.elapsed().as_millis() as u64,
            failures,
        })
    })
    .await;

    app.state::<WorldRuntime>()
        .stress_running
        .store(false, Ordering::Release);
    let report = joined.map_err(|error| format!("stress-test task failed: {error}"))??;
    println!("PHASE0_STRESS_REPORT {report:?}");
    Ok(report)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state == ShortcutState::Pressed
                        && shortcut.matches(
                            Modifiers::CONTROL | Modifiers::ALT | Modifiers::SHIFT,
                            Code::KeyM,
                        )
                    {
                        let _ = toggle_world_inner(app);
                    }
                })
                .build(),
        )
        .manage(WorldRuntime::default())
        .setup(|app| {
            position_star_core(app.handle()).map_err(std::io::Error::other)?;
            let _ = apply_world_state(app.handle(), false).map_err(std::io::Error::other)?;

            #[cfg(desktop)]
            if let Err(error) = app.global_shortcut().register("ctrl+alt+shift+m") {
                eprintln!("GLOBAL_SHORTCUT_UNAVAILABLE ctrl+alt+shift+m: {error}");
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = apply_world_state(window.app_handle(), false);
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_world_state,
            expand_world,
            collapse_world,
            toggle_world,
            run_phase0_stress_test
        ])
        .run(tauri::generate_context!())
        .expect("error while running Monochrome Devourer");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn snapshot_uses_camel_case_contract() {
        let snapshot = WorldSnapshot {
            active: true,
            transition_count: 7,
        };
        let json = serde_json::to_string(&snapshot).expect("serialize snapshot");
        assert_eq!(json, r#"{"active":true,"transitionCount":7}"#);
    }
}
