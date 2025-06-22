# AI Sidebar Suggestion App - 練習題架構

## 題目

* 使用者正在閱讀一篇長文章（技術文、blog、研究文）
* 右側有一個 AI Sidebar，觀察 user 行為，**即時提出互動建議**

  * 例如：加入書籤、推薦延伸閱讀、快速分享佳句

---

## 架構

### Pattern 組成

1. **Strategy Pattern**

   * 不同「AI Suggestion 策略」可以切換

     * BookmarkStrategy
     * RelatedArticleStrategy
     * ShareableQuoteStrategy

2. **Controller**

   * 主 Controller 管理畫面狀態 + user context
   * Model-driven Controller 呼叫 AI 策略，產生建議
   * 兩者可共用 SuggestionFactory

3. **Observer Pattern**

   * 監聽 user 行為 event stream（data pipeline）

     * scroll position
     * text highlight
     * paragraph idle time
     * tag click
   * 驅動 AI Controller 判斷是否需要出建議

---

## 技術架構

* 框架：React 19 + TypeScript + Tailwind CSS + shadcn/ui
* 路由：React Router v6 + 文件系統路由（類似 Next.js）
* 組件

  * `<ReaderPage>`：主要閱讀頁面
  * `<AISidebar>`：建議區塊
  * `<SuggestionBubble>` / `<SuggestionCard>`：建議 UI 元件

---

## 流程簡圖

User Event (Observer) → Controller → SuggestionFactory → Strategy.generate()
↘︎ shouldExpose() → UI Render

---

## 實作範圍（已完成）

1. **文件系統路由**

   * 建置 `/pages` 目錄結構，自動生成路由
   * 支援懶加載和 Suspense

2. **Strategy interface**

   ```ts
   interface SuggestionStrategy {
     generate(context: ReaderContext): Suggestion | null
   }
   ```

3. **SuggestionFactory**

   * 根據事件建立對應 SuggestionStrategy

4. **Controller**

   * 管理 context、呼叫策略、判斷 shouldExpose

5. **UI**

   * 固定 Sidebar
   * 動態 append Suggestion UI 元件（toast, card, bubble...）

---

## 📁 Folder Structure (實際架構)

```
src/
├── pages/                    # 頁面目錄（類似 Next.js）
│   ├── index.tsx            # / (首頁)
│   ├── about.tsx            # /about (關於頁面)
│   └── reader.tsx           # /reader (閱讀器頁面)
├── router/
│   └── routes.tsx           # 路由配置生成器
├── components/
│   ├── ui/                  # shadcn/ui 組件
│   │   ├── button.tsx
│   │   └── card.tsx
│   └── Navigation.tsx       # 導航組件
├── lib/
│   └── utils.ts             # 工具函數
├── App.tsx                  # 主應用組件
└── main.tsx                 # 應用入口
```

---

## 路由引擎實現

| 技術選項                           | 實現                                    |
| ------------------------------ | ------------------------------------- |
| React Router v6                | ✅ 已實現，配合文件系統路由架構 |
| 文件系統路由                     | ✅ 基於 `/pages` 目錄自動生成 |
| 懶加載 + Suspense              | ✅ 支援頁面按需加載 |

---

## 運行方式

```bash
# 安裝依賴
pnpm install

# 啟動開發服務器
pnpm dev
```

訪問 `http://localhost:5173` 查看應用


---

## 延伸可能

* 支援 AI API mock
* 策略 hot-swap
* 加入 xState actor 版 controller
* 延伸到 blog / docs 產品線

---
