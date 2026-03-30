import * as vscode from "vscode";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type PluginCache = {
	lastMainJsPath?: string;
};

/** 依設定或 globalStorage 解析本擴充用的 cache JSON 完整路徑。 */
export function getCacheFilePath(context: vscode.ExtensionContext): string {
	const cfg = vscode.workspace.getConfiguration("cursorCodeReset");
	const custom =
		cfg.get<string>("storagePath")?.trim() ||
		cfg.get<string>("cacheStoragePath")?.trim() ||
		"";
	const base = custom || context.globalStorageUri.fsPath;
	return join(base, "cursor-code-reset-cache.json");
}

/** 讀取快取 JSON；檔案不存在或解析失敗時回傳空物件。 */
export async function loadPluginCache(context: vscode.ExtensionContext): Promise<PluginCache> {
	try {
		const raw = await readFile(getCacheFilePath(context), "utf8");
		return JSON.parse(raw) as PluginCache;
	} catch {
		return {};
	}
}

/** 建立目錄後寫入快取 JSON（格式化輸出）。 */
export async function savePluginCache(context: vscode.ExtensionContext, data: PluginCache): Promise<void> {
	const fp = getCacheFilePath(context);
	await mkdir(dirname(fp), { recursive: true });
	await writeFile(fp, JSON.stringify(data, null, 2), "utf8");
}

/** 刪除快取檔；檔案不存在時靜默略過。 */
export async function clearPluginCache(context: vscode.ExtensionContext): Promise<void> {
	try {
		await unlink(getCacheFilePath(context));
	} catch {
		/* 無檔 */
	}
}
