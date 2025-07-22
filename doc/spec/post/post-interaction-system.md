# Post Interaction 系統規格

## 🎯 系統概述

Post Interaction 系統是一個全面的文章互動功能，靈感來自 Medium 和 Confluence 的互動設計。系統採用 **Event-Driven Action Handler** 架構，所有功能已完全實現：

1. **✅ Reply Post** - 回覆整篇文章 (已完成)
2. **✅ Comment Section** - 對特定段落進行評論 (已完成)
3. **✅ Highlight Section** - 對特定段落進行高亮標記 (已完成)

## 🏗️ 架構設計

### Event-Driven Action Handler 架構

```
UI Layer (Pages/Components)
    ↓ 只調用 Hook
Hook Layer (useReplyPost, useCommentSection, useMarkSection)
    ↓ 調用 executeAction
Controller Layer (InteractionController - Pure Action Handler)
    ↓ 發送事件
Services Layer (InteractionService, 數據持久化)
    ↓
Context Layer (InteractionContext - 事件監聽和狀態管理)
```

### Provider 整合

```typescript
// App.tsx - 使用 ProviderComposer
const providers = [
  PostProvider,           // 基礎文章數據
  InteractionProvider,    // 互動功能管理
  BehaviorProvider,       // 行為分析
]
```

## 📋 功能規格

### 1. Reply Post (回覆文章)

**用戶故事：** 用戶可以對整篇文章進行回覆，類似 Medium 的文章回應功能。

**技術實作：**
- Hook: `useReplyPost(postId: string)` ✅
- 數據結構: `PostInteraction` with `type: 'reply'` ✅
- UI 組件: `ReplyForm`, `ReplyList`, `PostReplySection` ✅

**API 設計：**
```typescript
function useReplyPost(postId: string) {
  return {
    // 狀態
    replies: PostInteraction[]
    isLoading: boolean
    error: string | null
    
    // 操作
    addReply: (content: string) => Promise<void>
    deleteReply: (replyId: string) => Promise<void>
    editReply: (replyId: string, content: string) => Promise<void>
  }
}
```

### 2. Comment Section (段落評論)

**用戶故事：** 用戶可以選擇特定段落，對其進行評論。點擊已評論的段落會顯示 popover 展示評論內容和刪除選項。

**技術實作：**
- Hook: `useCommentSection(postId: string)`
- 基礎: `useSelectionSection()` - 處理文字選擇
- 數據結構: `PostInteraction` with `type: 'comment'` + `position` + `selectedText`
- UI 組件: `CommentPopover`, `CommentForm`

**API 設計：**
```typescript
function useSelectionSection() {
  return {
    // 選擇狀態
    selectedText: string
    selectionPosition: { x: number, y: number } | null
    sectionId: string | null
    
    // 操作
    handleSelection: () => void
    clearSelection: () => void
  }
}

function useCommentSection(postId: string) {
  return {
    // 狀態
    comments: Record<string, PostInteraction[]> // key: sectionId
    isSubmitting: boolean
    
    // 操作
    addComment: (sectionId: string, selectedText: string, content: string) => Promise<void>
    deleteComment: (commentId: string) => Promise<void>
    getCommentsBySectionId: (sectionId: string) => PostInteraction[]
  }
}
```

### 3. Highlight Section (段落高亮)

**用戶故事：** 用戶可以選擇特定段落進行高亮標記。點擊已高亮的段落會顯示 popover 提供取消高亮選項。

**技術實作：**
- Hook: `useMarkSection(postId: string)`
- 基礎: `useSelectionSection()` - 處理文字選擇
- 數據結構: `PostInteraction` with `type: 'mark'` + `position` + `selectedText`
- UI 組件: `HighlightPopover`

**API 設計：**
```typescript
function useMarkSection(postId: string) {
  return {
    // 狀態
    highlights: Record<string, PostInteraction[]> // key: sectionId
    
    // 操作
    addHighlight: (sectionId: string, selectedText: string) => Promise<void>
    removeHighlight: (highlightId: string) => Promise<void>
    getHighlightsBySectionId: (sectionId: string) => PostInteraction[]
  }
}
```

## 🔧 核心組件設計

### InteractionController (Facade)

