import * as vscode from "vscode";
import { existsSync } from "node:fs";
import { getPossibleCursorMainJsPaths } from "./paths";
import { clearPluginCache } from "./cache";

/** 除錯用：列出 `getPossibleCursorMainJsPaths` 並標記是否存在，寫入 Output 頻道。 */
export async function runTestPathSearch(out: vscode.OutputChannel): Promise<void> {
	out.clear();
	out.appendLine("cursor-code-reset — candidate main.js paths");
	out.appendLine("");
	const paths = getPossibleCursorMainJsPaths();
	let found = 0;
	for (const p of paths) {
		const ok = existsSync(p);
		if (ok) found++;
		out.appendLine(`[${ok ? "exists" : "—"}] ${p}`);
	}
	out.appendLine("");
	out.appendLine(`${found} path(s) exist.`);
	out.show(true);
	vscode.window.showInformationMessage(`Path scan done: ${found} existing path(s) (see Output)`);
}

/** 經確認後僅刪除本擴充建立的 `cursor-code-reset-cache.json`。 */
export async function runClearCache(context: vscode.ExtensionContext): Promise<void> {
	const ok = await vscode.window.showWarningMessage(
		"Clear cursor-code-reset local cache? (Only removes this extension’s cache JSON; not third-party activation server data.)",
		{ modal: true },
		"Clear",
		"Cancel",
	);
	if (ok !== "Clear") return;
	await clearPluginCache(context);
	vscode.window.showInformationMessage("Local cache cleared.");
}

/** 除錯用：開啟 `showInputBox` 並以訊息顯示使用者輸入結果。 */
export async function runTestInput(): Promise<void> {
	const v = await vscode.window.showInputBox({
		title: "cursor-code-reset test input",
		prompt: "Enter any text",
		placeHolder: "Test",
		ignoreFocusOut: true,
	});
	if (v === undefined) {
		vscode.window.showWarningMessage("Input cancelled.");
		return;
	}
	vscode.window.showInformationMessage(`Test input: ${v || "(empty string)"}`);
}

/** 模態選單：觸發 `runReset`、重載視窗或取消。 */
export async function runSimpleResetMenu(runReset: () => Promise<void>): Promise<void> {
	const pick = await vscode.window.showInformationMessage(
		"cursor-code-reset — simple menu",
		{ modal: true },
		"Reset main.js",
		"Reload window",
		"Cancel",
	);
	if (pick === "Reset main.js") await runReset();
	else if (pick === "Reload window") {
		const ok = await vscode.window.showWarningMessage("Reload the window?", { modal: true }, "OK", "Cancel");
		if (ok === "OK") await vscode.commands.executeCommand("workbench.action.reloadWindow");
	}
}

/** 將全域設定關閉 Problems 裝飾與狀態列目前問題顯示。 */
export async function runHideTemplateErrors(): Promise<void> {
	const cfg = vscode.workspace.getConfiguration();
	await cfg.update("problems.decorations.enabled", false, vscode.ConfigurationTarget.Global);
	await cfg.update("problems.showCurrentInStatus", false, vscode.ConfigurationTarget.Global);
	vscode.window.showInformationMessage("Problems decorations and status-bar current problem display are off.");
}

/** 將上述兩項設定還原為未覆寫（undefined）。 */
export async function runShowTemplateErrors(): Promise<void> {
	const cfg = vscode.workspace.getConfiguration();
	await cfg.update("problems.decorations.enabled", undefined, vscode.ConfigurationTarget.Global);
	await cfg.update("problems.showCurrentInStatus", undefined, vscode.ConfigurationTarget.Global);
	vscode.window.showInformationMessage("Problems display settings restored.");
}
