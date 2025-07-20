# 🏗️ AI Agent 架構設計

> ⚠️ **重要**: 本文檔已更新為 AI Agent 架構。採用簡潔的三層架構為 SuperController 做準備。

## 📋 架構概覽

本專案採用 **簡潔三層架構 + Command Pattern** 設計，專為 AI Agent 動態控制準備。每層職責單一清晰，Context 作為可選的全域狀態存儲。

### 🎯 核心架構

```
Hook Layer (UI 抽象) ↔ Controller Layer (Action Handler) ↔ Services Layer (數據)
                     ↓
               Context (可選的 Global Store)
```

## 🤖 AI Agent 控制流程

```
AI Agent (字串指令)
        │
        ▼
┌──────────────────┐
│ SuperController  │  (Invoker / Mediator)
└──────────────────┘
  ├─ DirectApplyPolicy ─▶ Controller Facade ─▶ xxxController / Service
  │
  └─ Queue ─▶ ToastPolicy ─▶ User Confirm ─▶ Controller Facade ─▶ xxxController / Service
```

### 核心元件說明

- **AI Agent**: 產生字串指令，如 `"ADD_TASK title=\"Buy milk\""`
- **SuperController**: 解析指令 → 建立 Command 物件 → 根據策略執行
- **Controller Facade**: 統一介面，內部調用具體 Controller 或 Service
- **ApplyPolicy**: 執行策略 (DirectApplyPolicy / ToastPolicy)

### 🎯 核心設計模式

| Pattern | 目的 | 適用部位 |
|---------|------|----------|
| **Command Pattern** | 將「動作 + 參數」包成物件，可序列化、排進佇列、支援 undo | Agent 指令 → Command |
| **Facade Pattern** | 提供簡化、統一的 API，屏蔽底層複雜度 | Controller Facade |
| **Mediator Pattern** | 集中協調多元件互動，避免彼此耦合 | SuperController |
| **Strategy Pattern** | 把「如何執行 Command」抽離為可插拔策略 | ApplyPolicy (直接 / Toast) |

### 🔄 資料流向

**現狀流程** (UI 主導):
```
UI → Hook → Controller → Services
```

**未來 AI Agent 流程** (Agent 主導):
```
AI Agent → SuperController → xxxController.executeAction() → Services
```

**最終混合流程** (共存):
```
UI → Hook → Controller.executeAction() ← SuperController ← AI Agent
                ↓
            Services
```

### 🏛️ 簡潔三層架構

```
┌─────────────────────────────────────────────────┐
│                  UI Layer                       │
│    ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│    │  Pages  │ │Components│ │ Layouts │          │
│    └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────┬───────────────────────────┘
                      │ 只調用 Hook
┌─────────────────────▼───────────────────────────┐
│               Hook Layer (UI 抽象)               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │ 本地UI狀態   │ │ Controller  │ │ 事件監聽     │ │
│  │    管理      │ │   調用      │ │   處理      │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────┬───────────────────────────┘
                      │ 調用 executeAction
┌─────────────────────▼───────────────────────────┐
│           Controller Layer (Action Handler)     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │  Action     │ │    事件      │ │ 業務邏輯     │ │
│  │   處理      │ │   發送      │ │   協調      │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────┬───────────────────────────┘
                      │ 調用數據操作
┌─────────────────────▼───────────────────────────┐
│             Services Layer (數據)                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │   數據      │ │    緩存      │ │   持久化     │ │
│  │  獲取      │ │   管理      │ │    操作     │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────┘

              ┌─────────────────────┐
              │  Context (可選)      │
              │                     │
              │  主題、用戶狀態       │
              │  全域通知等          │
              └─────────────────────┘
```

## 🎭 各層詳細職責

### 1. **UI Layer (純渲染層)**

**職責：** 純渲染邏輯，只調用 Hook  
**原則：** 不直接接觸 Controller、Context、Service

```typescript
// ✅ 理想的 UI 組件
function PostDetailPage() {
  const { id } = useParams()
  
  // 只調用 Hook，完全不知道內部實現
  const { post, loading, error, loadPost } = usePostDetail(id)
  const { comments, newComment, setNewComment, submitComment } = useCommentSection(id)
  const { selectedText, handleTextSelection } = useTextSelection()
  
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!post) return <NotFound />
  
  return (
    <div>
      <PostContent 
        post={post}
        onTextSelect={handleTextSelection}
      />
      <CommentSection
        comments={comments}
        newComment={newComment}
        onCommentChange={setNewComment}
        onSubmit={submitComment}
      />
    </div>
  )
}

// ❌ 避免：UI 直接操作其他層
function BadComponent() {
  const controller = PostController.getInstance()  // ❌ 不應該直接調用
  const context = usePostContext()                // ❌ 不應該直接調用  
  const posts = PostService.getAllPosts()         // ❌ 絕對不可以
}
```

