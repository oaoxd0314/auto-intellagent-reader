# 🏗️ Controller-Facade 簡化架構設計

## 📋 架構概覽

本專案採用 **Controller-Facade Pattern** 的簡化架構，移除不必要的複雜性，專注於靜態文件的高效處理。UI 層只與 Hook 交互，Controller 作為真正的 Facade 協調所有業務邏輯。

### 🎯 核心設計哲學

#### **「UI 只與 Hook 交互」**
- UI 組件完全不知道 Controller、Context、Service 的存在
- Hook 作為 UI 和業務邏輯之間的完美抽象層
- 所有複雜性都被封裝在 Hook 內部

#### **「Controller 是真正的髒地方」**
- Controller 承擔所有業務邏輯協調
- Controller 是真正的 Facade Pattern 實現
- 所有複雜的業務組合邏輯都在 Controller 中處理

#### **「每層職責單一且明確」**
- Hook: UI 狀態管理 + Controller 調用
- Controller: 業務邏輯協調 (Facade)
- Context: 純狀態管理
- Factory: 物件創建和轉換
- Services: 純數據 CRUD

### 🏛️ 簡化架構分層

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │   Pages     │ │ Components  │ │   Layouts   │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────┬───────────────────────────────────┘
                      │ 只調用 Hook
┌─────────────────────▼───────────────────────────────────┐
│                  Hook Layer                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ UI 狀態管理  │ │ DOM 操作封裝 │ │ Controller調用│       │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────┬───────────────────────────────────┘
                      │ 調用 Controller
┌─────────────────────▼───────────────────────────────────┐
│               Controller Layer (Facade)                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ 業務邏輯協調  │ │ 狀態管理協調 │ │ 錯誤處理協調 │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────┬───────────────────────────────────┘
                      │ 協調各層
┌─────────────────────▼───────────────────────────────────┐
│            Context/Factory/Services Layer               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │   Context   │ │   Factory   │ │   Services  │        │
│  │  (狀態管理)  │ │  (物件創建)  │ │ (數據CRUD)  │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────────────────────┘
```

## 🎭 各層詳細職責

### 1. **UI Layer (純渲染層)**

**職責：** 純渲染邏輯，只調用 Hook
**原則：** 不直接接觸 Controller、Context、Service

```typescript
// ✅ 理想的 UI 組件
function PostDetailPage() {
  const { id } = useParams()
  
  // 只調用 Hook，不知道內部實現
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
        newComment={commentSection.newComment}
        onCommentChange={commentSection.setNewComment}
        onSubmit={commentSection.submitComment}
        isSubmitting={commentSection.isSubmitting}
      />
    </div>
  )
}

