# 🔄 Controller-Facade 簡化狀態流管理

## 📋 關於本文檔

本文檔專注於 **技術狀態流設計**，說明系統的狀態管理架構和數據流設計。



---

## 📋 狀態流概覽

本專案採用 **Controller-Facade Pattern** 的簡化狀態流設計，將複雜的業務邏輯協調集中在 Controller 層，UI 層只與 Hook 交互，形成清晰的單向數據流。

## 🏗️ 簡化狀態流架構

### **核心數據流**
```
UI Components ← → Hook (狀態 + 調用)
                  ↓
              Controller (業務協調)
                  ↓
          Context/Factory/Services
```

### **狀態管理分層**
```
┌─────────────────────────────────────────────────────────┐
│                  Hook Layer (UI 狀態)                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │  短暫狀態    │ │  UI 交互狀態 │ │ Controller調用│       │
│  │ (loading等)  │ │ (form等)    │ │  (業務邏輯)  │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────┬───────────────────────────────────┘
                      │ 調用 Controller
┌─────────────────────▼───────────────────────────────────┐
│              Controller Layer (業務協調)                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ 業務邏輯協調  │ │ 快取管理     │ │ 錯誤處理     │        │
│  │ 狀態更新協調  │ │ 數據轉換     │ │ 驗證邏輯     │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────┬───────────────────────────────────┘
                      │ 協調底層
┌─────────────────────▼───────────────────────────────────┐
│           Context/Factory/Services Layer                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │   Context   │ │   Factory   │ │   Services  │        │
│  │ (持久狀態)   │ │ (物件創建)   │ │ (數據CRUD)   │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────────────────────┘
```

## 🎭 各層狀態管理職責

### 1. **Hook Layer - UI 狀態管理**

**職責：** 管理與 UI 直接相關的短暫狀態
**特點：** 輕量、快速響應、與 UI 生命週期同步

#### **短暫狀態類型**
```typescript
// 1. 載入狀態
const [isLoading, setIsLoading] = useState(false)
const [isSubmitting, setIsSubmitting] = useState(false)

// 2. 表單狀態
const [formData, setFormData] = useState(initialFormData)
const [validationErrors, setValidationErrors] = useState({})

// 3. UI 交互狀態
const [selectedText, setSelectedText] = useState('')
const [showPopover, setShowPopover] = useState(false)
const [activeTab, setActiveTab] = useState('comments')

// 4. 本地計算狀態
const [filteredItems, setFilteredItems] = useState([])
const [sortOrder, setSortOrder] = useState('asc')
```

#### **Hook 狀態管理模式**
```typescript
function usePostDetail(id: string) {
  const controller = usePostController()
  
  // UI 狀態 - 由 Hook 管理
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // 業務數據 - 從 Controller 獲取
  const post = controller.getCachedPost(id)
  const comments = controller.getCommentsByPostId(id)
  
  // 業務操作 - 調用 Controller
  const refreshPost = useCallback(async () => {
    setRefreshing(true)
    try {
      await controller.refreshPost(id)
    } catch (err) {
      setError(err.message)
    } finally {
      setRefreshing(false)
    }
  }, [controller, id])
  
  // 初始化載入
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
    // 數據狀態
    post,
    comments,
    
    // UI 狀態
    isLoading,
    error,
    refreshing,
    
    // 操作方法
    refreshPost,
    clearError: () => setError(null)
  }
}
```

