# Tiny Terraces Clone — 專案規劃

## Context
建立一個 Tiny Terraces 風格的 Web idle farming game。技術棧：Phaser 3 + TypeScript + Vite。美術用 AI 生成 pixel art。存檔用 localStorage。

## 開發分階段進行，每個 Milestone 交付一個可玩的版本

---

## Milestone 1：可玩原型（最小 idle game）
**目標：** 一塊田、一個小人、一種作物，能自動種→長→收→賣→循環

### 1.1 專案初始化
- Vite + TypeScript + Phaser 3 scaffolding
- 基本目錄結構：
  ```
  src/
    main.ts          # Phaser Game 入口
    scenes/
      BootScene.ts   # 載入資源
      GameScene.ts   # 主遊戲場景
    systems/         # 遊戲邏輯系統
    entities/        # 數據定義
    assets/          # 美術資源（placeholder）
  ```

### 1.2 核心數據結構
```typescript
// 地圖格子
interface Tile {
  x: number;
  y: number;
  type: 'soil' | 'grass' | 'blocked';
}

// 作物
interface Crop {
  tileX: number;
  tileY: number;
  type: CropType;
  growthTimer: number;    // 剩餘生長時間 (ms)
  stage: 'seed' | 'growing' | 'ready';
  needsWater: boolean;
  needsWeeding: boolean;
}

// 小人
interface Worker {
  id: number;
  x: number;
  y: number;
  assignedArea: { x: number; y: number; w: number; h: number };
  state: 'idle' | 'moving' | 'working';
  currentTask: Task | null;
}

// 任務
type Task =
  | { type: 'plant'; target: Tile }
  | { type: 'water'; target: Crop }
  | { type: 'weed'; target: Crop }
  | { type: 'harvest'; target: Crop }

// 資源
interface Resources {
  money: number;
  crops: Record<CropType, number>;
}
```

### 1.3 核心系統
- **TickSystem** — 基於 delta time 的遊戲更新，處理離線進度
- **CropSystem** — 作物生長、需求（水/草）觸發
- **WorkerSystem** — 小人 AI：掃描區域 → 找任務 → 移動 → 執行
- **EconomySystem** — 自動賣出作物 → 賺錢

### 1.4 視覺
- Placeholder 色塊矩形代替 pixel art
- 等量俯視 (top-down) 網格地圖
- 小人用簡單的色塊 + 移動動畫

### 1.5 存檔
- 每 30 秒自動存到 localStorage
- 載入時計算離線時間，快進 tick

---

## Milestone 2：完整農場循環 ✅
- 多種作物（carrot / wheat / tomato，不同生長時間、售價）
- 製造更多小人（消耗 $15）
- 擴張地盤（點擊 grass $10 / tree $25 → soil）
- 基本 UI：資源顯示、作物選擇、手動賣出、色彩圖例
- Worker 不會搶同一個任務
- 背景 tab 離線追趕

---

## Milestone 3：升級與目標系統

### 3.1 每格指定作物 ✅
- `Tile.assignedCrop: CropType | null`，移除全局 `selectedCrop`
- 點擊 soil tile 循環切換（carrot → wheat → tomato → 停耕）
- 種植中只能設為停耕，空地可完整切換
- 左上角色塊標示指定作物，停耕顯示紅叉

### 3.2 升級系統
讓玩家花錢強化現有機制，提供明確的投資→回報循環。

- **Worker 速度升級** — 移動速度 +20% per level，花費遞增
- **作物生長加速** — 全局生長速度倍率，每級 +10%
- **澆水/除草間隔延長** — 減少維護頻率，每級 +15%
- **自動收穫** — 解鎖後 ready 作物自動收入倉庫，不需 worker 跑過去
- 數據：`state.upgrades: Record<UpgradeType, number>`（level）
- UI：升級面板，顯示當前等級、效果、下一級花費

### 3.3 訂單系統
給玩家短期目標，打破「無限種→賣」的單調循環。

- NPC 訂單隨機生成：「需要 5 carrot + 3 wheat」
- 完成訂單給額外金錢獎勵（比單賣貴 50-100%）
- 同時最多 3 個活躍訂單，有時間限制（如 5 分鐘）
- 過期不懲罰，只是消失換新的
- 數據：`state.orders: Order[]`
- UI：訂單欄，顯示需求、進度、剩餘時間、領取按鈕

### 3.4 科技樹
控制遊戲節奏，用研究點數解鎖新產業和能力。

**資源：研究點數（Research Points, RP）**
- 完成訂單、達成里程碑獲得 RP
- RP 用來解鎖科技樹節點

**科技樹結構（4 條分支）：**

