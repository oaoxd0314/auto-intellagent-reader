# 控制器架構實作規格

## 🎯 目標功能

1. **Abstract Controller** - 基礎控制器接口和狀態管理
2. **Highlight Controller** - 文本高亮功能
3. **Selection Controller** - 文本選擇和評論功能  
4. **Reply Controller** - 文章回覆功能

## 📋 功能清單

### Phase 2: 控制器架構 🎮
- [ ] **Abstract Controller**
  - [ ] 基礎控制器接口
  - [ ] 狀態管理機制
  - [ ] 事件處理管道
- [ ] **用戶互動功能**
  - [ ] 文本高亮系統
  - [ ] 筆記和評論
  - [ ] 書籤管理

## 🏗️ 技術架構

### 資料流架構
```
UI Components → Controllers → Services → Storage
     ↓             ↓           ↓         ↓
  用戶交互      控制器層    業務邏輯    數據持久化
```

### 1. 抽象控制器層
**待實作：** 基礎控制器接口和共用邏輯

```typescript
// src/controllers/AbstractController.ts
abstract class AbstractController<T = any> {
  protected state: T
  protected listeners: Map<string, Function[]>
  
  abstract initialize(): void
  abstract destroy(): void
  
  // 事件系統
  protected emit(event: string, data?: any): void
  protected on(event: string, callback: Function): void
  protected off(event: string, callback: Function): void
  
  // 狀態管理
  protected setState(newState: Partial<T>): void
  protected getState(): T
}
```

### 2. 高亮控制器
**待實作：** 文本選擇和高亮功能

```typescript
// src/controllers/HighlightController.ts
interface HighlightState {
  highlights: Highlight[]
  activeHighlight: string | null
  isSelecting: boolean
}

interface Highlight {
  id: string
  text: string
  range: Range
  color: string
  timestamp: number
  note?: string
}

class HighlightController extends AbstractController<HighlightState> {
  // 核心功能
  createHighlight(selection: Selection, color?: string): Promise<Highlight>
  removeHighlight(id: string): Promise<void>
  updateHighlight(id: string, updates: Partial<Highlight>): Promise<void>
  
  // 選擇處理
  handleTextSelection(event: MouseEvent): void
  clearSelection(): void
  
  // 渲染控制
  renderHighlights(): void
  highlightElement(element: HTMLElement, highlight: Highlight): void
}
```

### 3. 選擇評論控制器
**待實作：** 文本選擇後的評論功能

```typescript
// src/controllers/SelectionController.ts
interface SelectionState {
  currentSelection: Selection | null
  selectionRect: DOMRect | null
  isCommentPanelOpen: boolean
  comments: Comment[]
}

interface Comment {
  id: string
  text: string
  selectedText: string
  range: Range
  timestamp: number
  author: string
}

class SelectionController extends AbstractController<SelectionState> {
  // 選擇處理
  handleSelectionChange(): void
  getSelectionRect(): DOMRect | null
  
  // 評論功能
  openCommentPanel(selection: Selection): void
  closeCommentPanel(): void
  createComment(text: string): Promise<Comment>
  
  // UI 控制
  showSelectionToolbar(): void
  hideSelectionToolbar(): void
}
```

### 4. 回覆控制器
**待實作：** 文章整體回覆功能

```typescript
// src/controllers/ReplyController.ts
interface ReplyState {
  replies: Reply[]
  isReplyPanelOpen: boolean
  currentReply: string
}

interface Reply {
  id: string
  content: string
  timestamp: number
  author: string
  postId: string
}

class ReplyController extends AbstractController<ReplyState> {
  // 回覆管理
  createReply(content: string): Promise<Reply>
  updateReply(id: string, content: string): Promise<void>
  deleteReply(id: string): Promise<void>
  
  // UI 控制
  openReplyPanel(): void
  closeReplyPanel(): void
  
  // 數據獲取
  getRepliesByPost(postId: string): Promise<Reply[]>
}
```

## 🔧 服務層設計

### 1. 高亮服務
```typescript
// src/services/HighlightService.ts
class HighlightService {
  static async saveHighlight(highlight: Highlight): Promise<void>
  static async getHighlights(postId: string): Promise<Highlight[]>
  static async deleteHighlight(id: string): Promise<void>
  static async updateHighlight(id: string, updates: Partial<Highlight>): Promise<void>
}
```

