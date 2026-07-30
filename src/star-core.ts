import { expandWorld, runPhase0StressTest } from "./window-runtime";

export async function mountStarCore(root: HTMLDivElement): Promise<void> {
  root.innerHTML = `
    <button class="star-core" type="button" aria-label="展开黑白星球">
      <span class="star-core__planet" aria-hidden="true"></span>
    </button>
  `;

  const button = root.querySelector<HTMLButtonElement>(".star-core");
  if (!button) {
    throw new Error("Failed to create star core");
  }

  let expanding = false;
  const expand = async (): Promise<void> => {
    if (expanding) {
      return;
    }

    expanding = true;
    try {
      await expandWorld();
    } finally {
      expanding = false;
    }
  };

  button.addEventListener("click", () => {
    void expand();
  });

  if (import.meta.env.DEV) {
    button.title = "点击展开；按 F8 执行 100 次窗口循环测试";
    window.addEventListener("keydown", (event) => {
      if (event.key !== "F8") {
        return;
      }
      event.preventDefault();
      button.disabled = true;
      button.title = "正在执行 100 次窗口循环测试…";
      void runPhase0StressTest()
        .then((report) => {
          console.table(report);
          button.title =
            report.failures.length === 0
              ? `窗口循环通过：${report.cycles} 次，${report.durationMs} ms`
              : `窗口循环失败：${report.failures.join("; ")}`;
        })
        .catch((error: unknown) => {
          console.error("Phase 0 stress test failed", error);
          button.title = `窗口循环命令失败：${String(error)}`;
        })
        .finally(() => {
          button.disabled = false;
          button.focus();
        });
    });
  }
}