```
                    [起點：基礎農業]
                    ├── 農業分支
                    │   ├── 多作物（解鎖 wheat / tomato）
                    │   ├── 肥料（生長加速 +25%）
                    │   ├── 溫室（無視天氣事件）
                    │   └── 基因改良（新高級作物：葡萄、咖啡豆）
                    ├── 畜牧分支
                    │   ├── 養雞場（產蛋，自動）
                    │   ├── 牧牛場（產奶，需牧草=wheat加工品）
                    │   ├── 養蜂場（產蜂蜜，加速附近作物授粉）
                    │   └── 羊毛工坊（產羊毛，高價）
                    ├── 漁業分支
                    │   ├── 魚塘（建在水源 tile，自動產魚）
                    │   ├── 蝦池（需飼料=作物加工品）
                    │   ├── 深海捕撈（高價魚，需漁船建築）
                    │   └── 水產加工（魚→壽司，蝦→蝦餅）
                    └── 工業分支
                        ├── 麵粉廠（wheat → flour）
                        ├── 罐頭工廠（任意農產品 → 罐頭，保值）
                        ├── 紡織廠（羊毛 → 布料）
                        └── 食品工廠（多原料 → 高級加工品）
```

- 數據：`state.techTree: Record<TechId, boolean>`
- 每個節點：`{ id, name, cost: number, requires: TechId[], unlocks: string }`
- 條件檢查純函數：`isTechUnlocked(state, id): boolean`
- UI：科技樹面板，已研究/可研究/鎖定三種狀態

### 3.5 更大地圖 + 攝影機
突破 10×10 限制，讓擴張有空間感。

- 地圖擴展到 20×20 或更大
- Phaser Camera 跟隨滑鼠拖曳 / WASD 平移
- UI 固定在螢幕上（不隨攝影機移動）
- 初始可見區域不變，擴張後才需要移動攝影機

---

## Milestone 4：畜牧與漁業

### 4.1 統一產業框架
所有產業共用同一套數據結構，只是配置不同。

```typescript
interface Facility {
  id: number;
  type: FacilityType;        // 'chicken_coop' | 'cow_barn' | 'fish_pond' | 'flour_mill' ...
  tileX: number;
  tileY: number;
  level: number;
  productionTimer: number;   // 倒計時
  inputBuffer: Partial<Record<ItemType, number>>;  // 等待投入的原料
  outputBuffer: Partial<Record<ItemType, number>>; // 產出等待收取
}
```

- `state.facilities: Facility[]`
- Worker 新任務類型：`'feed'`（投入原料）、`'collect'`（收取產出）
- 統一的 `FacilitySystem.ts` 處理所有設施的 tick

### 4.2 畜牧業
解鎖條件：科技樹「畜牧分支」

**養雞場**
- 建造：$50 + 10 wheat
- 自動產蛋，每 30 秒 1 個，不需原料
- 蛋可賣 $5 或用於加工

**牧牛場**
- 建造：$120 + 20 wheat
- 需要牧草（wheat 加工品）作為飼料
- 每消耗 2 牧草 → 產 1 牛奶（$12）
- Worker 需跑去投餵

**養蜂場**
- 建造：$80
- 自動產蜂蜜（$8），速度慢
- 被動效果：3×3 範圍內作物生長速度 +15%

**牧羊場**
- 建造：$150 + 30 wheat
- 需牧草飼料
- 產羊毛（$15），可送紡織廠加工成布料（$35）

### 4.3 漁業
解鎖條件：科技樹「漁業分支」
新 tile type：`'water'`（地圖邊緣或特定區域）

**魚塘**
- 建在 water tile 上，$60
- 自動產魚，每 45 秒 1 條，$6
- 不需原料，但產量低

**蝦池**
- 建在 water tile 上，$100
- 需飼料（carrot 加工品）
- 每消耗 3 飼料 → 產 2 蝦（$10）

**漁船碼頭**
- 建在 water tile 上，$200
- 自動出海，每 90 秒帶回高價深海魚（$25）
- 需要 Worker 操作

**水產加工站**
- 魚 → 壽司（$18）、蝦 → 蝦餅（$28）
- 需要科技樹「水產加工」節點

### 4.4 工業（加工鏈）
解鎖條件：科技樹「工業分支」

**一級加工：**
- 麵粉廠：wheat → flour（$4 → $8）
- 榨汁機：carrot → carrot juice（$3 → $7）
- 飼料機：carrot/wheat → 飼料/牧草（供畜牧使用）

**二級加工：**
- 罐頭工廠：任意農產品 → 罐頭（統一 $12，保值，不會腐壞）
- 紡織廠：羊毛 → 布料（$15 → $35）
- 烘焙坊：flour + egg → 麵包（$20）

**三級加工：**
- 食品工廠：多種原料 → 高級加工品
  - flour + tomato → 披薩（$40）
  - milk + egg + flour → 蛋糕（$60）
  - 壽司拼盤：魚 ×3 + 蝦 ×2 → $80

### 4.5 自動化建築
- **灑水器** — 自動澆水覆蓋 3×3 範圍
- **除草機** — 自動除草覆蓋 3×3 範圍
- **傳送帶** — 自動將設施產出送到加工站或倉庫
- **Worker Machine** — 產出虛擬 worker

---

## Milestone 5：裝飾與成就

