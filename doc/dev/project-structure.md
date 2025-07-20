# 📁 Controller-Facade 簡化架構目錄結構

## 🏗️ 整體目錄組織

本專案採用 **Controller-Facade Pattern** 的簡化架構組織，每個目錄都有明確的職責和邊界。

```
src/
├── hooks/              # UI 交互層 - Hook 實現
├── controllers/        # 業務邏輯層 - Controller 實現
├── contexts/           # 狀態管理層 - Context 實現
├── lib/               # 工廠層 - Factory 實現
├── services/          # 數據層 - Service 實現
├── types/             # 類型定義
├── components/        # UI 組件
├── pages/             # 頁面組件
└── router/            # 路由配置
```

## 🎭 各層目錄詳解

### 1. **hooks/ - UI 交互層**

**職責：** UI 狀態管理 + Controller 調用的抽象層
**原則：** 封裝所有複雜性，為 UI 提供簡潔接口

```
hooks/
├── usePostDetail.ts         # 文章詳情功能
├── usePostList.ts          # 文章列表功能
├── useCommentSection.ts    # 評論區功能
├── useTextSelection.ts     # 文字選擇功能
├── useSearch.ts           # 搜索功能
├── useInteractionStats.ts # 互動統計功能
└── index.ts              # Hook 統一導出
```

#### **Hook 文件結構範例**
```typescript
// hooks/usePostDetail.ts
import { useState, useEffect, useCallback } from 'react'
import { usePostController } from '../controllers'

export function usePostDetail(id: string) {
  const controller = usePostController()
  
  // UI 狀態管理
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 業務邏輯調用
  useEffect(() => {
    const loadPost = async () => {
      try {
        await controller.getPostById(id)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    loadPost()
  }, [id, controller])
  
  return {
    post: controller.getCachedPost(id),
    isLoading,
    error,
    refreshPost: () => controller.refreshPost(id),
    markAsRead: () => controller.markPostAsRead(id)
  }
}
```

#### **Hook 命名規範**
- **功能型**: `use{Feature}` - `useCommentSection`, `useTextSelection`
- **數據型**: `use{Entity}{Action}` - `usePostDetail`, `usePostList`
- **工具型**: `use{Utility}` - `useSearch`, `useInteractionStats`

### 2. **controllers/ - 業務邏輯層**

**職責：** 業務邏輯協調、狀態管理協調、錯誤處理
**原則：** 這裡是「髒」的地方，承擔所有複雜的業務邏輯組合

```
controllers/
├── PostController.ts          # 文章業務邏輯
├── InteractionController.ts   # 互動業務邏輯
├── BehaviorController.ts      # 行為追蹤邏輯
├── AbstractController.ts      # Controller 基類
└── index.ts                  # Controller 統一導出和 Provider
```

#### **Controller 文件結構範例**
```typescript
// controllers/PostController.ts
export class PostController {
  private postCache = new Map<string, Post>()
  private loadingStates = new Map<string, boolean>()
  
  constructor(
    private postContext: PostContext,
    private behaviorContext: BehaviorContext,
    private interactionContext: InteractionContext
  ) {}
  
  // 複雜業務邏輯協調
  async getPostById(id: string): Promise<Post | null> {
    // 1. 檢查快取
    if (this.postCache.has(id)) {
      this.behaviorContext.trackCacheHit('post', id)
      return this.postCache.get(id)!
    }
    
    // 2. 從 Service 獲取
    const post = await PostService.getPostById(id)
    
    // 3. 使用 Factory 處理
    const processedPost = PostFactory.addMetadata(post)
    
    // 4. 更新狀態
    this.postCache.set(id, processedPost)
    this.postContext.setCurrentPost(processedPost)
    this.behaviorContext.trackPostView(id)
    
    return processedPost
  }
  
  // 複雜業務邏輯組合
  async addCommentWithValidation(postId: string, content: string): Promise<Comment> {
    // 業務驗證、創建、保存、狀態更新、行為追蹤
  }
}
```

#### **Controller 組織原則**
- **領域分離**: 按業務領域劃分 Controller
- **單一職責**: 每個 Controller 負責特定領域的業務邏輯
- **依賴注入**: Constructor 注入所需的 Context 和 Service

### 3. **contexts/ - 狀態管理層**

**職責：** 純狀態管理，不包含業務邏輯
**原則：** 只管理狀態，提供基本的 CRUD 操作