### 2. **Hook Layer (UI 抽象)**

**職責：** 管理 UI 本地狀態 + 調用 Controller actions  
**原則：** 為 UI 提供簡潔接口，封裝所有複雜性

```typescript
function usePostDetail(id: string) {
  // Hook 管理本地 UI 狀態
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Controller 實例
  const controller = PostController.getInstance()
  
  // 監聽 Controller 事件更新狀態
  useEffect(() => {
    const handlePostLoaded = (loadedPost: Post) => {
      setPost(loadedPost)
      setLoading(false)
    }
    
    const handlePostError = (errorMsg: string) => {
      setError(errorMsg)
      setLoading(false)
    }
    
    controller.on('postLoaded', handlePostLoaded)
    controller.on('postError', handlePostError)
    
    return () => {
      controller.off('postLoaded', handlePostLoaded)
      controller.off('postError', handlePostError)
    }
  }, [controller])
  
  // 提供 action 方法
  const loadPost = useCallback(() => {
    setLoading(true)
    setError(null)
    controller.executeAction('LOAD_POST', { id })
  }, [controller, id])
  
  return { post, loading, error, loadPost }
}

function useCommentSection(postId: string) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const controller = PostController.getInstance()
  
  useEffect(() => {
    const handleCommentAdded = (comment: Comment) => {
      setComments(prev => [...prev, comment])
      setSubmitting(false)
    }
    
    controller.on('commentAdded', handleCommentAdded)
    return () => controller.off('commentAdded', handleCommentAdded)
  }, [controller])
  
  const submitComment = useCallback(() => {
    if (!newComment.trim()) return
    
    setSubmitting(true)
    controller.executeAction('ADD_COMMENT', { 
      postId, 
      content: newComment 
    })
    setNewComment('')
  }, [controller, postId, newComment])
  
  return {
    comments,
    newComment,
    setNewComment,
    submitComment,
    submitting
  }
}
```

### 3. **Controller Layer (純 Action Handler)**

**職責：** 純 Action 處理 + 事件發送 + 業務邏輯協調  
**原則：** 無狀態，通過事件通知狀態變更

```typescript
class PostController extends AbstractController {
    // Action 映射表 - 放在外部便於維護
    private actionMap = {
        'LOAD_POSTS': this.loadPosts.bind(this),
        'LOAD_POST': this.loadPost.bind(this),
        'SEARCH_POSTS': this.searchPosts.bind(this),
        'ADD_COMMENT': this.addComment.bind(this),
        'ADD_TO_READING_HISTORY': this.addToHistory.bind(this)
    }
    
    /**
     * 統一 Action 處理入口 - 為 SuperController 準備
     */
    async executeAction(actionType: string, payload?: any): Promise<void> {
        const handler = this.actionMap[actionType]
        
        if (!handler) {
            this.emit('actionError', {
                actionType,
                error: `Unknown action: ${actionType}`,
                availableActions: Object.keys(this.actionMap)
            })
            return
        }

        try {
            await handler(payload)
        } catch (error) {
            this.emit('actionError', {
                actionType,
                payload,
                error: error instanceof Error ? error.message : String(error)
            })
        }
    }
    
    /**
     * 獲取支援的 Action 列表 - SuperController 發現機制
     */
    getSupportedActions(): string[] {
        return Object.keys(this.actionMap)
    }
    
    // ===== Action Handlers =====
    
    private async loadPosts(payload?: { forceRefresh?: boolean }) {
        try {
            const posts = await PostService.getAllPosts(payload?.forceRefresh)
            this.emit('postsLoaded', posts)
        } catch (error) {
            this.emit('postsError', error.message)
        }
    }
    
    private async loadPost(payload: { id: string }) {
        try {
            const post = await PostService.getPostById(payload.id)
            if (post) {
                this.emit('postLoaded', post)
                // 業務邏輯：自動添加到閱讀歷史
                PostService.addToReadingHistory(post)
            } else {
                this.emit('postError', 'Post not found')
            }
        } catch (error) {
            this.emit('postError', error.message)
        }
    }
    
    private async searchPosts(payload: { query: string, filters?: SearchFilters }) {
        try {
            const allPosts = await PostService.getAllPosts()
            const results = PostService.searchPosts(payload.query, allPosts, payload.filters)
            this.emit('searchCompleted', results)
        } catch (error) {
            this.emit('searchError', error.message)
        }
    }
    
    private async addComment(payload: { postId: string, content: string }) {
        try {
            // 業務驗證
            if (payload.content.trim().length < 3) {
                throw new Error('Comment too short')
            }
            
            // 調用 Service 保存
            const comment = await PostService.addComment(payload.postId, payload.content)
            this.emit('commentAdded', comment)
        } catch (error) {
            this.emit('commentError', error.message)
        }
    }
    
    private async addToHistory(payload: { post: Post }) {
        try {
            PostService.addToReadingHistory(payload.post)
            this.emit('readingHistoryUpdated', payload.post)
        } catch (error) {
            this.emit('historyError', error.message)
        }
    }
}
```

