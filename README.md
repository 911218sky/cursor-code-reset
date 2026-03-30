# cursor-code-reset

**Cursor / VS Code extension** to back up and refresh **CSP marker UUIDs** in Cursor’s `main.js`, with a **status bar** shortcut, **bottom panel** webview, and palette commands.

*Traditional Chinese:* [README.tw.md](./README.tw.md)

[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](./LICENSE)
[![VS Code Engine](https://img.shields.io/badge/VS%20Code-%5E1.85.0-0098FF?logo=visualstudiocode&logoColor=white)](https://code.visualstudio.com/)

## Disclaimer

This software is provided **for technical research and personal use on environments you control**. It is offered **as-is**, **without warranty**. Authors and contributors **are not liable** for any damage, data loss, or **terms-of-use violations** arising from modifying Cursor installation files.

You are solely responsible for compliance with **Cursor’s terms of service** and applicable law. If you do not accept that risk, **do not** install or use this extension.

## What you get

- **Guided workflow**: resolve `main.js`, preview detected CSP-related UUIDs, confirm, then **backup + write** (with rollback attempt on write failure).
- **UI**: status bar item **cursor-code-reset**, bottom panel **Reset** with actions for workflow, reload, and candidate path listing.
- **Build**: TypeScript sources bundled with **esbuild** to `dist/extension.js`; typecheck via `tsc --noEmit`.

## Requirements

- **Cursor** (primary target) or **VS Code** matching `engines.vscode` in `package.json`
- **Bun** (recommended) or **Node** for installing dev tools and running scripts

## Quick start

### Install from a release (recommended)

1. Download the latest **`.vsix`** from [**Releases**](https://github.com/911218sky/cursor-code-reset/releases).
2. In the editor: **Extensions → … → Install from VSIX…**, pick the file, then **reload the window**.

### Build from source

```bash
git clone https://github.com/911218sky/cursor-code-reset.git
cd cursor-code-reset
bun install
bun run package
```

The VSIX is emitted at the repository root (for example `cursor-code-reset-1.5.0.vsix`; version comes from `package.json`). Packaging uses the same pattern as common VS Code extensions: **`bun run compile`** then **`vsce package`** with `--no-dependencies --allow-missing-repository`.

```bash
bun run compile   # esbuild → dist/extension.js
bun run typecheck # tsc --noEmit
```

## Configuration

| Setting | Purpose |
|--------|---------|
| `cursorCodeReset.storagePath` | Optional directory for `cursor-code-reset-cache.json` (default: extension global storage). |
| `cursorCodeReset.autoHideTemplateErrors` | Optionally hide Problems decorations shortly after startup to reduce noise after `main.js` edits. |

## Commands (palette)

All commands are prefixed **`cursor-code-reset:`** — e.g. **Start reset workflow**, **Apply main.js changes**, **Reload window**, **Test path search**, **Clear local cache**, **Simple reset menu**, **Hide / Show Problems decorations**.

## Troubleshooting

- **No `main.js` found**: use **Test path search** (Output channel) or **Show candidate main.js paths** in the panel; pick the file manually if install layout differs.
- **Transform fails** (“none” mode): your Cursor build may have changed `main.js`; inspect `src/csp.ts` regexes and adjust for your version.
- **Permission errors** on Windows: run the editor with rights that can write under the Cursor install directory, or adjust ownership (still at your own risk).

## License

[**AGPL-3.0**](./LICENSE)
