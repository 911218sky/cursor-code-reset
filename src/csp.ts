/**
 * 在 main.js 以 csp1／csp4 註解標記（形如 slash-star、csp 數字、star-slash）包夾 UUID，固定化原本會隨環境變動的片段。
 * 純邏輯模組，無 VS Code API。
 */
import { randomUUID } from "node:crypto";

/** 已注入過 csp1 時，整行符合此樣式。 */
const CSP1_LINE =
	/(\/\*csp1\*\/['"]([\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12})['"]\/\*1csp\*\/)/gi;
const CSP4_LINE =
	/(\/\*csp4\*\/['"]([\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12})['"]\/\*4csp\*\/)/gi;

export type CspDetection = {
	hasCsp1: boolean;
	hasCsp4: boolean;
};

/** 掃描原始碼是否已含 csp1／csp4 註解包夾的 UUID 行。 */
export function detectCspTokens(source: string): CspDetection {
	CSP1_LINE.lastIndex = 0;
	CSP4_LINE.lastIndex = 0;
	return {
		hasCsp1: CSP1_LINE.test(source),
		hasCsp4: CSP4_LINE.test(source),
	};
}

/** 自 main.js 擷取 csp1、csp4 兩段註解區內目前的 UUID。 */
const CSP1_CAPTURE =
	/\/\*csp1\*\/['"]([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})['"]\/\*1csp\*\//i;
const CSP4_CAPTURE =
	/\/\*csp4\*\/['"]([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})['"]\/\*4csp\*\//i;

/** 擷取目前已注入的 csp1、csp4 UUID 字串（供確認對話框顯示）。 */
export function extractCspUuidValues(source: string): { csp1: string | null; csp4: string | null } {
	const m1 = CSP1_CAPTURE.exec(source);
	const m4 = CSP4_CAPTURE.exec(source);
	return { csp1: m1?.[1] ?? null, csp4: m4?.[1] ?? null };
}

/** 在已有標記的前提下，將兩段 UUID 替換為新隨機值。 */
export function replaceCspUuids(source: string): string {
	const u1 = randomUUID();
	const u2 = randomUUID();
	let out = source.replace(CSP1_LINE, `/*csp1*/"${u1}"/*1csp*/`);
	out = out.replace(CSP4_LINE, `/*csp4*/"${u2}"/*4csp*/`);
	return out;
}

export type InjectResult = {
	content: string;
	injectedCount: number;
	csp1UUID: string;
	csp4UUID: string;
};

/**
 * 在尚未含 csp 標記的 main.js 內，以正則比對預期程式片段並插入兩段 UUID。
 * Cursor 升級後若結構改變，須更新本檔正則。
 */
export function injectCspMarkers(source: string): InjectResult {
	const csp1UUID = randomUUID();
	const csp4UUID = randomUUID();
	let injectedCount = 0;
	let content = source;

	const reCsp1Primary =
		/(async function \w+\(t\)\{let e=)(\w+\([^)]+\([^)]+\)\.toString\(\)\))(,i;try\{i=\(await import\("crypto"\)\)\.createHash\("sha256"\))/g;
	const reCsp1Alt1 =
		/(async function \w+\(t\)\{let e=)([^,]+)(,i;try\{i=\(await import\("crypto"\)\)\.createHash\("sha256"\)\.update\(e,"utf8"\)\.digest\("hex"\))/g;
	const reCsp1Alt2 = /(let e=)(\w+\(\w+\[[^\]]+\],\{timeout:\d+\}\)\.toString\(\))/g;

	const reCsp4Primary =
		/(async function \w+\(t\)\{try\{return )(await\(await import\("@vscode\/deviceid"\)\)\.getDeviceId\(\))(\}catch)/g;
	const reCsp4Alt = /(try\{return )(await\(await import\("@vscode\/deviceid"\)\)\.getDeviceId\(\))(\}catch\()/g;

	if (reCsp1Primary.test(content)) {
		reCsp1Primary.lastIndex = 0;
		content = content.replace(reCsp1Primary, `$1/*csp1*/"${csp1UUID}"/*1csp*/$3`);
		injectedCount++;
	} else if (reCsp1Alt1.test(content)) {
		reCsp1Alt1.lastIndex = 0;
		content = content.replace(reCsp1Alt1, `$1/*csp1*/"${csp1UUID}"/*1csp*/$3`);
		injectedCount++;
	} else if (reCsp1Alt2.test(content)) {
		reCsp1Alt2.lastIndex = 0;
		content = content.replace(reCsp1Alt2, `$1/*csp1*/"${csp1UUID}"/*1csp*/`);
		injectedCount++;
	}

	if (reCsp4Primary.test(content)) {
		reCsp4Primary.lastIndex = 0;
		content = content.replace(reCsp4Primary, `$1/*csp4*/"${csp4UUID}"/*4csp*/$3`);
		injectedCount++;
	} else if (reCsp4Alt.test(content)) {
		reCsp4Alt.lastIndex = 0;
		content = content.replace(reCsp4Alt, `$1/*csp4*/"${csp4UUID}"/*4csp*/$3`);
		injectedCount++;
	}

	return { content, injectedCount, csp1UUID, csp4UUID };
}

/**
 * 單一入口：有標記則輪換 UUID；無則嘗試首次注入；皆不可行則回傳原文與 mode `none`。
 */
export function transformMainJs(source: string): { content: string; mode: string } {
	const det = detectCspTokens(source);
	if (det.hasCsp1 || det.hasCsp4) {
		return { content: replaceCspUuids(source), mode: "replace-markers" };
	}
	const inj = injectCspMarkers(source);
	if (inj.injectedCount > 0) {
		return { content: inj.content, mode: `inject (${inj.injectedCount} sites)` };
	}
	return { content: source, mode: "none" };
}