```
contexts/
├── PostContext.tsx           # 文章狀態管理
├── InteractionContext.tsx   # 互動狀態管理
├── BehaviorContext.tsx      # 行為追蹤狀態
├── PostActionsContext.tsx   # 文章操作狀態 (已廢棄，整合到 Controller)
└── index.ts                # Context 統一導出
```

#### **Context 文件結構範例**
```typescript
// contexts/PostContext.tsx
interface PostState {
  posts: Post[]
  currentPost: Post | null
  searchHistory: string[]
  favorites: string[]
}

interface PostContextType extends PostState {
  // 純狀態操作
  setPosts: (posts: Post[]) => void
  setCurrentPost: (post: Post | null) => void
  addToSearchHistory: (query: string) => void
  toggleFavorite: (postId: string) => void
  
  // 簡單狀態查詢
  getCurrentPost: () => Post | null
  getPostById: (id: string) => Post | undefined
  getFavoritePosts: () => Post[]
}

export function PostProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(postReducer, initialState)
  
  const contextValue = useMemo(() => ({
    ...state,
    setPosts: (posts: Post[]) => dispatch({ type: 'SET_POSTS', payload: posts }),
    setCurrentPost: (post: Post | null) => dispatch({ type: 'SET_CURRENT_POST', payload: post }),
    // ... 其他純狀態操作
  }), [state])
  
  return (
    <PostContext.Provider value={contextValue}>
      {children}
    </PostContext.Provider>
  )
}
```

#### **Context 設計原則**
- **純狀態管理**: 不包含業務邏輯，只管理狀態
- **簡單操作**: 提供基本的狀態 CRUD 操作
- **領域邊界**: 按領域劃分 Context

### 4. **lib/ - 工廠層**

**職責：** 物件創建和數據轉換
**原則：** 專注於物件創建邏輯，單一職責

```
lib/
├── MarkdownFactory.ts        # MDX 文件處理工廠 (已存在)
├── PostFactory.ts           # 文章物件工廠
├── CommentFactory.ts        # 評論物件工廠
├── HighlightFactory.ts      # 高亮物件工廠
├── utils.ts                # 通用工具函數 (已存在)
└── index.ts               # Factory 統一導出
```

#### **Factory 文件結構範例**
```typescript
// lib/PostFactory.ts
export class PostFactory {
  // MDX -> Post 的複雜轉換
  static async createFromMDX(mdxModule: any, id: string): Promise<Post> {
    const { frontmatter, default: Component } = mdxModule
    
    return {
      id,
      title: frontmatter.title,
      date: frontmatter.date,
      content: Component,
      slug: this.generateSlug(frontmatter.title),
      readingTime: this.calculateReadingTime(frontmatter.content),
      metadata: {
        wordCount: this.countWords(frontmatter.content),
        createdAt: new Date().toISOString()
      }
    }
  }
  
  // 為現有 Post 添加元數據
  static addMetadata(post: Post): Post {
    return {
      ...post,
      metadata: {
        ...post.metadata,
        lastViewedAt: new Date().toISOString(),
        viewCount: (post.metadata?.viewCount || 0) + 1
      }
    }
  }
  
  private static generateSlug(title: string): string {
    return title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
}
```

#### **Factory 設計原則**
- **靜態方法**: 使用靜態方法，不維護狀態
- **單一職責**: 每個 Factory 負責特定類型的物件創建
- **純函數**: 創建方法應該是純函數，可預測且可測試

### 5. **services/ - 數據層**

**職責：** 純數據操作，可直接替換成 API
**原則：** 不包含業務邏輯，專注於數據存取

```
services/
├── PostService.ts           # 文章服務 (已存在)
├── InteractionService.ts   # 互動數據服務
├── BehaviorService.ts      # 行為追蹤服務 (已存在)
└── index.ts               # Service 統一導出
```

#### **Service 文件結構範例**
```typescript
// services/PostService.ts
export class PostService {
  // 文章數據操作和業務邏輯
  static async getAllPosts(): Promise<Post[]> {
    // 直接從 MDX 文件載入或 API 調用
    return this.loadAllPosts()
  }
  
  static async getPostById(id: string): Promise<Post | undefined> {
    return this.loadPostById(id)
  }
  
  static async savePost(post: Post): Promise<void> {
    return this.save(post)
  }
  
  static async deletePost(id: string): Promise<void> {
    return this.delete(id)
  }
  
  static getAvailablePostIds(): string[] {
    return this.getAvailableIds()
  }
}
```

