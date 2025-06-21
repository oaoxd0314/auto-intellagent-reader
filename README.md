# AI Sidebar Suggestion App - 練習題最低架構

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

* 框架：React + Tailwind CSS + shadcn/ui
* 組件

  * `<ReaderPage>`：主要閱讀頁面
  * `<AISidebar>`：建議區塊
  * `<SuggestionBubble>` / `<SuggestionCard>`：建議 UI 元件

---

## 流程簡圖

User Event (Observer) → Controller → SuggestionFactory → Strategy.generate()
↘︎ shouldExpose() → UI Render

---

## 實作範圍（最低限）

1. **Observer**

   * 建一個 hook：`useReaderObserver()`，回傳 event stream (scroll / highlight / idle / click)

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

## 📁 Folder Structure (建議)

```
/src
  /app
    /reader
      page.tsx          # folder-as-router 機制用的 main entry
      layout.tsx        # optional, sidebar 用 layout
      /components
        AISidebar.tsx
        SuggestionBubble.tsx
        SuggestionCard.tsx
      /hooks
        useReaderObserver.ts
      /controllers
        ReaderController.ts
      /strategies
        SuggestionStrategy.ts
        BookmarkStrategy.ts
        RelatedArticleStrategy.ts
        ShareableQuoteStrategy.ts
      /factories
        SuggestionFactory.ts
  /shared
    /components
      ... (通用 UI 元件)
    /hooks
      ... (通用 hooks)
    /utils
      ... (工具類)
  index.tsx
  App.tsx
```

---

## router 引擎建議

| 技術選項                           | 建議                                    |
| ------------------------------ | ------------------------------------- |
| React Router v6                | 可直接配 folder as route (搭 Vite + React) |
| Next.js app router             | 也可，page.tsx 就走 /app 樣式                |
| Vite + React + TanStack Router | 輕量版 folder route                      |

---

## Summary

* 主軸是 `/app/reader` → 很好擴充其他 AI driven page
* strategy / controller / observer 各自分層，**低耦合**，方便重構
* Sidebar layout 用 layout.tsx 包住，乾淨
* 保留 shared 元件層，方便練 shadcn/ui

---

## 延伸可能

* 支援 AI API mock
* 策略 hot-swap
* 加入 xState actor 版 controller
* 延伸到 blog / docs 產品線

---
