# 🎯 開發規範與約定

## 📋 關於本文檔

本文檔統一規範開發過程中的代碼標準、命名約定、架構模式和最佳實踐。所有開發者都應遵循這些約定以確保代碼的一致性和可維護性。

---

## 🎨 TypeScript 開發規範

### **基本原則**

#### 類型優先
- **嚴格模式**: 使用 `strict: true` 配置
- **禁用 any**: 永遠不使用 `any` 類型，使用 `unknown` 或具體類型
- **顯式類型**: 所有函數參數和返回值必須有明確類型註解
- **類型優於接口**: 優先使用 `type` 而非 `interface`

```typescript
// ✅ 正確的類型定義
type UserData = {
  id: string
  name: string
  email: string
  metadata: {
    createdAt: string
    updatedAt: string
  }
}

// ✅ 明確的函數簽名
function processUser(userData: UserData): Promise<ProcessedUser> {
  return processUserData(userData)
}

// ❌ 避免
function processUser(userData: any): any {
  return processUserData(userData)
}
```

#### 變量聲明
- **const 優先**: 默認使用 `const`，避免 `let`
- **禁用 var**: 永遠不使用 `var`
- **描述性命名**: 變量名應該清楚描述其用途

```typescript
// ✅ 正確
const userPreferences = await loadUserSettings()
const isUserLoggedIn = checkAuthStatus()

// ❌ 避免
let data = await loadUserSettings()
var flag = checkAuthStatus()
```

#### 禁用語法
- **switch-case**: 使用對象常量替代
- **複雜三元運算**: 使用 if-else 或函數替代

```typescript
// ✅ 使用對象常量替代 switch
const ACTION_HANDLERS = {
  ADD_TASK: (payload: AddTaskPayload) => handleAddTask(payload),
  DELETE_TASK: (payload: DeleteTaskPayload) => handleDeleteTask(payload),
  UPDATE_TASK: (payload: UpdateTaskPayload) => handleUpdateTask(payload)
} as const

function handleAction(type: ActionType, payload: unknown): void {
  const handler = ACTION_HANDLERS[type]
  if (!handler) {
    throw new Error(`Unknown action type: ${type}`)
  }
  handler(payload)
}

// ❌ 避免 switch-case
function handleAction(type: ActionType, payload: unknown): void {
  switch (type) {
    case 'ADD_TASK':
      handleAddTask(payload)
      break
    case 'DELETE_TASK':
      handleDeleteTask(payload)
      break
    // ...
  }
}
```

### **TypeScript 最佳實踐**

#### 泛型使用
```typescript
// ✅ 良好的泛型設計
type ApiResponse<T> = {
  data: T
  status: 'success' | 'error'
  message?: string
}

type Repository<T> = {
  findById(id: string): Promise<T | null>
  save(entity: T): Promise<void>
  delete(id: string): Promise<void>
}

// ✅ 約束泛型
type EventHandler<T extends BaseEvent> = {
  handle(event: T): Promise<void>
  canHandle(event: BaseEvent): event is T
}
```

#### 聯合類型和判別聯合
```typescript
// ✅ 使用判別聯合
type LoadingState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: UserData }
  | { status: 'error'; error: string }

function handleLoadingState(state: LoadingState): string {
  switch (state.status) {
    case 'idle':
      return 'Ready to load'
    case 'loading':
      return 'Loading...'
    case 'success':
      return `Loaded user: ${state.data.name}`
    case 'error':
      return `Error: ${state.error}`
  }
}
```

---

## ⚛️ React 開發規範

### **組件設計原則**

#### 函數組件優先
- **只使用函數組件**: 不使用類組件
- **Hooks 模式**: 使用 React Hooks 管理狀態和副作用
- **組件純化**: 組件應該盡可能純粹，避免副作用

```typescript
// ✅ 良好的函數組件
type PostCardProps = {
  post: Post
  onSelect: (post: Post) => void
  isSelected: boolean
}

function PostCard({ post, onSelect, isSelected }: PostCardProps): JSX.Element {
  const handleClick = useCallback(() => {
    onSelect(post)
  }, [post, onSelect])
  
  return (
    <div 
      className={`post-card ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
    </div>
  )
}

// ✅ 使用 React.memo 優化
export default React.memo(PostCard)
```

#### 命名約定
- **組件名**: PascalCase（大駝峰）
- **Props 類型**: `{ComponentName}Props`
- **Hook 名**: `use{FeatureName}`
- **常量**: UPPER_SNAKE_CASE

```typescript
// ✅ 正確的命名
type UserProfileProps = {
  user: User
  onUpdate: (user: User) => void
}

function UserProfile({ user, onUpdate }: UserProfileProps): JSX.Element {
  // ...
}

function useUserProfile(userId: string) {
  // ...
}