### 4. **Services Layer (數據 + 緩存 + 持久化)**

**職責：** 所有數據操作、緩存管理、持久化處理  
**原則：** 承擔從 Controller 搬移過來的所有數據邏輯

```typescript
class PostService {
    private static cache = new Map<string, Post>()
    private static allPostsCache: Post[] | null = null
    private static cacheTimeout = 5 * 60 * 1000 // 5分鐘
    private static lastFetched: number | null = null
    
    /**
     * 獲取所有文章 - 包含緩存邏輯
     */
    static async getAllPosts(forceRefresh = false): Promise<Post[]> {
        // 檢查緩存
        if (!forceRefresh && this.allPostsCache && this.isCacheValid()) {
            return this.allPostsCache
        }
        
        try {
            // 從 MarkdownFactory 獲取數據
            const posts = await MarkdownFactory.loadAllPosts()
            
            // 更新緩存
            this.allPostsCache = posts
            this.lastFetched = Date.now()
            
            // 同時更新單個文章緩存
            posts.forEach(post => this.cache.set(post.id, post))
            
            return posts
        } catch (error) {
            console.error('Failed to load all posts:', error)
            throw error
        }
    }
    
    /**
     * 獲取單個文章 - 包含緩存邏輯
     */
    static async getPostById(id: string): Promise<Post | null> {
        // 檢查緩存
        if (this.cache.has(id)) {
            return this.cache.get(id)!
        }
        
        try {
            const post = await MarkdownFactory.loadPostById(id)
            if (post) {
                this.cache.set(id, post)
            }
            return post || null
        } catch (error) {
            console.error(`Failed to load post ${id}:`, error)
            throw error
        }
    }
    
    /**
     * 搜索文章 - 業務邏輯
     */
    static searchPosts(query: string, posts: Post[], filters?: SearchFilters): Post[] {
        let results = posts.filter(post => {
            const matchesQuery = post.title.toLowerCase().includes(query.toLowerCase()) ||
                               post.content?.toLowerCase().includes(query.toLowerCase())
            
            const matchesTag = !filters?.tag || post.tags?.includes(filters.tag)
            const matchesAuthor = !filters?.author || post.author === filters.author
            
            return matchesQuery && matchesTag && matchesAuthor
        })
        
        // 排序邏輯
        if (filters?.sortBy === 'relevance') {
            results = this.sortByRelevance(results, query)
        } else if (filters?.sortBy === 'date') {
            results = results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        }
        
        return results
    }
    
    /**
     * 添加評論 - 持久化操作
     */
    static async addComment(postId: string, content: string): Promise<Comment> {
        const comment = {
            id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            postId,
            content: content.trim(),
            createdAt: new Date().toISOString(),
            type: 'comment' as const
        }
        
        // 保存到 localStorage
        const comments = this.loadComments()
        comments.push(comment)
        this.saveComments(comments)
        
        return comment
    }
    
    /**
     * 閱讀歷史管理 - 持久化操作
     */
    static addToReadingHistory(post: Post): void {
        const history = this.getReadingHistory()
        const existingIndex = history.findIndex(item => item.postId === post.id)
        
        const historyItem = {
            postId: post.id,
            title: post.title,
            readAt: new Date().toISOString(),
            readCount: existingIndex >= 0 ? history[existingIndex].readCount + 1 : 1
        }
        
        if (existingIndex >= 0) {
            history[existingIndex] = historyItem
        } else {
            history.unshift(historyItem)
        }
        
        // 只保留最近 50 條記錄
        const trimmedHistory = history.slice(0, 50)
        localStorage.setItem('reading-history', JSON.stringify(trimmedHistory))
    }
    
    static getReadingHistory(): Array<{
        postId: string
        title: string  
        readAt: string
        readCount: number
    }> {
        try {
            const history = localStorage.getItem('reading-history')
            return history ? JSON.parse(history) : []
        } catch {
            return []
        }
    }
    
    // ===== 私有方法 =====
    
    private static isCacheValid(): boolean {
        return this.lastFetched !== null && 
               Date.now() - this.lastFetched < this.cacheTimeout
    }
    
    private static sortByRelevance(posts: Post[], query: string): Post[] {
        return posts.map(post => ({
            post,
            score: this.calculateRelevanceScore(post, query)
        }))
        .sort((a, b) => b.score - a.score)
        .map(item => item.post)
    }
    
    private static calculateRelevanceScore(post: Post, query: string): number {
        const titleMatch = post.title.toLowerCase().includes(query.toLowerCase()) ? 2 : 0
        const contentMatch = post.content?.toLowerCase().includes(query.toLowerCase()) ? 1 : 0
        return titleMatch + contentMatch
    }
    
    private static loadComments(): Comment[] {
        try {
            const comments = localStorage.getItem('post-comments')
            return comments ? JSON.parse(comments) : []
        } catch {
            return []
        }
    }
    
    private static saveComments(comments: Comment[]): void {
        try {
            localStorage.setItem('post-comments', JSON.stringify(comments))
        } catch (error) {
            console.error('Failed to save comments:', error)
        }
    }
}
```

