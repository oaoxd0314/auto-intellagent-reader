# 系統架構規格

## 🏗️ 系統架構

### 整體架構圖
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Events   │───▶│   Controller    │───▶│  AI Strategies  │
│                 │    │                 │    │                 │
│ • Scroll        │    │ • State Mgmt    │    │ • Bookmark      │
│ • Hover         │    │ • Context       │    │ • Related       │
│ • Select        │    │ • Event Handler │    │ • Shareable     │
│ • Idle          │    │                 │    │ • Progress      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Suggestion     │    │   UI Render     │
                       │   Factory       │    │                 │
                       │                 │    │ • Bubble        │
                       │ • Strategy      │    │ • Card          │
                       │ • Selection     │    │ • Animation     │
                       │ • Generation    │    │ • Dynamic       │
                       └─────────────────┘    └─────────────────┘
```

### 核心設計模式

#### 1. **Strategy Pattern** - AI 建議策略
```typescript
interface SuggestionStrategy {
  generate(context: ReaderContext): Suggestion | null
  shouldExpose(context: ReaderContext): boolean
  getPriority(): number
}
```

#### 2. **Observer Pattern** - 用戶行為監聽
```typescript
interface UserEventObserver {
  onScroll(event: ScrollEvent): void
  onHover(event: HoverEvent): void
  onSelect(event: SelectEvent): void
  onIdle(event: IdleEvent): void
}
```

#### 3. **Factory Pattern** - 建議生成工廠
```typescript
class SuggestionFactory {
  createStrategy(event: UserEvent): SuggestionStrategy
  generateSuggestion(context: ReaderContext): Suggestion[]
}
```

## 🛠️ 技術棧

### 前端框架
- **React 19** - 最新版本，支援 Concurrent Features
- **TypeScript** - 類型安全，更好的開發體驗
- **Vite** - 快速開發和構建工具

### UI 框架
- **Tailwind CSS** - 原子化 CSS 框架
- **shadcn/ui** - 高質量 React 組件庫
- **Lucide React** - 現代化圖標庫

### 路由系統
- **React Router v6** - 聲明式路由
- **文件系統路由** - 類似 Next.js 的自動路由生成

### 狀態管理
- **React Context** - 輕量級狀態管理
- **Custom Hooks** - 邏輯復用
- **Event-driven** - 事件驅動架構

## 📁 項目結構

```
src/
├── pages/                    # 頁面目錄（文件系統路由）
│   ├── index.tsx            # 首頁 (/)
│   ├── about.tsx            # 關於頁面 (/about)
│   └── reader.tsx           # 閱讀器頁面 (/reader)
├── components/              # 組件目錄
│   ├── ui/                  # shadcn/ui 基礎組件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── reader/              # 閱讀器相關組件
│   │   ├── ReaderPage.tsx
│   │   ├── AISidebar.tsx
│   │   └── SuggestionCard.tsx
│   └── Navigation.tsx       # 導航組件
├── lib/                     # 工具庫
│   ├── utils.ts             # 通用工具函數
│   ├── types.ts             # TypeScript 類型定義
│   └── constants.ts         # 常量定義
├── hooks/                   # 自定義 Hooks
│   ├── useReaderContext.ts
│   ├── useUserEvents.ts
│   └── useSuggestions.ts
├── strategies/              # AI 策略實現
│   ├── base/
│   │   └── SuggestionStrategy.ts
│   ├── BookmarkStrategy.ts
│   ├── RelatedArticleStrategy.ts
│   └── ShareableQuoteStrategy.ts
├── controllers/             # 控制器
│   ├── AbstractController.ts
│   ├── ReaderController.ts
│   └── AIController.ts
├── observers/               # 觀察者模式
│   ├── UserEventObserver.ts
│   ├── ScrollObserver.ts
│   └── IdleObserver.ts
├── factories/               # 工廠模式
│   └── SuggestionFactory.ts
├── router/
│   └── routes.tsx           # 路由配置生成器
├── App.tsx                  # 主應用組件
└── main.tsx                 # 應用入口
```

## 🔄 數據流設計

### 事件驅動流程
```
1. User Action (滾動/懸停/選擇)
   ↓
2. Event Observer (捕獲用戶行為)
   ↓
3. Controller (處理事件邏輯)
   ↓
4. Context Update (更新閱讀上下文)
   ↓
5. Strategy Selection (選擇合適策略)
   ↓
6. Suggestion Generation (生成建議)
   ↓
7. UI Render (渲染建議組件)
```

### 上下文數據結構
```typescript
interface ReaderContext {
  // 用戶行為數據
  userBehavior: {
    scrollPosition: number
    currentSection: string
    idleTime: number
    selectedText: string
    hoveredElement: HTMLElement | null
  }
  
  // 文章數據
  article: {
    id: string
    title: string
    content: string
    metadata: ArticleMetadata
  }
  
  // 建議狀態
  suggestions: {
    active: Suggestion[]
    history: Suggestion[]
    dismissed: string[]
  }
}
``` 