```typescript
class InteractionController extends AbstractController {
  // Reply 相關
  async addReply(postId: string, content: string): Promise<PostInteraction>
  async deleteReply(replyId: string): Promise<void>
  
  // Comment 相關
  async addComment(postId: string, sectionId: string, selectedText: string, content: string): Promise<PostInteraction>
  async deleteComment(commentId: string): Promise<void>
  
  // Highlight 相關
  async addHighlight(postId: string, sectionId: string, selectedText: string): Promise<PostInteraction>
  async removeHighlight(highlightId: string): Promise<void>
  
  // 查詢方法
  getInteractionsByPostId(postId: string): PostInteraction[]
  getInteractionsByType(postId: string, type: InteractionType): PostInteraction[]
  getInteractionsBySectionId(postId: string, sectionId: string): PostInteraction[]
}
```

### InteractionService

```typescript
class InteractionService {
  // 基礎 CRUD
  static async getAllInteractions(): Promise<PostInteraction[]>
  static async getInteractionsByPostId(postId: string): Promise<PostInteraction[]>
  static async createInteraction(interaction: Omit<PostInteraction, 'id' | 'timestamp'>): Promise<PostInteraction>
  static async deleteInteraction(id: string): Promise<void>
  static async updateInteraction(id: string, updates: Partial<PostInteraction>): Promise<PostInteraction>
  
  // 查詢方法
  static async getInteractionsByType(postId: string, type: InteractionType): Promise<PostInteraction[]>
  static async getInteractionsBySectionId(postId: string, sectionId: string): Promise<PostInteraction[]>
}
```

### InteractionContext

```typescript
type InteractionState = {
  readonly interactions: PostInteraction[]
  readonly interactionsByPost: Record<string, PostInteraction[]>
  readonly isLoading: boolean
  readonly error: string | null
}

type InteractionContextType = {
  // 狀態
  readonly state: InteractionState
  
  // 查詢方法
  readonly getInteractionsByPostId: (postId: string) => PostInteraction[]
  readonly getInteractionsByType: (postId: string, type: InteractionType) => PostInteraction[]
  readonly getInteractionsBySectionId: (postId: string, sectionId: string) => PostInteraction[]
  
  // 統計方法
  readonly getInteractionStats: (postId: string) => {
    replies: number
    comments: number
    highlights: number
    total: number
  }
  
  // 操作方法
  readonly refreshInteractions: () => Promise<void>
  readonly clearError: () => void
}
```

## 🎨 與 MarkdownRender 整合

### Props 傳遞設計

```typescript
// MarkdownRender.tsx
interface StructuredMarkdownRendererProps {
  post: Post
  
  // 互動功能 props (通過 props 傳入，避免高度依賴)
  onTextSelect?: (selectedText: string, sectionId: string, position: { x: number, y: number }) => void
  onSectionClick?: (sectionId: string, hasInteractions: boolean) => void
  highlightedSections?: Set<string>
  commentedSections?: Set<string>
  
  // 互動狀態顯示
  showInteractionIndicators?: boolean
}

// 使用方式 (在文章詳情頁)
function PostDetailPage() {
  const { post } = usePostDetail(id)
  const textSelection = useSelectionSection()
  const commentSection = useCommentSection(post.id)
  const markSection = useMarkSection(post.id)
  
  return (
    <StructuredMarkdownRenderer
      post={post}
      onTextSelect={textSelection.handleSelection}
      onSectionClick={handleSectionClick}
      highlightedSections={new Set(markSection.highlights.keys())}
      commentedSections={new Set(commentSection.comments.keys())}
      showInteractionIndicators={true}
    />
  )
}
```

### Section ID 生成策略

```typescript
// 在 MarkdownRender 中為每個段落生成穩定的 ID
const generateSectionId = (element: Element, index: number): string => {
  const textContent = element.textContent || ''
  const hash = textContent.slice(0, 30).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')
  return `section-${hash}-${element.tagName.toLowerCase()}-${index}`
}
```

## 🎭 UI/UX 設計指引

### 參考 Medium 的互動模式

1. **文字選擇後的浮動工具列**
   - 選擇文字後顯示 "Comment" 和 "Highlight" 按鈕
   - 位置跟隨選擇範圍

2. **段落互動指示器**
   - 已評論段落左側顯示評論圖標
   - 已高亮段落背景色變化
   - hover 時顯示互動數量