const MAX_RETRY_ATTEMPTS = 3
const API_BASE_URL = 'https://api.example.com'
```

#### Hook 使用規範
```typescript
// ✅ 良好的 Hook 設計
function usePostDetail(postId: string) {
  const controller = usePostController()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const loadPost = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await controller.getPostById(postId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [controller, postId])
  
  useEffect(() => {
    loadPost()
  }, [loadPost])
  
  return {
    post: controller.getCachedPost(postId),
    isLoading,
    error,
    reload: loadPost
  }
}
```

### **性能優化規範**

#### React.memo 使用
```typescript
// ✅ 智能使用 memo
const PostCard = React.memo(function PostCard({ post, onSelect }: PostCardProps) {
  // 組件實現
}, (prevProps, nextProps) => {
  // 自定義比較邏輯（可選）
  return prevProps.post.id === nextProps.post.id && 
         prevProps.isSelected === nextProps.isSelected
})
```

#### useCallback 和 useMemo
```typescript
// ✅ 合理使用 useCallback
function CommentSection({ postId }: { postId: string }) {
  const [newComment, setNewComment] = useState('')
  
  // 穩定的回調引用
  const handleSubmit = useCallback(async () => {
    if (newComment.trim()) {
      await submitComment(postId, newComment)
      setNewComment('')
    }
  }, [postId, newComment])
  
  // 昂貴計算的記憶化
  const processedComments = useMemo(() => {
    return comments.map(comment => ({
      ...comment,
      displayName: formatDisplayName(comment.author)
    }))
  }, [comments])
  
  return (
    <div>
      {processedComments.map(comment => <CommentItem key={comment.id} comment={comment} />)}
      <CommentForm onSubmit={handleSubmit} />
    </div>
  )
}
```

---

## 🏗️ 架構設計約定

### **分層架構原則**

#### 依賴方向
```
UI Components → Hooks → Controllers → Context/Services
```

#### 職責劃分
- **UI Components**: 純渲染，只調用 Hooks
- **Hooks**: UI 狀態管理 + Controller 調用
- **Controllers**: 業務邏輯協調
- **Context**: 純狀態管理
- **Services**: 數據 CRUD 操作
- **Factories**: 對象創建和轉換

#### 禁止的依賴
```typescript
// ❌ 組件不應直接調用 Controller
function BadComponent() {
  const controller = usePostController() // ❌
  // ...
}

// ❌ 組件不應直接調用 Service
function BadComponent() {
  useEffect(() => {
    PostService.getAllPosts() // ❌
  }, [])
}

// ✅ 正確: 通過 Hook 調用
function GoodComponent() {
  const { posts, isLoading } = usePostList() // ✅
  // ...
}
```

### **設計模式約定**

#### Singleton Pattern
```typescript
// ✅ Controller Singleton 實現
class PostController {
  private static instance: PostController | null = null
  
  static getInstance(): PostController {
    if (!this.instance) {
      this.instance = new PostController()
    }
    return this.instance
  }
  
  private constructor() {
    // 私有構造函數
  }
}
```

#### Factory Pattern
```typescript
// ✅ Factory 靜態方法
class PostFactory {
  static createFromMDX(mdxData: MDXData): Post {
    return {
      id: generateId(),
      title: mdxData.frontmatter.title,
      content: mdxData.content,
      metadata: {
        createdAt: new Date().toISOString(),
        wordCount: countWords(mdxData.content)
      }
    }
  }
  
  static addMetadata(post: Post): Post {
    return {
      ...post,
      metadata: {
        ...post.metadata,
        lastViewedAt: new Date().toISOString()
      }
    }
  }
}
```

---

## 📁 文件組織約定

### **命名規範**

#### 文件命名
- **組件文件**: `PascalCase.tsx` (e.g., `PostCard.tsx`)
- **Hook 文件**: `camelCase.ts` (e.g., `usePostDetail.ts`)
- **類型文件**: `camelCase.ts` (e.g., `post.ts`, `user.ts`)
- **常量文件**: `UPPER_SNAKE_CASE.ts` (e.g., `API_CONSTANTS.ts`)

#### 目錄結構
```
src/
├── components/        # UI 組件
│   ├── ui/           # 基礎 UI 組件
│   └── feature/      # 功能組件
├── hooks/            # Custom Hooks
├── controllers/      # 業務邏輯層
├── contexts/         # React Context
├── services/         # 數據服務
├── lib/             # 工具和 Factory
├── types/           # TypeScript 類型定義
└── utils/           # 通用工具函數
```

### **導入/導出約定**

#### 導入順序
```typescript
// 1. React 和第三方庫
import React, { useState, useEffect } from 'react'
import { Router } from 'react-router-dom'

// 2. 內部類型
import type { Post, User } from '@/types'

// 3. 內部 hooks 和 utilities
import { usePostDetail } from '@/hooks'
import { formatDate } from '@/utils'