#### **複雜 UI 狀態管理**
```typescript
function useCommentSection(postId: string) {
  const controller = usePostController()
  
  // 表單狀態
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState('')
  
  // UI 交互狀態
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  
  // 表單驗證
  const validateComment = useCallback((content: string): string => {
    if (content.trim().length < 3) return '評論至少需要 3 個字符'
    if (content.length > 1000) return '評論不能超過 1000 個字符'
    return ''
  }, [])
  
  // 提交評論
  const submitComment = useCallback(async () => {
    const error = validateComment(newComment)
    if (error) {
      setValidationError(error)
      return
    }
    
    setIsSubmitting(true)
    setValidationError('')
    
    try {
      await controller.addCommentWithValidation(postId, newComment)
      setNewComment('')
    } catch (error) {
      setValidationError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }, [controller, postId, newComment, validateComment])
  
  // UI 操作方法
  const toggleCommentExpansion = useCallback((commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }, [])
  
  return {
    // 數據
    comments: controller.getCommentsByPostId(postId),
    
    // 表單狀態
    newComment,
    setNewComment,
    validationError,
    isSubmitting,
    canSubmit: newComment.trim().length >= 3 && !isSubmitting,
    
    // UI 交互狀態
    expandedComments,
    replyingTo,
    editingComment,
    
    // 操作方法
    submitComment,
    toggleCommentExpansion,
    startReply: setReplyingTo,
    startEdit: setEditingComment,
    cancelReply: () => setReplyingTo(null),
    cancelEdit: () => setEditingComment(null)
  }
}
```

### 2. **Controller Layer - 業務邏輯協調**

**職責：** 協調業務邏輯、管理快取、處理錯誤
**特點：** 單例、有狀態、業務邏輯中心

#### **Controller 狀態管理**
```typescript
class PostController {
  // 快取狀態
  private postCache = new Map<string, Post>()
  private allPostsCache: Post[] | null = null
  private commentCache = new Map<string, Comment[]>()
  private highlightCache = new Map<string, Highlight[]>()
  
  // 載入狀態
  private loadingStates = new Map<string, boolean>()
  private errorStates = new Map<string, string>()
  
  constructor(
    private postContext: PostContext,
    private interactionContext: InteractionContext,
    private behaviorContext: BehaviorContext
  ) {}
  
  // 複雜的業務邏輯協調
  async getPostById(id: string): Promise<Post | null> {
    // 1. 檢查快取
    if (this.postCache.has(id)) {
      this.behaviorContext.trackCacheHit('post', id)
      return this.postCache.get(id)!
    }
    
    // 2. 設置載入狀態
    this.setLoading('post', id, true)
    
    try {
      // 3. 從 Service 獲取數據
      const post = await PostService.getPostById(id)
      if (!post) {
        this.setError('post', id, 'Post not found')
        return null
      }
      
      // 4. 使用 Factory 處理數據
      const processedPost = PostFactory.addMetadata(post)
      
      // 5. 更新快取
      this.postCache.set(id, processedPost)
      
      // 6. 更新 Context 狀態
      this.postContext.setCurrentPost(processedPost)
      
      // 7. 追蹤行為
      this.behaviorContext.trackPostView(id)
      
      // 8. 清除錯誤狀態
      this.clearError('post', id)
      
      return processedPost
    } catch (error) {
      this.setError('post', id, error.message)
      this.behaviorContext.trackError('post_fetch_failed', { id, error: error.message })
      throw error
    } finally {
      this.setLoading('post', id, false)
    }
  }
  
  // 快取管理
  getCachedPost(id: string): Post | null {
    return this.postCache.get(id) || this.postContext.getCurrentPost()
  }
  
  // 狀態查詢
  isLoading(type: string, id?: string): boolean {
    const key = id ? `${type}:${id}` : type
    return this.loadingStates.get(key) || false
  }
  
  getError(type: string, id?: string): string | null {
    const key = id ? `${type}:${id}` : type
    return this.errorStates.get(key) || null
  }
  
  // 私有狀態管理方法
  private setLoading(type: string, id: string, loading: boolean): void {
    const key = `${type}:${id}`
    if (loading) {
      this.loadingStates.set(key, true)
    } else {
      this.loadingStates.delete(key)
    }
  }
  
  private setError(type: string, id: string, error: string): void {
    const key = `${type}:${id}`
    this.errorStates.set(key, error)
  }
  
  private clearError(type: string, id: string): void {
    const key = `${type}:${id}`
    this.errorStates.delete(key)
  }
  
  // 複雜的業務邏輯組合
  async addCommentWithValidation(postId: string, content: string): Promise<Comment> {
    try {
      // 1. 業務驗證
      if (content.trim().length < 3) {
        throw new Error('評論內容太短')
      }
      
      if (content.length > 1000) {
        throw new Error('評論內容太長')
      }
      
      // 2. 檢查文章是否存在
      const post = await this.getPostById(postId)
      if (!post) {
        throw new Error('文章不存在')
      }
      
      // 3. 使用 Factory 創建 Comment
      const comment = CommentFactory.create(postId, content)
      
      // 4. 保存到 Service
      await InteractionService.saveComment(comment)
      
      // 5. 更新多個 Context 狀態
      this.interactionContext.addComment(comment)
      this.postContext.incrementCommentCount(postId)
      
      // 6. 更新快取
      const existingComments = this.commentCache.get(postId) || []
      this.commentCache.set(postId, [...existingComments, comment])
      
      // 7. 追蹤用戶行為
      this.behaviorContext.trackAction('comment_added', {
        postId,
        commentLength: content.length,
        timestamp: Date.now()
      })
      
      return comment
    } catch (error) {
      this.behaviorContext.trackError('comment_add_failed', {
        postId,
        error: error.message
      })
      throw error
    }
  }
  
  // 快取失效管理
  invalidatePostCache(id?: string): void {
    if (id) {
      this.postCache.delete(id)
      this.commentCache.delete(id)
      this.highlightCache.delete(id)
    } else {
      this.postCache.clear()
      this.commentCache.clear()
      this.highlightCache.clear()
      this.allPostsCache = null
    }
  }
  
  // 批量操作
  async refreshAllPosts(): Promise<void> {
    this.setLoading('allPosts', '', true)
    
    try {
      const posts = await PostService.getAllPosts()
      const processedPosts = await Promise.all(
        posts.map(post => PostFactory.addMetadata(post))
      )
      
      // 更新快取
      this.allPostsCache = processedPosts
      processedPosts.forEach(post => {
        this.postCache.set(post.id, post)
      })
      
      // 更新 Context
      this.postContext.setPosts(processedPosts)
      
      this.behaviorContext.trackAction('all_posts_refreshed', {
        count: processedPosts.length
      })
    } catch (error) {
      this.setError('allPosts', '', error.message)
      throw error
    } finally {
      this.setLoading('allPosts', '', false)
    }
  }
}
```

