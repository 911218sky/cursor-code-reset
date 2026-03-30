import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * 從擴充根目錄讀取 `media/reset-panel.html` 字串，供 Webview 指派給 `webview.html`。
 */
export async function loadResetPanelHtml(extensionRoot: string): Promise<string> {
	return readFile(join(extensionRoot, "media", "reset-panel.html"), "utf8");
}
