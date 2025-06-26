# 系統架構規格

## 🏗️ 系統架構

### 分層架構原則

本系統採用清晰的四層架構設計，確保責任分離和代碼可維護性：

```
UI Components → Context → Controller → Service
```

這是一個類似於 MVC 的多層及責任架構：

| 你的層級          | 對照於 MVC 中可能的角色 | 說明                           |
| ------------- | -------------- | ---------------------------- |
| UI Components | View           | 呈現資料給使用者，處理使用者互動             |
| Context       | Model（部分）      | 保存狀態（state），也可能用來共享資料        |
| Controller    | Controller     | 處理使用者動作，協調 Context 與 Service |
| Service       | Model（商業邏輯層）   | 執行實際邏輯，例如 API 請求、資料轉換等       |

#### **分層責任定義**

**🎯 Context 層**
- **職責**: React 狀態管理和 UI 邏輯
- **負責**: 
  - 管理組件狀態（useState、useReducer）
  - 處理 UI 相關的快取邏輯
  - 提供 React Hooks 接口
  - 事件分發給 Controller 層
- **不負責**: 業務邏輯計算、數據持久化

**🎮 Controller 層**
- **職責**: 協調業務邏輯和流程控制
- **負責**:
  - 業務邏輯協調（如數據篩選、計算）
  - 流程控制（如追蹤開始/停止）
  - 策略模式管理
  - 事件系統和狀態管理
  - 錯誤處理和日誌記錄
- **不負責**: UI 狀態管理、直接數據 CRUD

**🔧 Service 層**
- **職責**: 專注數據操作和持久化
- **負責**:
  - 數據 CRUD 操作
  - 外部 API 調用
  - 數據持久化（localStorage、IndexedDB）
  - 數據格式轉換
  - 基礎工具函數
- **不負責**: 業務邏輯、UI 狀態管理

#### **層級依賴規則**
- ✅ Context → Controller → Service
- ❌ Service 不能直接調用 Context
- ❌ Controller 不能直接操作 React 狀態
- ❌ Service 不能包含業務邏輯計算

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
│   ├── reader.tsx           # 閱讀器頁面 (/reader)
│   └── posts/               # 文章相關頁面
│       ├── index.tsx        # 文章列表頁
│       └── [id]/            # 動態路由
│           └── index.tsx    # 文章詳情頁
├── components/              # UI 組件目錄
│   ├── ui/                  # shadcn/ui 基礎組件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   └── Navigation.tsx       # 導航組件
├── contexts/                # Context 層 - React 狀態管理
│   └── PostContext.tsx      # 文章相關狀態管理
├── controllers/             # Controller 層 - 業務邏輯協調
│   ├── AbstractController.ts # 控制器基類
│   ├── PostController.ts    # 文章業務邏輯控制器
│   ├── BehaviorController.ts # 行為追蹤控制器
│   └── index.ts             # 控制器導出
├── services/                # Service 層 - 數據操作
│   ├── PostService.ts       # 文章數據服務
│   ├── BehaviorService.ts   # 行為數據服務
│   └── PostDataSource.ts   # 數據源服務
├── lib/                     # 工具庫和核心邏輯
│   ├── MarkdownFactory.ts   # MDX 文件處理器
│   └── utils.ts             # 通用工具函數
├── types/                   # TypeScript 類型定義
│   ├── post.ts              # 文章相關類型
│   ├── behavior.ts          # 行為追蹤類型
│   ├── controller.ts        # 控制器類型
│   └── suggestion.ts        # 建議系統類型
├── content/                 # 靜態內容文件
│   └── posts/               # MDX 文章文件
│       ├── getting-started.mdx
│       ├── react-best-practices.mdx
│       └── markdown-guide.mdx
├── router/                  # 路由配置
│   └── routes.tsx           # 路由定義
├── App.tsx                  # 主應用組件
├── main.tsx                 # 應用入口
└── index.css                # 全局樣式
```

## 🔄 數據流設計

### 混合架構數據流
我們採用**混合架構**，根據職責選擇不同的數據流路徑：

```
// 路徑 1: 純數據操作 (CRUD)
UI Components → Context → TanStack Query → Service
     ↑            ↓           ↓              ↓
   Render    State Mgmt   Caching &      Data Layer
   Update    & Events     Fetching       Operations

// 路徑 2: 複雜業務邏輯
UI Components → Context → Controller → Service
     ↑            ↓         ↓           ↓
   Render    State Mgmt  Business   Data Layer
   Update    & Events    Logic      Operations
```

### **架構決策原則**

| 場景 | 使用路徑 | 原因 |
|------|----------|------|
| 簡單 CRUD 操作 | Context → TanStack Query → Service | 自動快取、錯誤處理、Loading 狀態 |
| 複雜業務邏輯 | Context → Controller → Service | 業務邏輯協調、策略模式管理 |
| 數據計算/篩選 | Context → Controller → Service | 需要複雜的數據處理邏輯 |
| API 調用 | Context → TanStack Query → Service | 需要快取、重試、背景更新 |

### 實際調用流程

#### **路徑 1: 數據操作流程**
```typescript
// 1. UI 組件使用 TanStack Query Hook
const { data: posts, isLoading, error } = useQuery({
  queryKey: ['posts'],
  queryFn: () => PostService.getAllPosts(),
  staleTime: 5 * 60 * 1000, // 5分鐘快取
})

// 2. TanStack Query 調用 Service
const posts = await PostService.getAllPosts()

// 3. Service 處理數據操作
return await MarkdownFactory.loadAllPosts()
```

#### **路徑 2: 業務邏輯流程**
```typescript
// 1. UI 組件調用 Context
const { getPostsByTag, getAllTags } = usePost()

// 2. Context 委託給 Controller
const postController = PostController.getInstance()
const filteredPosts = postController.filterPostsByTag(posts, tag)

// 3. Controller 執行業務邏輯
return posts.filter(post => post.tags?.includes(tag))
```

### 事件驅動流程
```
1. User Action (滾動/懸停/選擇)
   ↓
2. Context (捕獲 React 事件)
   ↓
3. Controller (處理業務邏輯)
   ↓
4. Service (數據持久化)
   ↓
5. Controller (策略分析)
   ↓
6. Context (狀態更新)
   ↓
7. UI Render (組件重新渲染)
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