### 5.1 裝飾系統
- 純視覺物品，花錢放置在空地上
- 種類：花壇、柵欄、石燈、噴泉、雕像、旗幟
- 部分裝飾有被動效果（噴泉：附近 worker 工作速度 +10%）
- 目前用不同顏色方塊代表

### 5.2 成就系統
- 里程碑式目標，分類：農業 / 畜牧 / 漁業 / 工業 / 綜合
- 例：「收穫 100 carrot」「建造第一座牧牛場」「完成 50 訂單」「製作 10 個蛋糕」
- 達成給 RP 獎勵、金錢、解鎖裝飾
- UI：成就列表面板

---

## Milestone 6：美術替換
- ✅ Canvas 程式碼生成像素風 sprite（SpriteGenerator.ts）
  - 4 tile sprites（grass/soil/tree/blocked）
  - 7 crop sprites（3 種 × seed 共用 + growing + ready）
  - 2 狀態 icon（水滴/雜草，12×12）
  - 2 worker sprites（idle/working，16×16）
- GameScene 改用 Phaser Image 物件取代 Graphics fillRect
- 後續：AI 生成高品質 pixel art 替換 canvas 繪製的 placeholder

---

## 備選方向（未排入里程碑，視情況加入）

### 市場價格波動
- 作物售價隨時間正弦波動（±30%）
- UI 顯示當前價格和趨勢箭頭
- 玩家選擇囤貨還是即賣

### 隨機事件
- 暴風雨：隨機毀壞 1-2 個作物
- 豐收季：生長速度 ×2 持續 60 秒
- 商人來訪：限時高價收購某種作物

### 不同地形區域
- 沙地：只能種特定作物，但不需除草
- 水源旁：減少澆水需求
- 肥沃土：生長速度加倍，但開墾費用高

### 每日挑戰
- 每天一個限時目標
- 完成給獨特獎勵（稀有裝飾、大量金錢）

### 季節系統
- 春夏秋冬輪替（每季 5 分鐘真實時間）
- 特定作物只能在特定季節種（wheat 秋冬、tomato 夏）
- 冬季：作物生長速度 -50%，但魚價 +30%
- 季節轉換有視覺變化（tile 顏色偏移）
- 配合溫室科技：可無視季節限制

### 倉庫容量
- 初始倉庫容量 50，超出不能收穫
- 升級倉庫（$50/$200/$800 → 100/200/500 容量）
- 加工品也佔倉庫空間
- 倒逼玩家建加工鏈或及時賣出，避免無腦囤貨

### 聲望系統
- 每次完成訂單、解鎖科技、建設設施 → 獲得聲望值
- 聲望等級解鎖：新客戶（更貴的訂單）、新地圖區域、稀有作物種子
- 相當於整體進度指標，讓玩家有明確的「等級」概念

### Worker 專精
- Worker 可指定專精：農夫/牧人/漁夫/工匠
- 專精 Worker 對應任務速度 +30%，非專精 -20%
- 增加 Worker 管理的策略深度
- UI：Worker 面板，可查看和切換專精

### 土地品質
- 每塊 soil 有隱藏的「肥力」值（0-100）
- 連續種植同一作物會降低肥力（-5 每次收穫）
- 肥力低 → 生長速度慢、產量低
- 恢復方式：休耕（自動回升）、施肥（消耗 $）、輪作（不同作物不降）
- 鼓勵多樣化種植而不是全種最貴的

### 天災保險
- 可購買保險（每季固定費用）
- 暴風雨/蟲害/乾旱時，保險賠償損失的 80%
- 不買保險 → 風險自擔
- 簡單的風險管理機制

### 多地圖/島嶼
- 解鎖新島嶼（每個有不同地形和資源分佈）
- 島嶼間可以貿易（A 島的魚運到 B 島賣更貴）
- 每個島獨立的 tile 地圖，切換查看
- 最終目標：建立跨島經濟網路

### 離線報告
- 回到遊戲時顯示離線期間摘要
- 「你離開了 2 小時，Worker 收穫了 X 作物，賺了 $Y」
- 簡單 modal，一鍵關閉

### 迷你遊戲
- 偶爾出現「黃金作物」，點擊小遊戲（限時連點/拼圖）
- 成功獲得大量金錢或稀有物品
- 失敗也不損失，只是錯過獎勵
- 打破純 idle 的被動感

---

## 先做 Milestone 1

### 執行步驟
1. `npm create vite@latest` 初始化 TypeScript 專案
2. `npm install phaser` 安裝 Phaser 3
3. 建立目錄結構和基本 Scene
4. 實作 Tile 地圖渲染（簡單網格）
5. 實作 Crop 系統（種植、生長、收穫）
6. 實作 Worker 系統（自動尋找任務、移動、執行）
7. 實作 Economy（收穫 → 金錢）
8. 實作 Save/Load（localStorage + 離線進度）
9. 基本 HUD（顯示金錢、作物數量）

### 驗證方式
- 啟動 `npm run dev`，瀏覽器打開能看到網格地圖
- 小人自動種田、澆水、除草、收穫
- 金錢數字持續增加
- 關掉瀏覽器重開，進度還在，離線期間的收益有計算
