# Next Phase Plan — 加工、天氣、裝飾、Worker 專精

## Phase A：加工系統（最高優先）

### A.1 加工機器框架

沿用現有 Facility 框架，加工機器 = 沒有動物的設施，有 input → output。

**新增 FacilityType：**

| 機器 | 大小 | 花費 | 輸入 | 輸出 | 週期 |
|------|------|------|------|------|------|
| Windmill | 1×1 | $80 | wheat ×3 | flour ×1 ($8) | 20s |
| Juicer | 1×1 | $80 | carrot ×3 | juice ×1 ($10) | 20s |
| Oven | 2×2 | $200 | flour ×2 + egg ×1 | bread ×1 ($25) | 30s |
| Cooking Pot | 2×2 | $300 | flour ×1 + tomato ×2 | pizza ×1 ($45) | 40s |

**數據結構變更：**
- FacilityDef 已有 inputPerAnimal/outputPerAnimal。加工機器用 `maxAnimals: 0`，改用新欄位 `recipe`（或直接把 input/output 當作每次的量）
- 新做法：加工機器 `maxAnimals = 0`，加一個 `recipeInput` + `recipeOutput` 欄位（與 per-animal 獨立）
- 新 ItemType：`'flour'` | `'juice'` | `'bread'` | `'pizza'`

**Worker 互動：**
- Worker 自動投入原料（類似 feed 任務）
- Worker 自動收取產出（類似 collect 任務）
- 加工機器不需要動物，有原料就自動倒數生產

**UI：**
- BUILD 面板新增加工機器類別
- INVENTORY 自動顯示新物品

### A.2 實作步驟
1. types.ts — 新 ItemType（flour, juice, bread, pizza）
2. constants.ts — FacilityDef 加 `recipeInput` / `recipeOutput`，新機器定義
3. FacilitySystem — updateFacilities 支援 recipe 模式（maxAnimals=0 時用 recipe）
4. WorkerSystem — feed/collect 已支援，但 feed 需識別 recipe 模式
5. SpriteGenerator — 4 個新機器 sprite
6. GameScene — BUILD 面板新增機器
7. EconomySystem — ITEM_SELL_PRICES 加新品
8. SaveSystem — migration

---

## Phase B：天氣系統

### B.1 設計

**天氣類型：**
- ☀️ Sunny（預設，無特效）
- 🌧 Rain（自動澆水所有作物，持續 60-120s）
- 💨 Wind（worker 移動速度 -20%，持續 60s）
- ☀️ Heatwave（生長速度 +30%，但澆水需求 ×2，持續 90s）

**輪替機制：**
- 每 3-5 分鐘隨機切換天氣
- `state.weather: { type: WeatherType; timer: number }`

**視覺：**
- 全地圖半透明色彩疊層（雨=藍、風=灰、熱浪=橙）
- 雨天：簡單粒子效果（斜線條）

### B.2 實作步驟
1. types.ts — WeatherType, GameState.weather
2. constants.ts — 天氣定義（持續時間、效果）
3. WeatherSystem.ts — 天氣輪替、效果套用
4. CropSystem — rain 時跳過 waterTimer 倒數
5. WorkerSystem — wind 時速度 debuff
6. GameScene — 天氣疊層 + HUD 顯示當前天氣
7. SaveSystem — migration

---

## Phase C：裝飾系統

### C.1 設計

**裝飾 = 1×1 tile 物品，放在 grass 上。**

| 裝飾 | 花費 | 效果 |
|------|------|------|
| Flower Bed | $20 | 純視覺 |
| Fence | $15 | 純視覺 |
| Lantern | $30 | 純視覺 |
| Fountain | $100 | 附近 3×3 worker 速度 +10% |
| Statue | $200 | 附近 3×3 作物生長 +10% |
| Flag | $10 | 純視覺 |

**數據：**
- Tile 加 `decoration: DecorationType | null`
- 裝飾不是 Facility（不佔 facilityId），是獨立的 tile 屬性
- 有 buff 效果的裝飾在 CropSystem / WorkerSystem 裡做範圍檢查

### C.2 實作步驟
1. types.ts — DecorationType, Tile.decoration
2. constants.ts — 裝飾定義
3. GameScene — BUILD 面板加 DECOR 區塊、放置模式
4. SpriteGenerator — 6 個裝飾 sprite
5. CropSystem / WorkerSystem — buff 效果
6. SaveSystem — migration

---

## Phase D：Worker 專精

### D.1 設計

**專精類型：**
- 🌾 Farmer — 種植/收穫速度 +30%
- 💧 Caretaker — 澆水/除草速度 +30%
- 🔨 Builder — 拆除速度 +30%
- 📦 Porter — 移動速度 +30%（搬運專用）

**機制：**
- Worker 加 `specialty: WorkerSpecialty | null`
- null = 通才（無加成無懲罰）
- 有專精的 worker：對應任務速度 +30%，其他任務 -20%
- 點擊 worker 切換專精（或 sidebar 面板）

### D.2 實作步驟
1. types.ts — WorkerSpecialty, Worker.specialty
2. constants.ts — 專精定義
3. WorkerSystem — workTimer 根據 specialty 調整
4. GameScene — 點擊 worker 切換專精、worker 頭上顯示專精 icon
5. SpriteGenerator — 專精 icon sprites
6. SaveSystem — migration

---

## 實作順序

```
Phase A (加工) → Phase B (天氣) → Phase C (裝飾) → Phase D (Worker 專精)
```

Phase A 最重要：加工系統 = 中後期經濟核心，沒有它遊戲只有「種→賣」單一循環。
Phase B 次要：天氣增加視覺豐富度 + 策略層。
Phase C/D 可平行或延後。

## 預估影響範圍

| Phase | 新檔案 | 改動檔案 | 複雜度 |
|-------|--------|---------|--------|
| A 加工 | 0 | ~8 | 中（沿用 Facility 框架） |
| B 天氣 | 1 (WeatherSystem) | ~5 | 低 |
| C 裝飾 | 0 | ~5 | 低 |
| D 專精 | 0 | ~4 | 低 |
