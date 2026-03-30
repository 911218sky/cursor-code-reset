import { existsSync, readdirSync, statSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

/** 不重複、保留順序。 */
function dedupe(paths: string[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const p of paths) {
		if (seen.has(p)) continue;
		seen.add(p);
		out.push(p);
	}
	return out;
}

/** 除 `current` 外，掃描 `/snap/cursor/<rev>` 底下是否有典型 `main.js`（部分環境無 `current` 連結）。 */
function pushLinuxSnapRevisionPaths(paths: string[]): void {
	const snapRoot = "/snap/cursor";
	try {
		if (!statSync(snapRoot).isDirectory()) return;
	} catch {
		return;
	}
	let entries: string[];
	try {
		entries = readdirSync(snapRoot);
	} catch {
		return;
	}
	for (const name of entries) {
		if (name === "common" || name === "data") continue;
		const candidate = join(snapRoot, name, "resources", "app", "out", "main.js");
		try {
			if (statSync(candidate).isFile()) paths.push(candidate);
		} catch {
			/* 非此修訂或路徑不同 */
		}
	}
}

/**
 * Flatpak 的 app id 依打包／測試通道可能不同；逐一列舉系統與使用者級安裝目錄。
 */
function pushLinuxFlatpakPaths(paths: string[]): void {
	const appIds = ["com.cursor.Cursor", "com.cursor.cursor", "cursor", "cursor.Cursor"];
	const bases = [
		"/var/lib/flatpak/app",
		join(homedir(), ".local", "share", "flatpak", "app"),
	];
	for (const base of bases) {
		for (const id of appIds) {
			paths.push(join(base, id, "current", "active", "files", "resources", "app", "out", "main.js"));
		}
	}
}

/** 依目前作業系統列舉可能的 Cursor `out/main.js` 安裝路徑。 */
export function getPossibleCursorMainJsPaths(): string[] {
	const plat = platform();
	const paths: string[] = [];
	const envOverride = process.env.CURSOR_MAIN_JS?.trim();
	if (envOverride) paths.push(envOverride);

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
		const xdgData = process.env.XDG_DATA_HOME?.trim() || join(homedir(), ".local", "share");
		// 套件／一般安裝（與官方 .deb、 tarball、部分 AUR 一致）
		paths.push("/usr/share/cursor/resources/app/out/main.js");
		paths.push("/usr/lib/cursor/resources/app/out/main.js");
		paths.push("/opt/cursor/resources/app/out/main.js");
		paths.push("/opt/Cursor/resources/app/out/main.js");
		paths.push("/usr/local/share/cursor/resources/app/out/main.js");
		paths.push(join(xdgData, "cursor", "resources", "app", "out", "main.js"));
		paths.push(join(homedir(), ".local", "share", "cursor", "resources", "app", "out", "main.js"));
		paths.push(join(homedir(), "cursor", "resources", "app", "out", "main.js"));
		paths.push(join(homedir(), "opt", "cursor", "resources", "app", "out", "main.js"));
		paths.push(join(homedir(), "Applications", "cursor", "resources", "app", "out", "main.js"));
		paths.push(join(homedir(), "bin", "cursor", "resources", "app", "out", "main.js"));
		// Snap：先試官方 `current`，再掃各修訂目錄
		paths.push("/snap/cursor/current/resources/app/out/main.js");
		pushLinuxSnapRevisionPaths(paths);
		// Flatpak：多組 app id + 系統／使用者目錄
		pushLinuxFlatpakPaths(paths);
	}

	return dedupe(paths);
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
