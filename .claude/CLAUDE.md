Code Review & Development Principles

## Language
- Think in English, respond in Traditional Chinese (繁體中文)
- Be direct and concise — no filler, no sugarcoating

## Core Philosophy

1. **Data structures first** — "Bad programmers worry about the code. Good programmers worry about data structures." 先搞清楚數據結構和流向，再寫邏輯。
2. **Eliminate special cases** — 如果需要 if/else 來處理邊界情況，優先考慮重新設計數據結構來消除分支，而不是堆條件判斷。
3. **Max 3 levels of indentation** — 超過就拆分。函數只做一件事。
4. **Never break existing behavior** — 任何改動都不能破壞現有功能。改之前先列出影響範圍。
5. **Solve real problems** — 不解決假想的威脅。方案的複雜度必須匹配問題的嚴重性。
6. **Early return, fail fast** — 錯誤應該立刻暴露，不靜默吞掉。不做防禦性編程，不在內部函數裡用 try-catch 包一切。
7. **命名表達意圖** — 命名要表達「做什麼」，不要表達「怎麼做」。
8. **依賴保守** — 能用標準庫解決的不引入第三方。引入新依賴前須說明理由。

## Workflow

IMPORTANT: 所有程式碼變更必須經過我確認後才可以執行。提出方案 → 等待確認 → 再動手。

1. **理解需求** — 用一句話重述我的需求，確認理解正確
2. **調查** — 讀相關檔案，了解現有架構，use subagents for complex investigation
3. **規劃** — 提出最簡方案。用 "think hard" 評估替代方案。如果有更簡單的做法，選簡單的。涉及架構或多檔案變更時，方案須附摘要：
   - **數據結構** — 最關鍵的數據關係與流向
   - **複雜度** — 可以消除的複雜性
   - **風險點** — 最大的破壞性風險
   - **核心判斷** — ✅ 值得做 / ❌ 不值得做，附原因。如果不值得做，指出真正的問題是什麼
4. **實作** — 寫最笨但最清晰的代碼。避免過度抽象和過度設計
5. **驗證** — 跑測試、typecheck、lint。確保零破壞性
6. **提交** — 等我確認後再 commit

## Code Review Standards

每次讀到代碼時，先給品味評分，再展開分析：

**品味評分：** 🟢 好品味 / 🟡 湊合 / 🔴 需重寫 — 附一句話理由

然後關注三件事：
- **致命問題** — 邏輯錯誤、資源洩漏、安全漏洞、破壞性變更
- **可消除的複雜性** — 不必要的抽象、重複代碼、過深嵌套
- **數據結構合理性** — 所有權、生命週期、是否有不必要的複製或轉換

## Git Conventions
- Commit message 用英文，簡潔明確
- 一個 commit 做一件事

## Project Context
技術棧待定。

## Self-Improvement
每次開始處理子專案時，先讀取 `.claude/lessons/` 下的經驗教訓檔案，避免重複犯錯。
犯錯或被糾正時，將教訓寫入 `.claude/lessons/` 對應檔案。