// ❌ 避免：UI 直接操作多層
function BadComponent() {
  const controller = usePostController()        // ❌ 不應該直接調用
  const context = usePostContext()             // ❌ 不應該直接調用
  const service = PostService.getAllPosts()   // ❌ 絕對不可以
}
```

### 2. **Hook Layer (抽象接口層)**

**職責：** UI 狀態管理 + Controller 調用的完美抽象層
**原則：** 封裝所有複雜性，為 UI 提供簡潔接口

#### **數據獲取 Hook**
```typescript
function usePostDetail(id: string) {
  const controller = usePostController()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    controller.getPostById(id)
      .then(() => setIsLoading(false))
      .catch(err => {
        setError(err.message)
        setIsLoading(false)
      })
  }, [id, controller])
  
  return {
    post: controller.getCachedPost(id),
    isLoading,
    error,
    // 提供操作方法
    refreshPost: () => controller.refreshPost(id),
    markAsRead: () => controller.markPostAsRead(id)
  }
}
```

#### **功能操作 Hook**
```typescript
function useCommentSection(postId: string) {
  const controller = usePostController()
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const submitComment = useCallback(async () => {
    if (!newComment.trim()) return
    
    setIsSubmitting(true)
    try {
      await controller.addCommentWithValidation(postId, newComment)
      setNewComment('')
    } catch (error) {
      console.error('Failed to submit comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [controller, postId, newComment])
  
  return {
    comments: controller.getCommentsByPostId(postId),
    newComment,
    setNewComment,
    submitComment,
    isSubmitting,
    canSubmit: newComment.trim().length >= 3
  }
}
```

#### **工具操作 Hook**
```typescript
function useTextSelection() {
  const controller = useInteractionController()
  const [selectedText, setSelectedText] = useState('')
  const [selectionPosition, setSelectionPosition] = useState<Position | null>(null)
  
  const handleSelection = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setSelectedText('')
      setSelectionPosition(null)
      return
    }
    
    const text = selection.toString().trim()
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    
    setSelectedText(text)
    setSelectionPosition({ x: rect.left, y: rect.top })
    
    // 通知 Controller
    controller.handleTextSelection(text, { x: rect.left, y: rect.top })
  }, [controller])
  
  return {
    selectedText,
    selectionPosition,
    handleSelection,
    clearSelection: () => {
      setSelectedText('')
      setSelectionPosition(null)
      controller.clearTextSelection()
    }
  }
}
```

### 3. **Controller Layer (真正的 Facade)**

**職責：** 業務邏輯協調、狀態管理協調、錯誤處理
**原則：** 這裡是「髒」的地方，承擔所有複雜的業務邏輯組合

#### **Post Controller - 文章業務邏輯**
```typescript
class PostController {
  private postCache = new Map<string, Post>()
  private allPostsCache: Post[] | null = null
  private commentCache = new Map<string, Comment[]>()
  
  constructor(
    private postContext: PostContext,
    private behaviorContext: BehaviorContext,
    private interactionContext: InteractionContext
  ) {}
  
  // 複雜的數據獲取和快取邏輯
  async getPostById(id: string): Promise<Post | null> {
    // 1. 檢查快取
    if (this.postCache.has(id)) {
      this.behaviorContext.trackCacheHit('post', id)
      return this.postCache.get(id)!
    }
    
    try {
      // 2. 從 Service 獲取
      const post = await PostService.getPostById(id)
      if (!post) return null
      
      // 3. 使用 Factory 處理
      const processedPost = PostFactory.addMetadata(post)
      
      // 4. 更新快取和狀態
      this.postCache.set(id, processedPost)
      this.postContext.setCurrentPost(processedPost)
      
      // 5. 追蹤行為
      this.behaviorContext.trackPostView(id)
      
      return processedPost
    } catch (error) {
      this.behaviorContext.trackError('post_fetch_failed', { id, error: error.message })
      throw error
    }
  }
  
  getCachedPost(id: string): Post | null {
    return this.postCache.get(id) || this.postContext.getCurrentPost()
  }
  
  // 複雜的業務邏輯組合
  async addCommentWithValidation(postId: string, content: string): Promise<Comment> {
    // 1. 業務驗證
    const validation = CommentValidator.validate(content)
    if (!validation.valid) {
      throw new Error(validation.error)
    }
    
    // 2. 檢查文章是否存在
    const post = await this.getPostById(postId)
    if (!post) {
      throw new Error('Post not found')
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
  }
  
  getCommentsByPostId(postId: string): Comment[] {
    return this.commentCache.get(postId) || this.interactionContext.getCommentsByPostId(postId)
  }
  
  // 複雜的搜索邏輯
  async searchWithAnalytics(query: string, filters: SearchFilters = {}): Promise<Post[]> {
    // 1. 獲取所有文章
    const allPosts = await this.getAllPosts()
    
    // 2. 複雜的搜索算法
    let results = allPosts.filter(post => {
      const matchesQuery = post.title.toLowerCase().includes(query.toLowerCase()) ||
                          post.content.toLowerCase().includes(query.toLowerCase())
      
      const matchesTag = !filters.tag || post.tags?.includes(filters.tag)
      const matchesAuthor = !filters.author || post.author === filters.author
      
      return matchesQuery && matchesTag && matchesAuthor
    })
    
    // 3. 排序邏輯
    if (filters.sortBy === 'relevance') {
      results = this.sortByRelevance(results, query)
    } else if (filters.sortBy === 'date') {
      results = results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }
    
    // 4. 追蹤搜索行為
    this.behaviorContext.trackSearch(query, results.length, filters)
    
    // 5. 更新搜索歷史
    this.postContext.addToSearchHistory(query)
    
    return results
  }
  
  private sortByRelevance(posts: Post[], query: string): Post[] {
    return posts.map(post => ({
      post,
      score: this.calculateRelevanceScore(post, query)
    }))
    .sort((a, b) => b.score - a.score)
    .map(item => item.post)
  }
  
  private calculateRelevanceScore(post: Post, query: string): number {
    const titleMatch = post.title.toLowerCase().includes(query.toLowerCase()) ? 2 : 0
    const contentMatch = post.content.toLowerCase().includes(query.toLowerCase()) ? 1 : 0
    return titleMatch + contentMatch
  }
}
```

#### **Interaction Controller - 互動業務邏輯**
```typescript
class InteractionController {
  constructor(
    private interactionContext: InteractionContext,
    private behaviorContext: BehaviorContext
  ) {}
  
  handleTextSelection(text: string, position: Position): void {
    // 1. 驗證選擇的文字
    if (text.length < 2) return
    
    // 2. 更新 Context 狀態
    this.interactionContext.setSelectedText(text, position)
    
    // 3. 追蹤行為
    this.behaviorContext.trackTextSelection(text.length, position)
    
    // 4. 觸發相關 UI 更新
    this.interactionContext.showSelectionPopover(position)
  }
  
  clearTextSelection(): void {
    this.interactionContext.clearSelectedText()
    this.interactionContext.hideSelectionPopover()
  }
  
  async createHighlight(postId: string, selectedText: string, position: Position): Promise<Highlight> {
    // 1. 創建 Highlight 物件
    const highlight = HighlightFactory.create(postId, selectedText, position)
    
    // 2. 保存到 Service
    await InteractionService.saveHighlight(highlight)
    
    // 3. 更新 Context
    this.interactionContext.addHighlight(highlight)
    
    // 4. 清理選擇狀態
    this.clearTextSelection()
    
    // 5. 追蹤行為
    this.behaviorContext.trackAction('highlight_created', {
      postId,
      textLength: selectedText.length
    })
    
    return highlight
  }
}
```

### 4. **Context Layer (純狀態管理)**

**職責：** 純狀態管理，不包含業務邏輯
**原則：** 只管理狀態，不處理複雜的業務邏輯

```typescript
// PostContext - 只管理文章相關狀態
interface PostContextType {
  // 狀態
  posts: Post[]
  currentPost: Post | null
  searchHistory: string[]
  isLoading: boolean
  
  // 純狀態操作
  setPosts: (posts: Post[]) => void
  setCurrentPost: (post: Post) => void
  addToSearchHistory: (query: string) => void
  incrementCommentCount: (postId: string) => void
  
  // 簡單的狀態查詢
  getCurrentPost: () => Post | null
  getSearchHistory: () => string[]
}

// InteractionContext - 只管理互動狀態
interface InteractionContextType {
  // 狀態
  selectedText: string
  selectionPosition: Position | null
  showPopover: boolean
  comments: Record<string, Comment[]>
  highlights: Record<string, Highlight[]>
  
  // 純狀態操作
  setSelectedText: (text: string, position: Position) => void
  clearSelectedText: () => void
  showSelectionPopover: (position: Position) => void
  hideSelectionPopover: () => void
  addComment: (comment: Comment) => void
  addHighlight: (highlight: Highlight) => void
  
  // 簡單的狀態查詢
  getCommentsByPostId: (postId: string) => Comment[]
  getHighlightsByPostId: (postId: string) => Highlight[]
}
```

### 5. **Factory Layer (物件創建)**

**職責：** 專注於物件創建和數據轉換
**原則：** 單一職責，只處理物件創建邏輯

```typescript
class PostFactory {
  // MDX -> Post 的複雜轉換
  static async createFromMDX(mdxModule: any, id: string): Promise<Post> {
    const { frontmatter, default: Component } = mdxModule
    
    return {
      id,
      title: frontmatter.title,
      date: frontmatter.date,
      author: frontmatter.author,
      tags: frontmatter.tags || [],
      content: Component,
      slug: this.generateSlug(frontmatter.title),
      readingTime: this.calculateReadingTime(frontmatter.content),
      excerpt: this.generateExcerpt(frontmatter.content),
      metadata: {
        wordCount: this.countWords(frontmatter.content),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
  
  private static calculateReadingTime(content: string): number {
    const wordsPerMinute = 200
    const wordCount = this.countWords(content)
    return Math.ceil(wordCount / wordsPerMinute)
  }
  
  private static countWords(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length
  }
  
  private static generateExcerpt(content: string, maxLength: number = 150): string {
    const plainText = content.replace(/<[^>]*>/g, '')
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText
  }
}

class CommentFactory {
  static create(postId: string, content: string, userId?: string): Comment {
    return {
      id: this.generateId(),
      postId,
      content: this.sanitizeContent(content),
      userId: userId || 'anonymous',
      type: 'comment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        wordCount: this.countWords(content),
        isEdited: false
      }
    }
  }
  
  private static generateId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private static sanitizeContent(content: string): string {
    // 基本的內容清理
    return content.trim().replace(/<script[^>]*>.*?<\/script>/gi, '')
  }
  
  private static countWords(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length
  }
}

class HighlightFactory {
  static create(postId: string, selectedText: string, position: Position): Highlight {
    return {
      id: this.generateId(),
      postId,
      selectedText,
      position,
      type: 'highlight',
      color: this.getRandomHighlightColor(),
      createdAt: new Date().toISOString(),
      metadata: {
        textLength: selectedText.length,
        pageX: position.x,
        pageY: position.y
      }
    }
  }
  
  private static generateId(): string {
    return `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private static getRandomHighlightColor(): string {
    const colors = ['yellow', 'green', 'blue', 'pink', 'orange']
    return colors[Math.floor(Math.random() * colors.length)]
  }
}
```

### 6. **Services Layer (純數據 CRUD)**

**職責：** 純數據操作，可直接替換成 API
**原則：** 不包含業務邏輯，專注於數據存取

```typescript
class PostService {
  // 純數據操作，可直接替換成 API 調用
  static async getAllPosts(): Promise<Post[]> {
    return PostDataSource.loadAllPosts()
  }
  
  static async getPostById(id: string): Promise<Post | undefined> {
    return PostDataSource.loadPostById(id)
  }
  
  static async savePost(post: Post): Promise<void> {
    return PostDataSource.save(post)
  }
  
  static async deletePost(id: string): Promise<void> {
    return PostDataSource.delete(id)
  }
  
  static getAvailablePostIds(): string[] {
    return PostDataSource.getAvailableIds()
  }
}

class InteractionService {
  static async saveComment(comment: Comment): Promise<void> {
    return InteractionDataSource.saveComment(comment)
  }
  
  static async getCommentsByPostId(postId: string): Promise<Comment[]> {
    return InteractionDataSource.getCommentsByPostId(postId)
  }
  
  static async saveHighlight(highlight: Highlight): Promise<void> {
    return InteractionDataSource.saveHighlight(highlight)
  }
  
  static async getHighlightsByPostId(postId: string): Promise<Highlight[]> {
    return InteractionDataSource.getHighlightsByPostId(postId)
  }
  
  static async deleteInteraction(id: string): Promise<void> {
    return InteractionDataSource.delete(id)
  }
}
```

## 🔄 數據流運作機制

### **簡單數據獲取流程**
```
1. UI 調用 usePostDetail(id)
2. Hook 調用 Controller.getPostById(id)
3. Controller 檢查快取 → 調用 PostService.getPostById(id)
4. PostService 調用 PostDataSource.loadPostById(id)
5. 數據通過 PostFactory.addMetadata() 處理
6. Controller 更新快取和 Context 狀態
7. Hook 返回數據給 UI
```

### **複雜業務操作流程**
```
1. UI 調用 commentSection.submitComment()
2. Hook 調用 Controller.addCommentWithValidation()
3. Controller 協調：
   a. 驗證業務規則
   b. 使用 CommentFactory 創建物件
   c. 調用 InteractionService 保存數據
   d. 更新多個 Context 狀態
   e. 追蹤用戶行為
   f. 更新快取
4. Hook 更新 UI 狀態
5. UI 重新渲染
```

## 🎯 簡化架構優勢

### **1. 極簡的 UI 開發體驗**
- ✅ UI 只需要學會調用 Hook
- ✅ 完全不需要了解業務邏輯實現
- ✅ 一致的調用模式和接口

### **2. 強大的業務邏輯控制**
- ✅ Controller 完全控制業務流程
- ✅ 所有複雜邏輯集中在一個地方
- ✅ 易於測試和維護

### **3. 清晰的職責分離**
- ✅ 每層都有單一且明確的職責
- ✅ 沒有職責重疊和混亂
- ✅ 易於理解和擴展

### **4. 高效的靜態文件處理**
- ✅ 針對靜態 MDX 文件優化
- ✅ 簡單有效的快取策略
- ✅ 沒有不必要的網路狀態管理

### **5. 優秀的可維護性**
- ✅ 業務邏輯變更只影響 Controller
- ✅ UI 變更不影響業務邏輯
- ✅ 每層都可以獨立測試

## 🧪 測試策略

### **Hook 測試**
```typescript
describe('usePostDetail', () => {
  it('should return post data and loading state', async () => {
    const mockController = {
      getPostById: jest.fn().mockResolvedValue(mockPost),
      getCachedPost: jest.fn().mockReturnValue(mockPost)
    }
    
    const { result } = renderHook(() => usePostDetail('post-1'), {
      wrapper: ({ children }) => (
        <ControllerProvider value={mockController}>
          {children}
        </ControllerProvider>
      )
    })
    
    expect(result.current.isLoading).toBe(true)
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.post).toEqual(mockPost)
    })
  })
})
```

### **Controller 測試**
```typescript
describe('PostController', () => {
  it('should handle comment creation with validation', async () => {
    const mockContext = createMockContext()
    const controller = new PostController(mockContext)
    
    const comment = await controller.addCommentWithValidation('post-1', 'Test comment')
    
    expect(comment.content).toBe('Test comment')
    expect(mockContext.interactionContext.addComment).toHaveBeenCalledWith(comment)
    expect(mockContext.behaviorContext.trackAction).toHaveBeenCalledWith('comment_added', expect.any(Object))
  })
})
```

### **Factory 測試**
```typescript
describe('PostFactory', () => {
  it('should create post from MDX module', async () => {
    const mockMDXModule = {
      frontmatter: { title: 'Test Post', date: '2024-01-01' },
      default: MockComponent
    }
    
    const post = await PostFactory.createFromMDX(mockMDXModule, 'test-id')
    
    expect(post.id).toBe('test-id')
    expect(post.title).toBe('Test Post')
    expect(post.slug).toBe('test-post')
    expect(post.readingTime).toBeGreaterThan(0)
  })
})
```

---

💡 **核心理念**: UI 只與 Hook 交互，Controller 作為真正的 Facade 協調所有業務邏輯，每層職責單一且明確。這個簡化架構專為靜態文件場景優化，提供最佳的開發體驗和維護性。 