3. **Popover 設計**
   - Comment Popover: 顯示評論內容 + 刪除按鈕
   - Highlight Popover: 顯示取消高亮按鈕
   - 位置智能調整，避免超出視窗

### 參考 Confluence 的功能性

1. **評論串接**
   - 支援對評論的回覆
   - 評論時間戳和作者顯示

2. **協作功能**
   - 不同用戶的高亮用不同顏色區分
   - 評論作者標識

## 📅 實作階段規劃

### ✅ 階段 1: 基礎架構 (已完成)
- [x] 創建 InteractionContext
- [x] 創建 InteractionController
- [x] 創建 InteractionService
- [x] 整合到 App.tsx (使用 ProviderComposer)

### ✅ 階段 2: Reply Post 功能 (已完成)
- [x] 實作 useReplyPost hook
- [x] 創建 ReplyForm 組件
- [x] 創建 ReplyList 組件
- [x] 創建 PostReplySection 整合組件
- [x] 在文章詳情頁整合
- [x] 實時互動統計顯示

### ✅ 階段 3: Selection 基礎功能 (已完成)
- [x] 實作 useSelectionSection hook
- [x] 修改 MarkdownRender 支援 section 互動
- [x] 實作文字選擇檢測和 ID 生成
- [x] 創建 SelectionPopover 組件
- [x] 實作 absolute positioning 定位系統

### ✅ 階段 4: Highlight Section 功能 (已完成)
- [x] 實作 useMarkSection hook
- [x] 整合 Highlight 功能到 MarkdownRender
- [x] 實作精確文字高亮效果
- [x] 文字選擇浮動工具列 (Medium 風格)
- [x] 高亮統計和視覺反饋

### ✅ 階段 5: Comment Section 功能 (已完成)
- ✅ 實作 useCommentSection hook
- ✅ 創建 CommentPopover 組件 
- ✅ 創建 CommentForm 組件
- ✅ 整合評論功能到 SelectionPopover
- ✅ 實現評論事件監聽和實時更新
- ✅ 添加評論刪除和編輯功能

### ✅ 階段 6: 統計和優化 (已完成)
- ✅ 完善互動統計顯示
- ✅ 實現 Event-Driven 架構重構
- ✅ executeAction 統一接口實現
- ✅ ControllerRegistry 統一管理
- ✅ 技術債務追蹤和文檔完善

## 🔍 技術細節

### 數據存儲策略

```typescript
// 使用 postId 作為 key 關聯數據
const interactionsByPost: Record<string, PostInteraction[]> = {
  'post-1': [
    {
      id: 'interaction-1',
      postId: 'post-1',
      type: 'reply',
      content: '這篇文章很有趣！',
      timestamp: '2024-01-01T10:00:00Z'
    },
    {
      id: 'interaction-2',
      postId: 'post-1',
      type: 'comment',
      content: '這段話需要更多解釋',
      selectedText: '關鍵概念...',
      position: { start: 100, end: 120, sectionId: 'section-key-concept-p-1' },
      timestamp: '2024-01-01T11:00:00Z'
    }
  ]
}
```

### 事件驅動更新

```typescript
// Controller 發射事件
this.emit('interactionAdded', interaction)
this.emit('interactionRemoved', interactionId)
this.emit('interactionUpdated', interaction)

// Context 監聽事件並更新狀態
useEffect(() => {
  const handleInteractionAdded = (interaction: PostInteraction) => {
    dispatch({ type: 'ADD_INTERACTION', payload: interaction })
  }
  
  controller.on('interactionAdded', handleInteractionAdded)
  return () => controller.off('interactionAdded', handleInteractionAdded)
}, [controller])
```

## 🎯 成功指標

1. **功能完整性**
   - 所有三大功能正常運作
   - 數據正確存儲和檢索
   - 跨組件狀態同步

2. **用戶體驗**
   - 響應式設計適配各種螢幕
   - 流暢的互動動畫
   - 直觀的視覺反饋

3. **技術品質**
   - 遵循架構設計原則
   - 完整的 TypeScript 類型定義
   - 良好的錯誤處理

4. **性能表現**
   - 文字選擇響應時間 < 100ms
   - Popover 顯示延遲 < 50ms
   - 大量互動數據載入流暢