### 3. **Context Layer - 持久狀態管理**

**職責：** 管理全局持久狀態，不包含業務邏輯
**特點：** 純狀態管理、簡單操作、可預測

#### **Post Context - 文章狀態管理**
```typescript
interface PostState {
  posts: Post[]
  currentPost: Post | null
  searchHistory: string[]
  favorites: string[]
  readingProgress: Record<string, number>
  metadata: {
    totalPosts: number
    lastUpdated: string
    version: number
  }
}

interface PostContextType extends PostState {
  // 基本狀態操作
  setPosts: (posts: Post[]) => void
  setCurrentPost: (post: Post | null) => void
  addToSearchHistory: (query: string) => void
  toggleFavorite: (postId: string) => void
  updateReadingProgress: (postId: string, progress: number) => void
  
  // 簡單狀態查詢
  getCurrentPost: () => Post | null
  getPostById: (id: string) => Post | undefined
  getFavoritePosts: () => Post[]
  getSearchHistory: () => string[]
  getReadingProgress: (postId: string) => number
  
  // 計數操作
  incrementCommentCount: (postId: string) => void
  incrementViewCount: (postId: string) => void
}

function PostProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(postReducer, initialPostState)
  
  const contextValue = useMemo(() => ({
    ...state,
    
    // 基本操作
    setPosts: (posts: Post[]) => 
      dispatch({ type: 'SET_POSTS', payload: posts }),
    
    setCurrentPost: (post: Post | null) => 
      dispatch({ type: 'SET_CURRENT_POST', payload: post }),
    
    addToSearchHistory: (query: string) => 
      dispatch({ type: 'ADD_SEARCH_HISTORY', payload: query }),
    
    toggleFavorite: (postId: string) => 
      dispatch({ type: 'TOGGLE_FAVORITE', payload: postId }),
    
    updateReadingProgress: (postId: string, progress: number) => 
      dispatch({ type: 'UPDATE_READING_PROGRESS', payload: { postId, progress } }),
    
    // 查詢方法
    getCurrentPost: () => state.currentPost,
    
    getPostById: (id: string) => 
      state.posts.find(post => post.id === id),
    
    getFavoritePosts: () => 
      state.posts.filter(post => state.favorites.includes(post.id)),
    
    getSearchHistory: () => state.searchHistory,
    
    getReadingProgress: (postId: string) => 
      state.readingProgress[postId] || 0,
    
    // 計數操作
    incrementCommentCount: (postId: string) => 
      dispatch({ type: 'INCREMENT_COMMENT_COUNT', payload: postId }),
    
    incrementViewCount: (postId: string) => 
      dispatch({ type: 'INCREMENT_VIEW_COUNT', payload: postId })
    
  }), [state])
  
  return (
    <PostContext.Provider value={contextValue}>
      {children}
    </PostContext.Provider>
  )
}
```

