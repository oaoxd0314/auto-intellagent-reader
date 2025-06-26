# 狀態流架構文檔

## 🔄 整體資料流概覽

我們採用**混合架構**，結合 TanStack Query 和 Controller 模式：

```
App (PostProvider + QueryClient)
├── Router
├── Navigation
└── Pages
    ├── PostsIndex  → useQuery() → PostService → MarkdownFactory → MDX Files
    │               → usePost() → PostController (業務邏輯)
    └── PostDetail  → useQuery() → PostService → MarkdownFactory → MDX Files
                    → usePost() → PostController (業務邏輯)
```

### **雙路徑數據流**

```
路徑 1: 數據操作
UI → TanStack Query → Service → Data Source

路徑 2: 業務邏輯  
UI → Context → Controller → Service (如需要)
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

### 2. 混合狀態管理層 (Hybrid State Management Layer)

#### **2.1 TanStack Query 層** 
**位置：** `src/hooks/usePostQueries.ts`

```typescript
// 所有文章查詢
export function useAllPosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: () => PostService.getAllPosts(),
    staleTime: 5 * 60 * 1000, // 5分鐘快取
  })
}

// 單個文章查詢
export function usePostDetail(id: string) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => PostService.getPostById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10分鐘快取
  })
}

// 標籤查詢
export function useAllTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => PostService.getAllTags(),
    staleTime: 15 * 60 * 1000, // 15分鐘快取
  })
}
```

**主要功能：**
- **自動快取** - TanStack Query 自動管理快取
- **背景更新** - stale-while-revalidate 策略
- **錯誤重試** - 自動重試失敗的請求
- **Loading 狀態** - 自動管理 isPending、isFetching 狀態

#### **2.2 Context 層 (業務邏輯)**
**位置：** `src/contexts/PostContext.tsx`

```typescript
interface PostContextType {
  // 業務邏輯方法
  getPostsByTag: (tag: string) => Post[]
  getAllTags: () => string[]
  calculateReadingTime: (content: string) => number
  getRelatedPosts: (postId: string) => Post[]
  
  // Controller 實例
  postController: PostController
}
```

**主要功能：**
- **業務邏輯協調** - 複雜的數據處理和計算
- **Controller 管理** - 統一管理 Controller 實例
- **跨組件邏輯共享** - 共享複雜的業務邏輯

### 3. 業務服務層 (Business Service Layer)
**位置：** `src/services/PostService.ts`

```typescript
class PostService {
  // 基本 CRUD 操作 - 供 TanStack Query 使用
  static async getAllPosts(): Promise<Post[]>
  static async getPostById(id: string): Promise<Post | undefined>
  static async getAllTags(): Promise<string[]>
  static getAvailablePostIds(): string[]
}
```

**職責：**
- **純數據操作** - 不包含 UI 狀態管理和複雜業務邏輯
- **TanStack Query 適配** - 提供適合 Query 使用的 API
- **可重用性** - 可在其他地方使用（SSR、CLI 工具等）
- **錯誤處理** - 統一的數據級錯誤處理

### 4. 業務控制層 (Business Controller Layer)
**位置：** `src/controllers/PostController.ts`

```typescript
class PostController {
  // 複雜業務邏輯
  filterPostsByTag(posts: Post[], tag: string): Post[]
  extractAllTags(posts: Post[]): string[]
  calculateReadingTime(content: string): number
  getRelatedPosts(posts: Post[], currentPostId: string): Post[]
  
  // 策略模式管理
  addSearchStrategy(strategy: SearchStrategy): void
  removeSearchStrategy(name: string): void
}
```

**職責：**
- **複雜業務邏輯** - 數據計算、篩選、分析
- **策略模式管理** - 管理各種業務策略
- **跨領域協調** - 協調多個 Service 的操作
- **演算法實現** - 實現複雜的業務演算法

### 5. 核心邏輯層 (Core Logic Layer)
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

### 6. 數據源層 (Data Source Layer)
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
1. App 啟動 → PostProvider + QueryClient 初始化
2. 首次數據請求觸發 → TanStack Query 自動管理
3. 無需手動初始化載入
```

