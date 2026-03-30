import { existsSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

/** 依目前作業系統列舉可能的 Cursor `out/main.js` 安裝路徑。 */
export function getPossibleCursorMainJsPaths(): string[] {
	const plat = platform();
	const paths: string[] = [];

	if (plat === "darwin") {
		paths.push("/Applications/Cursor.app/Contents/Resources/app/out/main.js");
		paths.push("/Applications/Cursor.app/Contents/Resources/app/main.js");
		paths.push(join(homedir(), "Applications/Cursor.app/Contents/Resources/app/out/main.js"));
	} else if (plat === "win32") {
		const pf = process.env.PROGRAMFILES || "C:\\Program Files";
		const pf86 = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
		const local = process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local");
		const roaming = process.env.APPDATA || join(homedir(), "AppData", "Roaming");
		paths.push(join(pf, "cursor", "resources", "app", "out", "main.js"));
		paths.push(join(pf86, "cursor", "resources", "app", "out", "main.js"));
		paths.push(join(local, "Programs", "cursor", "resources", "app", "out", "main.js"));
		paths.push(join(roaming, "cursor", "resources", "app", "out", "main.js"));
		paths.push(join(local, "cursor", "resources", "app", "out", "main.js"));
		paths.push(join(homedir(), "cursor", "resources", "app", "out", "main.js"));
		paths.push(join(homedir(), "AppData", "Local", "cursor", "resources", "app", "out", "main.js"));
		paths.push(join(homedir(), "scoop", "apps", "cursor", "current", "resources", "app", "out", "main.js"));
	} else {
		paths.push("/usr/share/cursor/resources/app/out/main.js");
		paths.push("/opt/cursor/resources/app/out/main.js");
		paths.push("/usr/local/share/cursor/resources/app/out/main.js");
		paths.push(join(homedir(), ".local", "share", "cursor", "resources", "app", "out", "main.js"));
		paths.push(join(homedir(), "cursor", "resources", "app", "out", "main.js"));
		paths.push("/snap/cursor/current/resources/app/out/main.js");
		paths.push("/var/lib/flatpak/app/cursor/current/active/files/resources/app/out/main.js");
	}

	return paths;
}

/** 同步掃描候選路徑，回傳第一個存在的 main.js（純 Node，不依賴 Bun）。 */
export function findExistingMainJsSync(): string | null {
	for (const p of getPossibleCursorMainJsPaths()) {
		if (existsSync(p)) return p;
	}
	return null;
}

/** 非同步包裝，與同步版行為相同（保留給可能 await 的呼叫端）。 */
export async function findExistingMainJs(): Promise<string | null> {
	return findExistingMainJsSync();
}