#### **Service 設計原則**
- **靜態方法**: 使用靜態方法，不維護狀態
- **純數據操作**: 不包含業務邏輯
- **可替換性**: 可以輕易替換成不同的數據源

### 6. **types/ - 類型定義**

**職責：** 集中管理所有類型定義
**原則：** 按領域組織，保持類型的一致性

```
types/
├── post.ts              # 文章相關類型 (已存在)
├── interaction.ts       # 互動相關類型 (評論、高亮等)
├── behavior.ts         # 行為追蹤類型 (已存在)
├── controller.ts       # Controller 相關類型 (已存在)
├── suggestion.ts       # 建議系統類型 (已存在)
├── common.ts          # 通用類型
└── index.ts          # 類型統一導出
```

#### **類型文件範例**
```typescript
// types/interaction.ts
export interface Comment {
  id: string
  postId: string
  content: string
  userId?: string
  type: 'comment'
  createdAt: string
  updatedAt: string
  metadata: {
    wordCount: number
    isEdited: boolean
  }
}

export interface Highlight {
  id: string
  postId: string
  selectedText: string
  position: Position
  type: 'highlight'
  color: string
  createdAt: string
  metadata: {
    textLength: number
    pageX: number
    pageY: number
  }
}

export interface Position {
  x: number
  y: number
}
```

### 7. **components/ - UI 組件**

**職責：** 純 UI 渲染，只調用 Hook
**原則：** 不直接接觸 Controller、Context、Service

```
components/
├── ui/                    # 基礎 UI 組件 (已存在)
│   ├── button.tsx
│   ├── card.tsx
│   └── popover.tsx
├── InteractionStats.tsx   # 互動統計組件 (已存在)
├── Navigation.tsx         # 導航組件 (已存在)
├── PostCard.tsx          # 文章卡片組件
├── CommentSection.tsx    # 評論區組件
├── TextSelection.tsx     # 文字選擇組件
└── index.ts             # 組件統一導出
```

#### **組件設計原則**
```typescript
// ✅ 好的組件設計 - 只調用 Hook
function PostDetailPage() {
  const { id } = useParams()
  const { post, isLoading, error } = usePostDetail(id)
  const commentSection = useCommentSection(id)
  const textSelection = useTextSelection()
  
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!post) return <NotFound />
  
  return (
    <div>
      <PostContent 
        post={post}
        onTextSelect={textSelection.handleSelection}
      />
      <CommentSection
        comments={commentSection.comments}
        onSubmit={commentSection.submitComment}
      />
    </div>
  )
}

// ❌ 避免 - 組件直接操作多層
function BadComponent() {
  const controller = usePostController()        // ❌ 不應該直接調用
  const context = usePostContext()             // ❌ 不應該直接調用
  const service = PostService.getAllPosts()   // ❌ 絕對不可以
}
```

### 8. **pages/ - 頁面組件**

**職責：** 頁面級組件，組合多個功能組件
**原則：** 使用 Hook 獲取數據，組合功能組件

```
pages/
├── index.tsx             # 首頁
├── about.tsx            # 關於頁面
├── 404.tsx             # 404 頁面
└── posts/              # 文章相關頁面
    ├── index.tsx       # 文章列表頁
    └── [id]/          # 動態路由
        ├── index.tsx   # 文章詳情頁 (已存在)
        └── _content/   # 文章內容相關組件 (已存在)
```

## 🔄 目錄間的依賴關係

### **依賴流向**
```
UI Components → Hook → Controller → Context/Factory/Services
```

### **具體依賴關係**
```
pages/
├── 依賴 → hooks/
└── 依賴 → components/

components/
└── 依賴 → hooks/

hooks/
└── 依賴 → controllers/

controllers/
├── 依賴 → contexts/
├── 依賴 → lib/ (Factory)
└── 依賴 → services/

contexts/
└── 依賴 → types/

lib/
└── 依賴 → types/

services/
└── 依賴 → types/
```

### **禁止的依賴關係**
```
❌ components/ → controllers/     (組件不應直接調用 Controller)
❌ components/ → contexts/        (組件不應直接調用 Context)
❌ components/ → services/        (組件不應直接調用 Service)
❌ hooks/ → components/          (Hook 不應依賴組件)
❌ contexts/ → controllers/      (Context 不應依賴 Controller)
❌ services/ → controllers/      (Service 不應依賴 Controller)
```

## 📝 文件命名規範

