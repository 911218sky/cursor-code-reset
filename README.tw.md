# cursor-code-reset

**Cursor / VS Code 擴充功能**：備份並更新 Cursor 安裝目錄內 **`main.js`** 的 **CSP 標記用 UUID**，提供**狀態列**捷徑、**底部面板** Webview 與指令面板指令。

*English:* [README.md](./README.md)

[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](./LICENSE)

## 免責聲明

本軟體僅供**技術研究**與**您有權修改的環境**自用。軟體依**現狀**提供，**不附帶任何保證**；作者與貢獻者對因修改 Cursor 安裝檔所致之損害、資料遺失或**違反使用條款**等後果**不負責任**。

您必須自行遵守 **Cursor 服務條款**與適用法規。若無法接受，請**勿**安裝或使用。

## 功能概要

- **引導流程**：解析 `main.js`、預覽偵測到的 CSP 相關 UUID、確認後**備份並寫入**（寫入失敗時會嘗試自備份還原）。
- **介面**：狀態列 **cursor-code-reset**、底部面板 **Reset**（重設流程、重載視窗、列出候選路徑）。
- **建置**：原始碼以 **esbuild** 打包為 `dist/extension.js`；型別檢查使用 `tsc --noEmit`。

## 環境需求

- **Cursor**（主要目標）或符合 `package.json` 中 `engines.vscode` 的 **VS Code**
- **Bun**（建議）或 **Node**，用於安裝依賴與執行腳本

## 快速開始

### 從 Release 安裝（建議）

1. 至 [**Releases**](https://github.com/911218sky/cursor-code-reset/releases) 下載最新 **`.vsix`**。
2. 編輯器中：**擴充功能 → … → Install from VSIX…**，選取檔案後**重新載入視窗**。

### 從原始碼建置

```bash
git clone https://github.com/911218sky/cursor-code-reset.git
cd cursor-code-reset
bun install
bun run package
```

產生的 VSIX 位於儲存庫根目錄（檔名含 `package.json` 版本號）。流程為 **`bun run compile`** 後以 **`vsce package --no-dependencies --allow-missing-repository`** 封裝，與常見 VS Code 擴充專案相同。

```bash
bun run compile   # esbuild → dist/extension.js
bun run typecheck # tsc --noEmit
```

## 設定

| 設定項 | 說明 |
|--------|------|
| `cursorCodeReset.storagePath` | 選填；`cursor-code-reset-cache.json` 所在目錄（預設為擴充 global storage）。 |
| `cursorCodeReset.autoHideTemplateErrors` | 啟動後可選擇關閉 Problems 裝飾，減少改過 `main.js` 後的暫時診斷干擾。 |

## 指令（命令選擇區）

指令前綴為 **`cursor-code-reset:`**，例如：**Start reset workflow**、**Apply main.js changes**、**Reload window**、**Test path search**、**Clear local cache**、**Simple reset menu**、**Hide / Show Problems decorations**。

## 疑難排解

- **找不到 main.js**：使用 **Test path search**（輸出頻道）或面板 **Show candidate main.js paths**；若安裝路徑不同請手動選檔。
- **轉換失敗**（模式為 none）：Cursor 版本可能已變更 `main.js` 結構，請對照實際檔案調整 `src/csp.ts` 內正則。
- **Windows 權限錯誤**：需具備寫入 Cursor 安裝目錄的權限（請自行評估風險）。

## 授權

[**AGPL-3.0**](./LICENSE)