### 2. 評論服務
```typescript
// src/services/CommentService.ts
class CommentService {
  static async saveComment(comment: Comment): Promise<void>
  static async getComments(postId: string): Promise<Comment[]>
  static async deleteComment(id: string): Promise<void>
  static async updateComment(id: string, content: string): Promise<void>
}
```

### 3. 回覆服務
```typescript
// src/services/ReplyService.ts
class ReplyService {
  static async saveReply(reply: Reply): Promise<void>
  static async getReplies(postId: string): Promise<Reply[]>
  static async deleteReply(id: string): Promise<void>
  static async updateReply(id: string, content: string): Promise<void>
}
```

## 📦 UI 組件設計

### 1. 高亮工具欄
```typescript
// src/components/HighlightToolbar.tsx
interface HighlightToolbarProps {
  selection: Selection | null
  onHighlight: (color: string) => void
  onComment: () => void
  position: { x: number; y: number }
}

export function HighlightToolbar(props: HighlightToolbarProps)
```

### 2. 評論面板
```typescript
// src/components/CommentPanel.tsx
interface CommentPanelProps {
  isOpen: boolean
  selectedText: string
  onSave: (comment: string) => void
  onClose: () => void
  position: { x: number; y: number }
}

export function CommentPanel(props: CommentPanelProps)
```

### 3. 回覆面板
```typescript
// src/components/ReplyPanel.tsx
interface ReplyPanelProps {
  isOpen: boolean
  replies: Reply[]
  onSubmit: (content: string) => void
  onClose: () => void
}

export function ReplyPanel(props: ReplyPanelProps)
```

## 🗂️ 數據存儲設計

### 1. LocalStorage 結構
```typescript
// 高亮數據
interface HighlightStorage {
  [postId: string]: {
    highlights: Highlight[]
    lastUpdated: number
  }
}

// 評論數據
interface CommentStorage {
  [postId: string]: {
    comments: Comment[]
    lastUpdated: number
  }
}

// 回覆數據
interface ReplyStorage {
  [postId: string]: {
    replies: Reply[]
    lastUpdated: number
  }
}
```

### 2. 存儲服務
```typescript
// src/services/StorageService.ts
class StorageService {
  static save<T>(key: string, data: T): void
  static load<T>(key: string): T | null
  static remove(key: string): void
  static clear(): void
  
  // 專用方法
  static saveHighlights(postId: string, highlights: Highlight[]): void
  static loadHighlights(postId: string): Highlight[]
  static saveComments(postId: string, comments: Comment[]): void
  static loadComments(postId: string): Comment[]
}
```

## 📋 實作清單

### Phase 2.1: 基礎架構 🏗️
- [ ] 創建 `src/controllers/` 目錄
- [ ] 實作 `AbstractController` 基類
- [ ] 建立事件系統和狀態管理
- [ ] 創建基礎類型定義

### Phase 2.2: 高亮功能 🎨
- [ ] 實作 `HighlightController`
- [ ] 創建 `HighlightService` 和存儲邏輯
- [ ] 實作 `HighlightToolbar` 組件
- [ ] 添加高亮渲染和樣式

### Phase 2.3: 評論功能 💬
- [ ] 實作 `SelectionController`
- [ ] 創建 `CommentService` 和存儲邏輯
- [ ] 實作 `CommentPanel` 組件
- [ ] 添加選擇檢測和 UI 定位

### Phase 2.4: 回覆功能 📝
- [ ] 實作 `ReplyController`
- [ ] 創建 `ReplyService` 和存儲邏輯
- [ ] 實作 `ReplyPanel` 組件
- [ ] 整合到文章頁面

### Phase 2.5: 整合測試 🧪
- [ ] 控制器間協調測試
- [ ] UI 交互測試
- [ ] 數據持久化測試
- [ ] 性能優化

## 🎯 技術重點

### 1. 文本選擇處理
- 使用 `Selection` 和 `Range` API
- 處理跨元素選擇
- 保存和恢復選擇範圍

### 2. 動態 UI 定位
- 計算選擇區域位置
- 響應式工具欄定位
- 避免邊界溢出

### 3. 狀態同步
- 控制器間狀態共享
- UI 組件狀態同步
- 數據持久化策略

### 4. 事件處理
- 文本選擇事件
- 鍵盤快捷鍵
- 點擊外部關閉

## 🔮 擴展規劃

### 短期擴展
- 快捷鍵支援
- 高亮顏色自定義
- 評論回覆功能

### 中期擴展
- 協作功能
- 匯出功能
- 搜索和篩選

### 長期擴展
- 雲端同步
- AI 輔助評論
- 版本控制 