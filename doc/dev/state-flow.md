# 狀態流架構文檔

## 🔄 整體資料流概覽

```
App (PostProvider)
├── Router
├── Navigation
└── Pages
    ├── PostsIndex  → usePost() → PostService → MarkdownFactory → MDX Files
    └── PostDetail  → usePost() → PostService → MarkdownFactory → MDX Files
```

## 📊 分層架構詳解

### 1. 應用層 (App Layer)
**位置：** `src/App.tsx`

```typescript
<PostProvider>  // 全域狀態管理
  <Router>      // 路由管理
    <Routes>    // 頁面路由
```

**職責：**
- 提供全域 PostProvider Context
- 管理路由和導航
- 應用級別的 Suspense 和錯誤邊界

### 2. 狀態管理層 (State Management Layer)
**位置：** `src/contexts/PostContext.tsx`

```typescript
interface PostState {
  posts: Post[]              // 所有文章快取
  currentPost: Post | null   // 當前查看的文章
  isLoading: boolean        // 全域載入狀態
  error: string | null      // 全域錯誤狀態
  isInitialized: boolean    // 初始化狀態
}

type PostAction = 
  | { type: 'FETCH_POSTS_START' }
  | { type: 'FETCH_POSTS_SUCCESS'; payload: Post[] }
  | { type: 'FETCH_POSTS_ERROR'; payload: string }
  | { type: 'FETCH_POST_START' }
  | { type: 'FETCH_POST_SUCCESS'; payload: Post }
  | { type: 'FETCH_POST_ERROR'; payload: string }
  | { type: 'SET_CURRENT_POST'; payload: Post | null }
  | { type: 'CLEAR_ERROR' }
```

**主要功能：**
- **狀態管理** - 使用 useReducer 管理複雜狀態
- **快取機制** - 避免重複 API 調用
- **統一 Loading/Error** - 全域的載入和錯誤狀態
- **智能載入** - 優先使用快取，必要時才重新載入

**對外接口：**
```typescript
interface PostContextType {
  // 狀態
  posts: Post[]
  currentPost: Post | null
  isLoading: boolean
  error: string | null
  isInitialized: boolean
  
  // Actions
  fetchAllPosts: () => Promise<void>
  fetchPostById: (id: string) => Promise<void>
  setCurrentPost: (post: Post | null) => void
  clearError: () => void
  
  // 工具函數
  getPostById: (id: string) => Post | undefined
  getPostsByTag: (tag: string) => Post[]
  getAllTags: () => string[]
}
```

### 3. 業務服務層 (Business Service Layer)
**位置：** `src/services/PostService.ts`

```typescript
class PostService {
  // 基本 CRUD 操作
  static async getAllPosts(): Promise<Post[]>
  static async getPostById(id: string): Promise<Post | undefined>
  static getAvailablePostIds(): string[]
  
  // 業務邏輯功能
  static async getPostsByTag(tag: string): Promise<Post[]>
  static async getAllTags(): Promise<string[]>
}
```

**職責：**
- **純業務邏輯** - 不包含 UI 狀態管理
- **可重用性** - 可在其他地方使用（SSR、CLI 工具等）
- **錯誤處理** - 統一的業務級錯誤處理
- **數據轉換** - 將底層數據轉換為業務對象

### 4. 核心邏輯層 (Core Logic Layer)
**位置：** `src/lib/MarkdownFactory.ts`

```typescript
class MarkdownFactory {
  // 底層文件操作
  private static getMDXModules()                        // Vite import.meta.glob
  private static extractIdFromPath(path: string)        // 路徑解析
  
  // 文章載入
  static async loadPostById(id: string): Promise<Post | undefined>
  static async loadAllPosts(): Promise<Post[]>
  static getAvailablePostIds(): string[]
}
```

**職責：**
- **文件系統操作** - 動態導入 MDX 文件
- **數據解析** - frontmatter 和組件解析
- **類型轉換** - 將 MDX 模組轉換為 Post 對象
- **錯誤處理** - 文件級別的錯誤處理

### 5. 數據源層 (Data Source Layer)
**位置：** `src/content/posts/*.mdx`

```mdx
---
title: "文章標題"
date: "2024-01-15"
author: "作者名稱"
tags: ["tag1", "tag2"]
---

# 文章內容

MDX 支援 React 組件...
```

**特點：**
- **靜態文件** - 編譯時處理，效能優異
- **類型安全** - TypeScript 支援
- **熱重載** - 開發時即時更新
- **React 組件** - 支援互動式內容

## 🔄 資料流運作機制

### 初始化流程
```
1. App 啟動 → PostProvider 初始化
2. useEffect 觸發 → fetchAllPosts()
3. PostService.getAllPosts() → MarkdownFactory.loadAllPosts()
4. 動態導入所有 MDX 文件 → 解析 frontmatter
5. 更新 Context 狀態 → posts: Post[]
```

### 文章列表頁面流程
```
1. PostsIndex 組件掛載
2. usePost() 獲取 { posts, isLoading }
3. 如果 posts 為空 → 顯示載入狀態
4. posts 載入完成 → 渲染文章列表
```

### 文章詳情頁面流程
```
1. PostDetail 組件掛載 → 獲取 URL 參數 id
2. useEffect 觸發 → fetchPostById(id)
3. 檢查快取 → 如果存在直接使用
4. 如果不存在 → PostService.getPostById(id)
5. MarkdownFactory.loadPostById(id) → 動態導入 MDX
6. 更新 currentPost → 渲染文章內容
```

## 🎯 設計優勢

### 1. 效能優化
- **快取機制** - 避免重複載入
- **按需載入** - 只載入需要的文章
- **編譯時優化** - MDX 編譯為高效的 React 組件

### 2. 開發體驗
- **類型安全** - 完整的 TypeScript 支援
- **熱重載** - 文件變化即時反映
- **錯誤處理** - 分層的錯誤處理機制

### 3. 可維護性
- **職責分離** - 每層都有明確的職責
- **可測試性** - 每層都可以獨立測試
- **可擴展性** - 容易添加新功能

### 4. 擴展性
- **狀態管理** - useReducer 支援複雜狀態變化
- **業務邏輯** - PostService 可重用於其他場景
- **數據源** - 容易切換到其他數據源（API、CMS 等）

## 🔧 未來擴展可能

### 狀態管理擴展
```typescript
// 可能的新 Action 類型
| { type: 'SEARCH_POSTS'; payload: string }
| { type: 'FILTER_BY_TAG'; payload: string }
| { type: 'SORT_POSTS'; payload: 'date' | 'title' | 'author' }
| { type: 'BOOKMARK_POST'; payload: string }
```

### 業務服務擴展
```typescript
class PostService {
  // 搜尋功能
  static async searchPosts(query: string): Promise<Post[]>
  
  // 分頁功能
  static async getPostsPaginated(page: number, limit: number): Promise<PaginatedPosts>
  
  // 相關文章
  static async getRelatedPosts(postId: string): Promise<Post[]>
}
```

### 數據源擴展
- **遠程 API** - 支援從 CMS 或 API 載入
- **資料庫** - 支援從資料庫載入
- **混合模式** - 靜態文件 + 動態內容

這個分層架構為未來的功能擴展提供了堅實的基礎。 