### **Hook 命名**
- 格式: `use{Feature}.ts` 或 `use{Entity}{Action}.ts`
- 範例: `usePostDetail.ts`, `useCommentSection.ts`, `useTextSelection.ts`

### **Controller 命名**
- 格式: `{Domain}Controller.ts`
- 範例: `PostController.ts`, `InteractionController.ts`

### **Context 命名**
- 格式: `{Domain}Context.tsx`
- 範例: `PostContext.tsx`, `InteractionContext.tsx`

### **Factory 命名**
- 格式: `{Entity}Factory.ts`
- 範例: `PostFactory.ts`, `CommentFactory.ts`

### **Service 命名**
- 格式: `{Entity}Service.ts`
- 範例: `PostService.ts`, `InteractionService.ts`

### **類型命名**
- 格式: `{domain}.ts`
- 範例: `post.ts`, `interaction.ts`, `behavior.ts`

## 🧪 目錄測試組織

### **測試文件組織**
```
src/
├── hooks/
│   ├── usePostDetail.ts
│   └── __tests__/
│       └── usePostDetail.test.ts
├── controllers/
│   ├── PostController.ts
│   └── __tests__/
│       └── PostController.test.ts
├── lib/
│   ├── PostFactory.ts
│   └── __tests__/
│       └── PostFactory.test.ts
└── services/
    ├── PostService.ts
    └── __tests__/
        └── PostService.test.ts
```

### **測試命名規範**
- Hook 測試: `{hookName}.test.ts`
- Controller 測試: `{ControllerName}.test.ts`
- Factory 測試: `{FactoryName}.test.ts`
- Service 測試: `{ServiceName}.test.ts`

## 🚀 開發工作流

### **新增功能的目錄操作順序**

1. **定義類型** → `types/{domain}.ts`
2. **創建 Factory** → `lib/{Entity}Factory.ts`
3. **創建 Service** → `services/{Entity}Service.ts`
4. **創建 Context** → `contexts/{Domain}Context.tsx`
5. **實現 Controller 邏輯** → `controllers/{Domain}Controller.ts`
6. **創建 Hook** → `hooks/use{Feature}.ts`
7. **創建組件** → `components/{Feature}Component.tsx`
8. **整合到頁面** → `pages/{page}.tsx`

### **重構時的目錄遷移**

#### **從 TanStack Query 遷移到 Controller**
```bash
# 1. 移除 hooks/queries/ 目錄
rm -rf src/hooks/queries/

# 2. 重構 Hook，調用 Controller 而不是 TanStack Query
# 編輯 src/hooks/usePostQueries.ts → src/hooks/usePostDetail.ts

# 3. 在 Controller 中實現原本的查詢邏輯
# 編輯 src/controllers/PostController.ts
```

#### **Context 職責簡化**
```bash
# 1. 移除 Context 中的業務邏輯方法
# 編輯 src/contexts/PostActionsContext.tsx

# 2. 將業務邏輯遷移到 Controller
# 編輯 src/controllers/PostController.ts

# 3. Context 只保留純狀態管理
# 編輯 src/contexts/PostContext.tsx
```

## 📋 目錄檢查清單

### **Hook 目錄檢查**
- [ ] 每個 Hook 都有明確的功能職責
- [ ] Hook 只管理 UI 狀態，不包含業務邏輯
- [ ] Hook 通過 Controller 獲取業務數據
- [ ] Hook 提供簡潔的接口給 UI 層

### **Controller 目錄檢查**
- [ ] Controller 承擔所有業務邏輯協調
- [ ] Controller 管理快取和狀態同步
- [ ] Controller 處理錯誤和驗證
- [ ] Controller 通過依賴注入獲取 Context 和 Service

### **Context 目錄檢查**
- [ ] Context 只管理狀態，不包含業務邏輯
- [ ] Context 提供純狀態操作方法
- [ ] Context 接口簡潔明確
- [ ] Context 按領域劃分邊界

### **Factory 目錄檢查**
- [ ] Factory 專注於物件創建
- [ ] Factory 方法是純函數
- [ ] Factory 不維護狀態
- [ ] Factory 可以獨立測試

### **Service 目錄檢查**
- [ ] Service 只處理數據 CRUD
- [ ] Service 不包含業務邏輯
- [ ] Service 可以輕易替換
- [ ] Service 方法是純函數

---

💡 **核心理念**: 清晰的目錄結構反映清晰的架構設計。每個目錄都有單一職責，依賴關係明確，便於開發和維護。 