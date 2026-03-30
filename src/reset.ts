/**
 * 將變換結果寫回磁碟：先備份再寫入，失敗時嘗試從備份還原。
 */
import { copyFile, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { transformMainJs } from "./csp";

export type ResetOptions = {
	mainJsPath: string;
	dryRun: boolean;
};

export type ResetResult =
	| { ok: true; backupPath: string; mode: string; dryRun: boolean }
	| { ok: false; reason: string };

/**
 * 讀取 main.js、套用 `transformMainJs`；非 dry-run 時先備份再寫入，失敗時嘗試從備份還原。
 */
export async function resetCursorMainJs(opts: ResetOptions): Promise<ResetResult> {
	const src = await readFile(opts.mainJsPath, "utf8");
	const { content, mode } = transformMainJs(src);

	if (mode === "none") {
		return {
			ok: false,
			reason:
				"No CSP markers and no injectable pattern found (Cursor may have changed main.js). Compare the real file and update regexes in src/csp.ts.",
		};
	}

	if (opts.dryRun) {
		return { ok: true, backupPath: "(dry-run)", mode, dryRun: true };
	}

	const backupPath = `${opts.mainJsPath}.backup.${Date.now()}`;
	await copyFile(opts.mainJsPath, backupPath);
	try {
		await mkdir(dirname(opts.mainJsPath), { recursive: true });
		await writeFile(opts.mainJsPath, content, "utf8");
		return { ok: true, backupPath, mode, dryRun: false };
	} catch (e) {
		try {
			await copyFile(backupPath, opts.mainJsPath);
		} catch {
			/* 還原失敗 */
		}
		const msg = e instanceof Error ? e.message : String(e);
		return { ok: false, reason: `Write failed; restore was attempted: ${msg}` };
	}
}