// 4. 組件
import { PostCard } from '@/components'

// 5. 樣式
import './PostList.css'
```

#### 導出約定
```typescript
// ✅ 命名導出優先
export { PostController }
export { usePostDetail }
export type { Post }

// ✅ 默認導出只用於組件
export default function PostCard({ post }: PostCardProps) {
  // ...
}

// ✅ 統一導出 index.ts
// src/hooks/index.ts
export { usePostDetail } from './usePostDetail'
export { usePostList } from './usePostList'
export { useCommentSection } from './useCommentSection'
```

---

## 🎯 代碼品質約定

### **技術債務管理**

#### 標記約定
- **FIXME**: 必須修復的問題
- **TODO**: 計劃實現的功能
- **HACK**: 臨時解決方案（盡量避免）

```typescript
// ✅ 正確的技術債務標記
function loadUserData(id: string) {
  // FIXME: 添加錯誤處理和重試機制
  // 原因: 網路錯誤會導致應用崩潰
  // 計劃: 下個迭代實現
  return fetch(`/api/users/${id}`)
}

function calculateScore(data: UserData) {
  // TODO: 實現更複雜的評分算法
  // 描述: 目前使用簡單加權，需要機器學習模型
  // 預計: Q2 實現
  return data.points * 0.8
}
```

### **錯誤處理約定**

#### 統一錯誤處理
```typescript
// ✅ 標準錯誤處理模式
async function handleAsyncOperation() {
  try {
    const result = await riskyOperation()
    return { success: true, data: result }
  } catch (error) {
    console.error('Operation failed:', error)
    
    // 記錄到監控系統
    logError('OPERATION_FAILED', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return { success: false, error: 'Operation failed' }
  }
}
```

#### 類型安全的錯誤處理
```typescript
// ✅ Result 類型模式
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string }

async function safeApiCall<T>(url: string): Promise<Result<T>> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }
    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    }
  }
}
```

---

## 🧪 測試約定

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
```

### **測試命名約定**
```typescript
// ✅ 描述性測試名稱
describe('usePostDetail', () => {
  it('should load post data when postId changes', async () => {
    // ...
  })
  
  it('should handle loading state correctly', async () => {
    // ...
  })
  
  it('should recover from network errors gracefully', async () => {
    // ...
  })
})
```

### **Mock 約定**
```typescript
// ✅ 類型安全的 Mock
const mockPostController: jest.Mocked<PostController> = {
  getPostById: jest.fn(),
  getCachedPost: jest.fn(),
  refreshPost: jest.fn()
}

// ✅ 測試數據工廠
function createMockPost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'test-post-1',
    title: 'Test Post',
    content: 'Test content',
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      wordCount: 100
    },
    ...overrides
  }
}
```

---

## 📝 文檔約定

### **代碼文檔**
```typescript
// ✅ JSDoc 註釋
/**
 * 處理用戶文章互動的 Controller
 * 
 * @example
 * ```typescript
 * const controller = PostController.getInstance()
 * const post = await controller.getPostById('post-123')
 * ```
 */
class PostController {
  /**
   * 獲取指定 ID 的文章
   * 
   * @param id - 文章 ID
   * @returns Promise 包含文章數據或 null
   * @throws {Error} 當網路請求失敗時
   */
  async getPostById(id: string): Promise<Post | null> {
    // ...
  }
}
```

### **README 約定**
```markdown
# 組件/功能名稱

## 用途
簡短描述功能用途

## 使用方式
```typescript
// 代碼範例
```

## API
### Props/參數
| 名稱 | 類型 | 必需 | 說明 |
|------|------|------|------|

### 返回值
描述返回值格式

## 注意事項
列出重要的使用注意事項
```

---

## 🔄 版本控制約定

### **Commit 訊息規範**
```
type(scope): description

type:
- feat: 新功能
- fix: 修復問題
- docs: 文檔更新
- style: 代碼格式
- refactor: 重構
- test: 測試
- chore: 構建工具

scope: 影響範圍（可選）
description: 簡短描述
```

### **分支命名**
```
feature/add-user-authentication
fix/resolve-login-error
refactor/simplify-post-controller
chore/update-dependencies
```

---

## 🚀 性能約定

### **Bundle 大小控制**
```typescript
// ✅ 按需導入
import { debounce } from 'lodash/debounce'

// ❌ 避免全量導入
import _ from 'lodash'
```

### **懶加載約定**
```typescript
// ✅ 路由懶加載
const PostDetailPage = lazy(() => import('@/pages/PostDetailPage'))

// ✅ 組件懶加載
const HeavyComponent = lazy(() => import('@/components/HeavyComponent'))
```

---

💡 **核心理念**: 一致的約定減少認知負荷，提高開發效率和代碼質量。所有團隊成員都應該嚴格遵循這些約定。