### 5. **Context Layer (可選的 Global Store)**

**職責：** 只存儲需要跨組件共享的簡單狀態  
**原則：** 不包含業務邏輯，純狀態存儲

```typescript
// 只在真正需要全域狀態時使用
interface GlobalState {
    // 主題設定
    theme: 'light' | 'dark'
    
    // 用戶狀態  
    user: {
        id: string
        name: string
        preferences: UserPreferences
    } | null
    
    // 全域通知
    notifications: Array<{
        id: string
        message: string
        type: 'success' | 'error' | 'info'
        timestamp: number
    }>
}

const GlobalContext = createContext<{
    state: GlobalState
    setState: (updates: Partial<GlobalState>) => void
}>()

// 使用範例：只在需要時使用
function App() {
    const { theme } = useGlobalContext()
    
    return (
        <div className={theme === 'dark' ? 'dark' : 'light'}>
            {/* 不需要在這裡處理文章數據 */}
        </div>
    )
}
```

## 🔄 數據流運作機制

### **簡單數據獲取流程**
```
1. UI 調用 usePostDetail(id)  
2. Hook 監聽 Controller 事件 + 調用 controller.executeAction('LOAD_POST', { id })
3. Controller 調用 PostService.getPostById(id) (包含緩存邏輯)
4. PostService 處理緩存 → 調用 MarkdownFactory.loadPostById(id)
5. Controller 發送 'postLoaded' 事件
6. Hook 接收事件更新本地狀態
7. UI 重新渲染
```

### **複雜業務操作流程**  
```
1. UI 調用 commentSection.submitComment()
2. Hook 調用 controller.executeAction('ADD_COMMENT', { postId, content })
3. Controller 進行業務驗證
4. Controller 調用 PostService.addComment() 處理持久化
5. Controller 發送 'commentAdded' 事件
6. Hook 接收事件更新評論列表
7. UI 重新渲染
```

## 🎯 簡化架構優勢

### **1. 極簡的 UI 開發體驗**
- ✅ UI 只需要學會調用 Hook
- ✅ 完全不需要了解業務邏輯實現
- ✅ 一致的調用模式和接口

### **2. 清晰的職責分離**
- ✅ Hook: UI 狀態 + Controller 調用
- ✅ Controller: 純 Action Handler + 事件發送
- ✅ Services: 數據 + 緩存 + 持久化
- ✅ Context: 可選的全域狀態存儲

### **3. 為 AI Agent 完美準備**
- ✅ Controller.executeAction() 統一介面
- ✅ 事件驅動的狀態更新
- ✅ SuperController 可以直接調用任何 Controller
- ✅ 無狀態的 Controller 易於管理

### **4. 高效的靜態文件處理**
- ✅ 針對靜態 MDX 文件優化
- ✅ Services 層處理所有緩存邏輯
- ✅ 簡單有效的數據流

### **5. 優秀的可維護性**
- ✅ 業務邏輯變更只影響 Controller/Services
- ✅ UI 變更不影響業務邏輯
- ✅ 每層都可以獨立測試

---

💡 **核心理念**: 簡潔三層架構，Context 作為可選全域存儲，為 AI Agent SuperController 做完美準備。 