// @ts-check
import * as esbuild from "esbuild";
import { mkdirSync, rmSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });

/** @type {esbuild.BuildOptions} */
const extension = {
	entryPoints: ["src/extension.ts"],
	bundle: true,
	minify: true,
	legalComments: /** @type {"none"} */ ("none"),
	define: { "process.env.NODE_ENV": '"production"' },
	platform: "node",
	target: "es2022",
	outfile: "dist/extension.js",
	external: ["vscode"],
	format: "cjs",
	sourcemap: true,
};

await esbuild.build(extension);