## ✅ 已完成功能總結

### Reply Post 功能 (完整實作)

**架構組件：**
- `InteractionService` - 數據 CRUD 操作 (localStorage)
- `InteractionController` - 業務邏輯協調 (Facade Pattern)
- `InteractionContext` - 全域狀態管理 (事件驅動)
- `useReplyPost` - UI 邏輯封裝 Hook

**UI 組件：**
- `ReplyForm` - 回覆表單 (支援驗證、錯誤處理、載入狀態)
- `ReplyList` - 回覆列表 (時間格式化、刪除確認、空狀態)
- `PostReplySection` - 整合組件 (表單 + 列表)

**功能特性：**
- ✅ 添加回覆 (內容驗證、字數限制)
- ✅ 刪除回覆 (確認對話框)
- ✅ 實時統計更新 (事件驅動)
- ✅ 錯誤處理 (用戶友好提示)
- ✅ 載入狀態 (Skeleton Loading)
- ✅ 響應式設計 (移動端適配)
- ✅ 時間格式化 (相對時間顯示)

**數據持久化：**
- 使用 localStorage 存儲
- 支援跨頁面狀態同步
- 事件驅動的實時更新

**測試方式：**
1. 進入任一文章詳情頁
2. 點擊「新增回覆」按鈕
3. 輸入回覆內容並提交
4. 查看回覆列表和統計更新
5. 測試刪除回覆功能

**下一步：**
準備實作 Selection 基礎功能和 Comment Section 功能。

### Selection 基礎功能 (完整實作)

**架構組件：**
- `useSelectionSection` - 文字選擇邏輯 Hook (支援 absolute positioning)
- `SelectionPopover` - 文字選擇浮動工具列 (Medium 風格)
- `StructuredMarkdownRenderer` - 整合選擇功能的 Markdown 渲染器

**核心功能：**
- ✅ 精確文字選擇檢測 (collapsed range 定位)
- ✅ 段落 ID 自動生成 (穩定 hash 算法)
- ✅ Container 相對定位系統 (absolute positioning)
- ✅ 選擇範圍驗證 (最小字數、有效性檢查)
- ✅ 事件處理優化 (mouseup + click 組合)
- ✅ Popover 智能定位 (選擇起點精確對齊)

**技術特性：**
- ✅ TypeScript 完整類型支援
- ✅ 事件清理和記憶體管理
- ✅ 延遲清除機制 (給 Popover 操作留時間)
- ✅ 邊界檢查和錯誤處理

### Highlight Section 功能 (完整實作)

**架構組件：**
- `useMarkSection` - 高亮管理 Hook
- 整合到 `SelectionPopover` - 高亮按鈕和操作
- 整合到 `StructuredMarkdownRenderer` - 視覺高亮渲染

**核心功能：**
- ✅ 精確文字高亮 (TreeWalker + Range API)
- ✅ 高亮數據持久化 (localStorage)
- ✅ 重複高亮檢測 (避免重複標記)
- ✅ 高亮統計顯示 (實時計數)
- ✅ 高亮視覺效果 (黃色背景 + 圓角)
- ✅ DOM 節點管理 (動態插入/移除 mark 標籤)

**UI/UX 特性：**
- ✅ Medium 風格選擇工具列
- ✅ 高亮按鈕狀態管理 (載入中、已高亮檢測)
- ✅ 高亮統計角標顯示
- ✅ 選擇文字預覽 (截斷顯示)
- ✅ 操作按鈕分組 (高亮/評論/關閉)

**數據持久化：**
- 使用 localStorage 存儲
- 支援跨頁面狀態同步
- 事件驅動的實時更新

**測試方式：**
1. 進入任一文章詳情頁
2. 選擇文章中的任意文字 (至少 3 個字)
3. 查看浮動工具列出現
4. 點擊「高亮」按鈕進行標記
5. 重新載入頁面驗證高亮持久化
6. 查看右上角高亮統計更新

**✅ 系統狀態：**
所有 Post Interaction 功能已完成實作，系統已完全重構為 Event-Driven Action Handler 架構，22 個 Actions 可用於 AI Agent SuperController 整合。

**🚧 下一步：**
準備開發 AI Agent SuperController 系統，實現智能建議和自動化操作。 