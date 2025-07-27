# 🏗️ 系統架構設計

## 📋 架構概覽

本專案採用 **Event-Driven Action Handler 架構**，已完成重構並為 AI Agent SuperController 做好準備。每層職責單一清晰，使用統一的 executeAction 模式和 Command Pattern。

### 🎯 核心架構

```
Hook Layer (UI 抽象) ↔ Controller Layer (Action Handler) ↔ Services Layer (數據)
                     ↓
               Context (可選的 Global Store)

實際運行狀況:
- ✅ 22 個 Actions 可用 (PostController: 11個, InteractionController: 6個, AIAgentController: 5個)
- ✅ 3 個 Controllers 完全重構為純 Action Handler
- ✅ Event-Driven 事件系統正常運行
- ✅ ControllerRegistry 統一管理和調度
- ✅ 所有 Controllers 實現統一 executeAction 介面
```

## 🤖 AI Agent 控制流程

```
AI Agent (字串指令)
        │
        ▼
┌──────────────────┐
│ SuperController  │  (Invoker / Mediator)
└──────────────────┘
        │
        ▼
┌──────────────────┐
│ ControllerRegistry│  (統一管理和發現機制)
└──────────────────┘
  ├─ DirectApplyPolicy ─▶ executeAction() ─▶ xxxController / Service
  │
  └─ Queue ─▶ ToastPolicy ─▶ User Confirm ─▶ executeAction() ─▶ xxxController / Service
```

### ✨ ControllerRegistry 職責

**ControllerRegistry** 是整個系統的核心管理器：

- **🎯 Controller 註冊和管理**: 所有 Controller 實例都通過 Registry 註冊和管理
- **🔍 Action 發現機制**: 動態發現所有可用的 Actions 供 AI Agent 使用
- **⚡ 統一執行介面**: 提供 `executeAction(controllerName, actionType, payload)` 統一調用
- **📊 狀態監控**: 提供 Controller 狀態、Action 列表等管理信息
- **🔧 生命週期管理**: 統一的初始化和銷毀流程

## 🎯 核心設計模式

| Pattern | 目的 | 適用部位 |
|---------|------|----------|
| **Command Pattern** | 將「動作 + 參數」包成物件，可序列化、排進佇列、支援 undo | Agent 指令 → Command |
| **Facade Pattern** | 提供簡化、統一的 API，屏蔽底層複雜度 | Controller Facade |
| **Mediator Pattern** | 集中協調多元件互動，避免彼此耦合 | SuperController |
| **Strategy Pattern** | 把「如何執行 Command」抽離為可插拔策略 | ApplyPolicy (直接 / Toast) |

## 🏛️ 分層架構詳解

### **UI Layer (純渲染層)**

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
```

### **Hook Layer (UI 抽象)**

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
```

### **Controller Layer (純 Action Handler)**

**職責：** 純 Action 處理 + 事件發送 + 業務邏輯協調  
**原則：** 無狀態，通過事件通知狀態變更

```typescript
class PostController extends AbstractController {
    // Action 映射表
    private actionMap = createActionMap([
        { type: 'LOAD_POSTS', handler: this.loadPosts.bind(this), description: '載入所有文章' },
        { type: 'LOAD_POST', handler: this.loadPost.bind(this), description: '載入指定文章' },
        { type: 'SEARCH_POSTS', handler: this.searchPosts.bind(this), description: '搜尋文章' },
        { type: 'ADD_COMMENT', handler: this.addComment.bind(this), description: '新增評論' }
    ])
    
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
}
```

### **Services Layer (數據 + 緩存 + 持久化)**

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

## 🎯 架構優勢

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