#### **Interaction Context - 互動狀態管理**
```typescript
interface InteractionState {
  comments: Record<string, Comment[]>
  highlights: Record<string, Highlight[]>
  selections: Record<string, TextSelection[]>
  activeSelection: TextSelection | null
  popoverState: {
    visible: boolean
    position: Position | null
    type: 'comment' | 'highlight' | null
  }
}

interface InteractionContextType extends InteractionState {
  // 評論管理
  addComment: (comment: Comment) => void
  updateComment: (commentId: string, updates: Partial<Comment>) => void
  deleteComment: (commentId: string) => void
  getCommentsByPostId: (postId: string) => Comment[]
  
  // 高亮管理
  addHighlight: (highlight: Highlight) => void
  updateHighlight: (highlightId: string, updates: Partial<Highlight>) => void
  deleteHighlight: (highlightId: string) => void
  getHighlightsByPostId: (postId: string) => Highlight[]
  
  // 文字選擇管理
  setActiveSelection: (selection: TextSelection | null) => void
  addSelection: (selection: TextSelection) => void
  clearSelections: (postId: string) => void
  
  // Popover 管理
  showPopover: (position: Position, type: 'comment' | 'highlight') => void
  hidePopover: () => void
  updatePopoverPosition: (position: Position) => void
}

function InteractionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(interactionReducer, initialInteractionState)
  
  const contextValue = useMemo(() => ({
    ...state,
    
    // 評論操作
    addComment: (comment: Comment) => 
      dispatch({ type: 'ADD_COMMENT', payload: comment }),
    
    updateComment: (commentId: string, updates: Partial<Comment>) => 
      dispatch({ type: 'UPDATE_COMMENT', payload: { commentId, updates } }),
    
    deleteComment: (commentId: string) => 
      dispatch({ type: 'DELETE_COMMENT', payload: commentId }),
    
    getCommentsByPostId: (postId: string) => 
      state.comments[postId] || [],
    
    // 高亮操作
    addHighlight: (highlight: Highlight) => 
      dispatch({ type: 'ADD_HIGHLIGHT', payload: highlight }),
    
    updateHighlight: (highlightId: string, updates: Partial<Highlight>) => 
      dispatch({ type: 'UPDATE_HIGHLIGHT', payload: { highlightId, updates } }),
    
    deleteHighlight: (highlightId: string) => 
      dispatch({ type: 'DELETE_HIGHLIGHT', payload: highlightId }),
    
    getHighlightsByPostId: (postId: string) => 
      state.highlights[postId] || [],
    
    // 選擇操作
    setActiveSelection: (selection: TextSelection | null) => 
      dispatch({ type: 'SET_ACTIVE_SELECTION', payload: selection }),
    
    addSelection: (selection: TextSelection) => 
      dispatch({ type: 'ADD_SELECTION', payload: selection }),
    
    clearSelections: (postId: string) => 
      dispatch({ type: 'CLEAR_SELECTIONS', payload: postId }),
    
    // Popover 操作
    showPopover: (position: Position, type: 'comment' | 'highlight') => 
      dispatch({ type: 'SHOW_POPOVER', payload: { position, type } }),
    
    hidePopover: () => 
      dispatch({ type: 'HIDE_POPOVER' }),
    
    updatePopoverPosition: (position: Position) => 
      dispatch({ type: 'UPDATE_POPOVER_POSITION', payload: position })
    
  }), [state])
  
  return (
    <InteractionContext.Provider value={contextValue}>
      {children}
    </InteractionContext.Provider>
  )
}
```