### 文章列表頁面流程 (TanStack Query 路徑)
```
1. PostsIndex 組件掛載
2. useAllPosts() → TanStack Query 檢查快取
3. 如果快取存在且新鮮 → 直接返回數據
4. 如果快取過期或不存在 → PostService.getAllPosts()
5. MarkdownFactory.loadAllPosts() → 動態導入所有 MDX
6. 自動更新 UI → 渲染文章列表
```

### 文章詳情頁面流程 (TanStack Query 路徑)
```
1. PostDetail 組件掛載 → 獲取 URL 參數 id
2. usePostDetail(id) → TanStack Query 檢查快取
3. 如果快取存在 → 直接返回數據
4. 如果不存在 → PostService.getPostById(id)
5. MarkdownFactory.loadPostById(id) → 動態導入 MDX
6. 自動更新 UI → 渲染文章內容
```

### 業務邏輯處理流程 (Controller 路徑)
```
1. UI 組件需要篩選數據 → usePost().getPostsByTag(tag)
2. Context 委託給 Controller → postController.filterPostsByTag(posts, tag)
3. Controller 執行業務邏輯 → 返回篩選結果
4. UI 組件獲得處理後的數據 → 渲染結果
```

## 🎯 混合架構設計優勢

### 1. 效能優化
- **智能快取** - TanStack Query 自動管理快取、背景更新
- **按需載入** - 只載入需要的文章
- **編譯時優化** - MDX 編譯為高效的 React 組件
- **自動重試** - 失敗請求自動重試
- **Request Deduplication** - 相同請求自動去重

### 2. 開發體驗
- **類型安全** - 完整的 TypeScript 支援
- **熱重載** - 文件變化即時反映
- **分層錯誤處理** - TanStack Query + Controller 雙重錯誤處理
- **DevTools 支援** - React Query DevTools 調試
- **自動 Loading 狀態** - 無需手動管理 loading 狀態

### 3. 可維護性
- **清晰職責分離** - 數據操作 vs 業務邏輯分離
- **獨立測試** - 每層都可以獨立測試
- **Controller 輕量化** - 只處理複雜業務邏輯
- **Service 簡化** - 專注純數據操作

### 4. 擴展性
- **雙路徑架構** - 可根據需求選擇合適的路徑
- **Query 組合** - 可輕鬆組合多個 Query
- **Controller 策略** - 支援複雜的業務策略擴展
- **數據源靈活** - 容易切換到其他數據源（API、CMS 等）

### 5. 性能與用戶體驗
- **Stale-While-Revalidate** - 先顯示快取，背景更新
- **Optimistic Updates** - 樂觀更新提升用戶體驗
- **Infinite Queries** - 支援無限滾動
- **Prefetching** - 預載入提升性能

## 🔧 未來擴展可能

### TanStack Query 擴展
```typescript
// 搜尋功能
export function useSearchPosts(query: string) {
  return useQuery({
    queryKey: ['posts', 'search', query],
    queryFn: () => PostService.searchPosts(query),
    enabled: !!query && query.length > 2,
  })
}

// 無限滾動
export function useInfinitePosts() {
  return useInfiniteQuery({
    queryKey: ['posts', 'infinite'],
    queryFn: ({ pageParam = 0 }) => PostService.getPostsPaginated(pageParam, 10),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })
}

// 樂觀更新
export function useBookmarkPost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: PostService.bookmarkPost,
    onMutate: async (postId) => {
      // 樂觀更新邏輯
    },
  })
}
```

### Controller 業務邏輯擴展
```typescript
class PostController {
  // 進階搜尋策略
  searchWithFilters(posts: Post[], query: string, filters: SearchFilters): Post[]
  
  // 個人化推薦
  getRecommendedPosts(userPreferences: UserPreferences): Post[]
  
  // 閱讀進度追蹤
  updateReadingProgress(postId: string, progress: number): void
  
  // 智能標籤建議
  suggestTags(content: string): string[]
}
```

### 混合架構優勢
- **TanStack Query** - 處理所有數據獲取、快取、同步
- **Controller** - 處理複雜業務邏輯、演算法、策略
- **彈性擴展** - 可根據需求選擇合適的路徑
- **性能最佳化** - 自動快取 + 智能業務邏輯

這個混合架構為未來的功能擴展提供了更靈活和強大的基礎。 