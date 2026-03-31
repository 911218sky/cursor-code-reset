/**
 * VS Code／Cursor 擴充：右下角狀態列（狀態列按鈕觸發 reset 流程）。
 */
import * as vscode from "vscode";
import * as path from "node:path";
import { readFile, stat } from "node:fs/promises";
import { findExistingMainJsSync } from "./paths";
import { extractCspUuidValues } from "./csp";
import { resetCursorMainJs } from "./reset";
import { loadPluginCache, savePluginCache } from "./cache";
import {
	runTestPathSearch,
	runClearCache,
	runTestInput,
	runSimpleResetMenu,
	runHideTemplateErrors,
	runShowTemplateErrors,
} from "./extraCommands";

const CMD_OPEN = "cursorCodeReset.openPanel";
const CMD_RESET = "cursorCodeReset.apply";
const CMD_REPLACE_MAIN = "cursorCodeReset.replaceMainJs";
const CMD_RELOAD = "cursorCodeReset.reloadWindow";
const CMD_TEST_PATHS = "cursorCodeReset.testPathSearch";
const CMD_CLEAR_CACHE = "cursorCodeReset.clearCache";
const CMD_TEST_INPUT = "cursorCodeReset.testInput";
const CMD_SIMPLE_MENU = "cursorCodeReset.simpleMenu";
const CMD_HIDE_PROBLEMS = "cursorCodeReset.hideTemplateErrors";
const CMD_SHOW_PROBLEMS = "cursorCodeReset.showTemplateErrors";

/**
 * 解析要操作的 main.js：先掃候選路徑，否則詢問是否用快取路徑，最後開啟檔案選擇器。
 */
async function resolveMainJsPath(context: vscode.ExtensionContext): Promise<string | null> {
	const found = findExistingMainJsSync();
	if (found) return found;

	const cache = await loadPluginCache(context);
	if (cache.lastMainJsPath && (await pathExists(cache.lastMainJsPath))) {
		const use = await vscode.window.showInformationMessage(
			`Use the cached main.js path?\n${cache.lastMainJsPath}`,
			"Use this path",
			"Pick manually",
			"Cancel",
		);
		if (use === "Use this path") return cache.lastMainJsPath;
		if (use === "Cancel") return null;
	}

	const picked = await vscode.window.showOpenDialog({
		canSelectFiles: true,
		canSelectFolders: false,
		canSelectMany: false,
		filters: { JavaScript: ["js"], "All files": ["*"] },
		title: "Select Cursor’s main.js (often …/resources/app/out/main.js)",
		openLabel: "Select",
	});
	return picked?.[0]?.fsPath ?? null;
}

/** 非同步檢查路徑是否存在（stat 成功即 true）。 */
async function pathExists(p: string): Promise<boolean> {
	try {
		await stat(p);
		return true;
	} catch {
		return false;
	}
}

/**
 * 完整重設流程：選路徑 → 讀檔 → 顯示 CSP 預覽 → 確認 → 備份寫入 → 提示重載。
 */
export async function runResetFlow(context: vscode.ExtensionContext): Promise<void> {
	const mainPath = await resolveMainJsPath(context);
	if (!mainPath) {
		vscode.window.showInformationMessage("Cancelled: no main.js selected.");
		return;
	}

	let mainSource: string;
	try {
		mainSource = await readFile(mainPath, "utf8");
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		vscode.window.showErrorMessage(`Could not read main.js: ${msg}`);
		return;
	}

	const { csp1, csp4 } = extractCspUuidValues(mainSource);
	const detail = [
		"CSP marker UUIDs detected in main.js (same csp1 / csp4 placement as common reset tools):",
		"",
		`CSP1 (hash source): ${csp1 ?? "(not injected / marker not found)"}`,
		`CSP4 (device ID source): ${csp4 ?? "(not injected / marker not found)"}`,
		"",
		"If you continue, a backup is created and new random UUIDs are written; if markers are missing, first-time injection is attempted.",
		"",
		"Only use on environments you are allowed to modify; follow Cursor’s terms of use.",
	].join("\n");

	const confirm = await vscode.window.showWarningMessage(
		`The following file will be backed up and modified (close other Cursor windows first if possible):\n${mainPath}`,
		{ modal: true, detail },
		"Continue",
		"Cancel",
	);
	if (confirm !== "Continue") {
		vscode.window.showInformationMessage("Cancelled.");
		return;
	}

	const result = await resetCursorMainJs({ mainJsPath: mainPath, dryRun: false });
	if (!result.ok) {
		vscode.window.showErrorMessage(result.reason);
		return;
	}

	const prev = await loadPluginCache(context);
	await savePluginCache(context, { ...prev, lastMainJsPath: mainPath });

	const reload = await vscode.window.showInformationMessage(
		`Done (mode: ${result.mode}). Backup: ${path.basename(result.backupPath)}`,
		"Reload window",
		"Later",
	);
	if (reload === "Reload window") {
		await vscode.commands.executeCommand("workbench.action.reloadWindow");
	}
}

/** 註冊狀態列、Webview、指令與可選的啟動後隱藏 Problems 行為。 */
export function activate(context: vscode.ExtensionContext): void {
	const out = vscode.window.createOutputChannel("cursor-code-reset");
	context.subscriptions.push(out);

	if (vscode.workspace.getConfiguration("cursorCodeReset").get<boolean>("autoHideTemplateErrors", false)) {
		setTimeout(() => {
			void runHideTemplateErrors();
		}, 1000);
	}

	const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, -1000);
	status.text = "$(refresh) cursor-code-reset";
	status.tooltip = "cursor-code-reset: back up and refresh main.js CSP markers";
	status.command = CMD_OPEN;
	status.show();

	const run = () => runResetFlow(context);
	context.subscriptions.push(
		status,
		out,
		vscode.commands.registerCommand(CMD_OPEN, run),
		vscode.commands.registerCommand(CMD_RESET, run),
		vscode.commands.registerCommand(CMD_REPLACE_MAIN, run),
		vscode.commands.registerCommand(CMD_RELOAD, async () => {
			const ok = await vscode.window.showWarningMessage("Reload the window?", { modal: true }, "OK", "Cancel");
			if (ok === "OK") await vscode.commands.executeCommand("workbench.action.reloadWindow");
		}),
		vscode.commands.registerCommand(CMD_TEST_PATHS, () => runTestPathSearch(out)),
		vscode.commands.registerCommand(CMD_CLEAR_CACHE, () => runClearCache(context)),
		vscode.commands.registerCommand(CMD_TEST_INPUT, () => runTestInput()),
		vscode.commands.registerCommand(CMD_SIMPLE_MENU, () => runSimpleResetMenu(run)),
		vscode.commands.registerCommand(CMD_HIDE_PROBLEMS, () => runHideTemplateErrors()),
		vscode.commands.registerCommand(CMD_SHOW_PROBLEMS, () => runShowTemplateErrors()),
	);
}

/** 擴充卸載時無需釋放資源（訂閱已由 context 管理）。 */
export function deactivate(): void {}