## 🔄 完整數據流範例

### **文章詳情頁面數據流**

#### **1. 初始載入流程**
```
1. UI 調用: usePostDetail('post-123')
   ↓
2. Hook 調用: controller.getPostById('post-123')
   ↓
3. Controller 檢查: postCache.has('post-123') → false
   ↓
4. Controller 設置: setLoading('post', 'post-123', true)
   ↓
5. Controller 調用: PostService.getPostById('post-123')
   ↓
6. Service 調用: PostService.loadPostById('post-123')
   ↓
7. 數據返回: MDX 文件解析結果
   ↓
8. Controller 處理: PostFactory.addMetadata(post)
   ↓
9. Controller 更新: 
   - postCache.set('post-123', processedPost)
   - postContext.setCurrentPost(processedPost)
   - behaviorContext.trackPostView('post-123')
   ↓
10. Controller 清理: setLoading('post', 'post-123', false)
    ↓
11. Hook 返回: { post: processedPost, isLoading: false, error: null }
    ↓
12. UI 重新渲染: 顯示文章內容
```

#### **2. 添加評論流程**
```
1. UI 觸發: commentSection.submitComment()
   ↓
2. Hook 設置: setIsSubmitting(true)
   ↓
3. Hook 調用: controller.addCommentWithValidation(postId, content)
   ↓
4. Controller 驗證: validateComment(content)
   ↓
5. Controller 檢查: getPostById(postId) → 確保文章存在
   ↓
6. Controller 創建: CommentFactory.create(postId, content)
   ↓
7. Controller 保存: InteractionService.saveComment(comment)
   ↓
8. Controller 更新狀態:
   - interactionContext.addComment(comment)
   - postContext.incrementCommentCount(postId)
   - commentCache.set(postId, [...existing, comment])
   ↓
9. Controller 追蹤: behaviorContext.trackAction('comment_added')
   ↓
10. Hook 清理: 
    - setNewComment('')
    - setIsSubmitting(false)
    ↓
11. UI 更新: 顯示新評論，清空表單
```

#### **3. 文字選擇和高亮流程**
```
1. UI 觸發: textSelection.handleSelection()
   ↓
2. Hook 獲取: window.getSelection() DOM API
   ↓
3. Hook 處理: 
   - 計算選擇位置
   - setSelectedText(text)
   - setSelectionPosition(position)
   ↓
4. Hook 調用: controller.handleTextSelection(text, position)
   ↓
5. Controller 更新: 
   - interactionContext.setActiveSelection(selection)
   - behaviorContext.trackTextSelection(text.length)
   ↓
6. Controller 觸發: interactionContext.showPopover(position, 'highlight')
   ↓
7. UI 響應: 顯示高亮/評論選項 Popover
   ↓
8. 用戶選擇: 創建高亮
   ↓
9. Hook 調用: controller.createHighlight(postId, selectedText, position)
   ↓
10. Controller 處理:
    - HighlightFactory.create()
    - InteractionService.saveHighlight()
    - interactionContext.addHighlight()
    - 清理選擇狀態
    ↓
11. UI 更新: 顯示高亮效果，隱藏 Popover
```

