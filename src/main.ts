import "./styles.css";
import { mountStarCore } from "./star-core";
import { mountWorld } from "./world/world-app";

function windowKind(): "star-core" | "world-overlay" {
  const requested = new URLSearchParams(window.location.search).get("window");
  return requested === "world-overlay" ? "world-overlay" : "star-core";
}

async function main(): Promise<void> {
  const root = document.querySelector<HTMLDivElement>("#app");
  if (!root) {
    throw new Error("Missing #app root");
  }

  if (windowKind() === "world-overlay") {
    await mountWorld(root);
  } else {
    await mountStarCore(root);
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  document.body.dataset.bootError =
    error instanceof Error ? error.message : String(error);
});
