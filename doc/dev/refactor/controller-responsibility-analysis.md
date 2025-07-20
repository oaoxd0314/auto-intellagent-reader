# Controller 職責分析與清理計劃

## 🔍 現有 AbstractController 問題分析

### ❌ 不應該有的職責 (舊時代雜物)

1. **狀態管理與暴露**
   ```typescript
   // 🚫 移除：Controller 不應該管理狀態
   protected state: T & ControllerState
   getState(): T & ControllerState
   setState(newState: Partial<T>): void
   ```

2. **複雜的生命週期管理**
   ```typescript
   // 🚫 移除：過度複雜的狀態追蹤
   isInitialized: false,
   isDestroyed: false,
   lastUpdated: Date.now()
   ```

3. **配置管理**
   ```typescript
   // 🚫 移除：Controller 不需要複雜配置
   autoStart: true,
   enableLogging: false,
   debugMode: false
   ```

4. **錯誤處理機制**
   ```typescript
   // 🚫 移除：錯誤處理應該在上層
   ControllerError, createError()
   ```

---

## ✅ Controller 應該有的核心職責

### 1. **純 Action Processing**
```typescript
interface IController {
  executeAction(actionType: string, payload: any): Promise<void>
}
```

### 2. **事件發送機制**
```typescript
// ✅ 保留：通知狀態變更
emit(eventType: string, data: any): void
```

### 3. **Service 層調用**
```typescript
// ✅ 核心：業務邏輯處理
async loadPosts() {
  const posts = await PostService.getAllPosts()
  this.emit('postsLoaded', posts)
}
```

### 4. **簡單生命週期**
```typescript
// ✅ 最簡化：
initialize(): void
destroy(): void
```

---

## 🎯 新 AbstractController 設計

### 核心介面
```typescript
interface IActionController {
  // 統一 Action 處理
  executeAction(actionType: string, payload: any): Promise<void>
  
  // 事件系統 (最小化)
  emit(eventType: string, data: any): void
  
  // 簡單生命週期
  initialize(): void
  destroy(): void
}
```

### 實作原則
1. **無狀態:** Controller 不持有任何業務狀態
2. **事件驅動:** 所有結果通過事件通知
3. **Action 導向:** 通過 `executeAction` 統一處理命令
4. **Service 協調:** 主要工作是協調 Service 層

---

## 🗑️ 清理計劃

### 階段 1: 移除狀態管理
- [ ] 移除 `state`, `setState`, `getState`
- [ ] 移除 `ControllerState` 相關型別
- [ ] 移除狀態生命週期追蹤

### 階段 2: 簡化生命週期
- [ ] 移除複雜的初始化檢查
- [ ] 移除銷毀狀態管理
- [ ] 保留最基本的 `initialize/destroy`

### 階段 3: 移除配置系統
- [ ] 移除 `ControllerConfig`
- [ ] 移除 `configure` 方法
- [ ] 移除 `autoStart` 等配置

### 階段 4: 簡化錯誤處理
- [ ] 移除 `ControllerError`
- [ ] 讓錯誤在上層 (Context) 處理
- [ ] 通過事件傳遞錯誤信息

### 階段 5: 優化事件系統
- [ ] 保留核心事件功能
- [ ] 移除過度的錯誤處理
- [ ] 標準化事件格式

---

## 📋 新架構下的職責分工

### Controller 職責
```typescript
class PostController extends AbstractController {
  async executeAction(actionType: string, payload: any) {
    const actionMap = {
      'LOAD_POSTS': () => this.loadPosts(),
      'LOAD_POST': (id: string) => this.loadPost(id),
      'SEARCH_POSTS': (filters: any) => this.searchPosts(filters)
    }
    
    await actionMap[actionType]?.(payload)
  }
  
  private async loadPosts() {
    try {
      const posts = await PostService.getAllPosts()
      this.emit('postsLoaded', posts)
    } catch (error) {
      this.emit('postsError', error.message)
    }
  }
}
```

### Context 職責
```typescript
// Context 接收事件，管理狀態
controller.on('postsLoaded', (posts) => {
  setPosts(posts)
  setLoading(false)
})

controller.on('postsError', (error) => {
  setError(error)
  setLoading(false)
})
```

### Hook 職責
```typescript
// Hook 只調用 Context
const { posts, loading, error, executeAction } = usePostContext()

const loadPosts = () => executeAction('LOAD_POSTS')
```

---

## 🎯 為 AI Agent 準備

新設計直接支援 SuperController:

```typescript
class SuperController {
  executeCommand(command: string) {
    const { controllerName, actionType, payload } = parseCommand(command)
    const controller = this.getController(controllerName)
    return controller.executeAction(actionType, payload)
  }
}
```

**優勢:**
- 統一的 Action 介面
- 事件驅動的結果回報
- 無狀態的 Controller 易於管理
- 為 Command Pattern 做好準備