## 🎯 狀態管理最佳實踐

### **1. Hook 狀態管理原則**
- **短暫性**: 只管理與 UI 生命週期相關的狀態
- **本地性**: 狀態只在當前組件樹中有意義
- **響應性**: 快速響應用戶交互
- **簡單性**: 避免複雜的狀態邏輯

### **2. Controller 狀態管理原則**
- **業務性**: 管理業務邏輯相關的狀態
- **協調性**: 協調多個 Context 和 Service
- **快取性**: 實現智能快取策略
- **一致性**: 確保狀態的一致性

### **3. Context 狀態管理原則**
- **持久性**: 管理需要跨組件共享的狀態
- **純粹性**: 不包含業務邏輯，只管理狀態
- **可預測性**: 狀態變更可預測且可追蹤
- **最小性**: 保持最小的狀態表面積

### **4. 狀態同步策略**
```typescript
// Controller 中的狀態同步
class PostController {
  // 確保快取和 Context 狀態同步
  private syncState(post: Post): void {
    // 1. 更新快取
    this.postCache.set(post.id, post)
    
    // 2. 更新 Context
    this.postContext.setCurrentPost(post)
    
    // 3. 更新相關快取
    if (this.allPostsCache) {
      const index = this.allPostsCache.findIndex(p => p.id === post.id)
      if (index >= 0) {
        this.allPostsCache[index] = post
      }
    }
  }
  
  // 批量狀態更新
  private batchUpdateState(updates: StateUpdate[]): void {
    // 批量處理狀態更新，減少重新渲染
    updates.forEach(update => {
      switch (update.type) {
        case 'post':
          this.syncState(update.data)
          break
        case 'comment':
          this.interactionContext.addComment(update.data)
          break
        // ... 其他類型
      }
    })
  }
}
```

## 🧪 狀態管理測試策略

### **Hook 狀態測試**
```typescript
describe('usePostDetail', () => {
  it('should manage loading state correctly', async () => {
    const mockController = {
      getPostById: jest.fn().mockResolvedValue(mockPost),
      getCachedPost: jest.fn().mockReturnValue(null)
    }
    
    const { result } = renderHook(() => usePostDetail('post-1'), {
      wrapper: createMockWrapper(mockController)
    })
    
    // 初始狀態
    expect(result.current.isLoading).toBe(true)
    expect(result.current.post).toBe(null)
    
    // 載入完成後
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.post).toEqual(mockPost)
    })
  })
})
```

### **Controller 狀態測試**
```typescript
describe('PostController', () => {
  it('should manage cache state correctly', async () => {
    const controller = new PostController(mockContexts)
    
    // 第一次載入
    const post1 = await controller.getPostById('post-1')
    expect(post1).toBeDefined()
    
    // 檢查快取
    const cachedPost = controller.getCachedPost('post-1')
    expect(cachedPost).toEqual(post1)
    
    // 第二次載入應該使用快取
    const post2 = await controller.getPostById('post-1')
    expect(post2).toBe(post1) // 同一個物件引用
  })
})
```

### **Context 狀態測試**
```typescript
describe('PostContext', () => {
  it('should update state correctly', () => {
    const { result } = renderHook(() => usePostContext(), {
      wrapper: PostProvider
    })
    
    act(() => {
      result.current.setPosts([mockPost])
    })
    
    expect(result.current.posts).toHaveLength(1)
    expect(result.current.getPostById('post-1')).toEqual(mockPost)
  })
})
```

---

💡 **核心理念**: Hook 管理 UI 狀態，Controller 協調業務邏輯和快取，Context 管理持久狀態。三層協作形成清晰、可維護的狀態管理體系。 