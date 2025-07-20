# 🛠️ 開發文檔總覽

> 本目錄包含所有技術架構、開發指南和實作細節的文檔。

## 📚 文檔結構概覽

### 🏗️ **架構設計**
- **[architecture.md](./architecture.md)** - AI Agent 統一架構設計
- **[ai-agent-guide.md](./ai-agent-guide.md)** - AI Agent Command Pattern 實作指南
- **[state-flow.md](./state-flow.md)** - 資料流和狀態管理

### 💻 **開發指南**
- **[coding-standards.md](./coding-standards.md)** - 程式碼規範和最佳實踐
- **[project-structure.md](./project-structure.md)** - 專案目錄結構說明

---

## 🎯 架構核心理念

## 🎯 架構核心理念

### **「AI Agent + 傳統 UI 雙重支援」**
- **AI Agent**: 透過字串指令動態調用業務邏輯
- **傳統 UI**: UI 組件透過 Hook 調用 Controller
- **統一接口**: 兩種方式都通過 Controller Facade 執行

### **「Command Pattern 為核心」**
- **AgentCommand**: 將 AI 指令封裝為可執行物件
- **SuperController**: 解析指令、管理佇列、選擇執行策略
- **ApplyPolicy**: 支援直接執行或人工確認

### **「每層職責單一且明確」**
- **AI Agent**: 生成字串指令
- **SuperController**: 指令解析和執行協調
- **Controller Facade**: 統一業務邏輯接口
- **Hook**: UI 狀態管理 + Controller 調用
- **Context**: 純狀態管理
- **Factory**: 物件創建和轉換
- **Services**: 純數據 CRUD

## 🏗️ 統一架構概覽

```
AI Agent (字串指令) ←→ SuperController ←→ Controller Facade
                                              ↑
UI Components ←→ Hook (UI 交互層) ←→ Controller ←┘
                                              ↓
                                    Context/Factory/Services
```

### 雙重執行路徑
1. **AI Agent 路徑**: `AI Agent → SuperController → Controller Facade → xxxController`
2. **傳統 UI 路徑**: `UI → Hook → Controller → Context/Service`
3. **統一後端**: 兩種路徑最終都調用相同的業務邏輯

此架構同時支援 AI 動態控制和傳統 UI 互動，保持最佳的開發體驗。

## 🛠️ 開發工作流

### 1. **新增 AI Agent 指令**

#### Step 1: 定義 AgentCommand
```typescript
// src/commands/AddTaskCommand.ts
class AddTaskCommand implements AgentCommand {
  constructor(private payload: { title: string; description?: string }) {}
  
  get type(): string { return 'ADD_TASK' }
  
  toHumanReadable(): string {
    return `新增任務: ${this.payload.title}`
  }
  
  async apply(policy: ApplyPolicy): Promise<void> {
    const execute = async () => {
      const controller = getTaskController()
      await controller.addTask(this.payload)
    }
    
    await policy(this, execute)
  }
}
```

#### Step 2: 註冊到 CommandFactory
```typescript
// src/lib/CommandFactory.ts
const commandTable: Record<string, (args: string[]) => AgentCommand> = {
  ADD_TASK: (args) => new AddTaskCommand(parseTaskArgs(args)),
  DELETE_TASK: (args) => new DeleteTaskCommand(parseTaskArgs(args)),
  // ... 其他指令
}
```

#### Step 3: 測試 AI Agent 指令
```typescript
// 使用方式
const superController = new SuperController(directApplyPolicy)
superController.enqueue('ADD_TASK title="買牛奶" description="去超市買有機牛奶"')
```

### 2. **新增 UI 功能**

#### Step 1: 創建 Hook
```typescript
// src/hooks/useNewFeature.ts
function useNewFeature(params: FeatureParams) {
  const controller = usePostController()
  const [localState, setLocalState] = useState(initialState)
  
  const handleAction = useCallback(async () => {
    try {
      await controller.performBusinessLogic(params)
      setLocalState(newState)
    } catch (error) {
      console.error('Feature error:', error)
    }
  }, [controller, params])
  
  return {
    data: controller.getFeatureData(params),
    localState,
    handleAction,
    isLoading: controller.isFeatureLoading(params)
  }
}
```

#### Step 2: 在 UI 中使用
```typescript
// src/components/NewFeatureComponent.tsx
function NewFeatureComponent({ featureParams }: Props) {
  const { data, localState, handleAction, isLoading } = useNewFeature(featureParams)
  
  if (isLoading) return <LoadingSpinner />
  
  return (
    <div>
      <FeatureDisplay data={data} />
      <ActionButton onClick={handleAction} />
    </div>
  )
}
```

#### Step 3: 實現 Controller 業務邏輯
```typescript
// src/controllers/PostController.ts
class PostController {
  async performBusinessLogic(params: FeatureParams): Promise<void> {
    // 1. 驗證參數
    this.validateParams(params)
    
    // 2. 協調多個 Service 和 Context
    const data = await SomeService.fetchData(params)
    const processedData = SomeFactory.process(data)
    
    // 3. 更新狀態
    this.someContext.updateState(processedData)
    this.behaviorContext.trackAction('feature_used', params)
  }
  
  getFeatureData(params: FeatureParams): FeatureData | null {
    return this.someContext.getFeatureData(params)
  }
  
  isFeatureLoading(params: FeatureParams): boolean {
    return this.someContext.isLoading('feature', params)
  }
}
```

### 3. **新增業務邏輯 (AI + UI 共用)**

#### 在 Controller 中實現複雜的業務邏輯協調：
```typescript
async addCommentWithNotification(postId: string, content: string): Promise<Comment> {
  // 1. 業務驗證
  if (!this.validateCommentContent(content)) {
    throw new Error('Invalid comment content')
  }
  
  // 2. 檢查權限
  if (!this.checkCommentPermission(postId)) {
    throw new Error('No permission to comment')
  }
  
  // 3. 創建評論
  const comment = CommentFactory.create(postId, content)
  
  // 4. 保存數據
  await InteractionService.saveComment(comment)
  
  // 5. 更新多個狀態
  this.interactionContext.addComment(comment)
  this.postContext.incrementCommentCount(postId)
  
  // 6. 觸發通知
  this.notificationContext.showSuccess('Comment added successfully')
  
  // 7. 追蹤行為
  this.behaviorContext.trackAction('comment_added', {
    postId,
    commentLength: content.length
  })
  
  return comment
}
```

### 4. **新增數據類型**

#### Step 1: 定義類型
```typescript
// src/types/newEntity.ts
export interface NewEntity {
  id: string
  name: string
  metadata: EntityMetadata
}

export interface EntityMetadata {
  createdAt: string
  updatedAt: string
  version: number
}
```

#### Step 2: 創建 Factory
```typescript
// src/lib/NewEntityFactory.ts
class NewEntityFactory {
  static create(data: CreateEntityData): NewEntity {
    return {
      id: this.generateId(),
      name: this.sanitizeName(data.name),
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      }
    }
  }
  
  static update(entity: NewEntity, updates: Partial<CreateEntityData>): NewEntity {
    return {
      ...entity,
      ...updates,
      metadata: {
        ...entity.metadata,
        updatedAt: new Date().toISOString(),
        version: entity.metadata.version + 1
      }
    }
  }
}
```

#### Step 3: 創建 Service
```typescript
// src/services/NewEntityService.ts
class NewEntityService {
  static async getAll(): Promise<NewEntity[]> {
    return NewEntityDataSource.loadAll()
  }
  
  static async getById(id: string): Promise<NewEntity | undefined> {
    return NewEntityDataSource.loadById(id)
  }
  
  static async save(entity: NewEntity): Promise<void> {
    return NewEntityDataSource.save(entity)
  }
  
  static async delete(id: string): Promise<void> {
    return NewEntityDataSource.delete(id)
  }
}
```

### 5. **新增 Context 狀態**

#### 只負責純狀態管理，不包含業務邏輯：
```typescript
// src/contexts/NewEntityContext.tsx
interface NewEntityContextType {
  // 狀態
  entities: NewEntity[]
  currentEntity: NewEntity | null
  isLoading: boolean
  error: string | null
  
  // 純狀態操作
  setEntities: (entities: NewEntity[]) => void
  setCurrentEntity: (entity: NewEntity | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // 簡單的狀態查詢
  getEntityById: (id: string) => NewEntity | undefined
  getEntitiesByType: (type: string) => NewEntity[]
}

function NewEntityProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(newEntityReducer, initialState)
  
  // 只提供狀態操作，不包含業務邏輯
  const contextValue = useMemo(() => ({
    ...state,
    setEntities: (entities: NewEntity[]) => 
      dispatch({ type: 'SET_ENTITIES', payload: entities }),
    setCurrentEntity: (entity: NewEntity | null) => 
      dispatch({ type: 'SET_CURRENT_ENTITY', payload: entity }),
    // ... 其他純狀態操作
  }), [state])
  
  return (
    <NewEntityContext.Provider value={contextValue}>
      {children}
    </NewEntityContext.Provider>
  )
}
```

## 📁 目錄結構導覽

### **核心目錄**
```
src/
├── ai-agent/        # AI Agent 相關
│   ├── commands/    # AgentCommand 實現
│   ├── policies/    # ApplyPolicy 實現
│   └── SuperController.ts
├── hooks/           # UI 交互層 - Hook 實現
├── controllers/     # 業務邏輯層 - Controller 實現  
├── contexts/        # 狀態管理層 - Context 實現
├── lib/            # 工廠層 - Factory 實現
├── services/       # 數據層 - Service 實現
├── types/          # 類型定義
└── components/     # UI 組件
```

### **AI Agent 目錄組織**
```
ai-agent/
├── commands/
│   ├── AddTaskCommand.ts
│   ├── DeleteTaskCommand.ts
│   └── UpdateTaskCommand.ts
├── policies/
│   ├── DirectApplyPolicy.ts
│   ├── ToastPolicy.ts
│   └── index.ts
├── SuperController.ts
└── CommandFactory.ts
```

### **Hook 目錄組織**
```
hooks/
├── usePostDetail.ts      # 文章詳情功能
├── useCommentSection.ts  # 評論功能
├── useTextSelection.ts   # 文字選擇功能
└── useSearch.ts         # 搜索功能
```

### **Controller 目錄組織**
```
controllers/
├── PostController.ts        # 文章業務邏輯
├── InteractionController.ts # 互動業務邏輯
├── BehaviorController.ts    # 行為追蹤邏輯
└── index.ts                # Controller 導出
```

## 🔧 開發規範

### **AgentCommand 設計原則**
1. **單一職責** - 每個 Command 只負責一個特定操作
2. **人類可讀** - 提供清晰的 `toHumanReadable()` 描述
3. **可復原** - 重要操作應提供 `undo()` 方法
4. **策略無關** - 不關心如何執行，只關心做什麼

```typescript
// ✅ 好的 AgentCommand 設計
class UpdatePostCommand implements AgentCommand {
  constructor(private postId: string, private updates: PostUpdateData) {}
  
  get type(): string { return 'UPDATE_POST' }
  
  toHumanReadable(): string {
    return `更新文章 "${this.updates.title || this.postId}"`
  }
  
  async apply(policy: ApplyPolicy): Promise<void> {
    const execute = async () => {
      const facade = getPostFacade()
      await facade.updatePost(this.postId, this.updates)
    }
    
    await policy(this, execute)
  }
  
  async undo(): Promise<void> {
    const facade = getPostFacade()
    await facade.revertPost(this.postId)
  }
}

// ❌ 避免：Command 包含執行策略
class BadCommand implements AgentCommand {
  async apply(): Promise<void> {
    // ❌ 不應該在 Command 中決定執行策略
    if (this.needsConfirmation) {
      await this.showConfirmDialog()
    }
    await this.execute()
  }
}
```

### **SuperController 設計原則**
1. **佇列管理** - 維護指令執行佇列
2. **策略選擇** - 根據指令類型選擇合適的 ApplyPolicy
3. **錯誤處理** - 統一處理指令解析和執行錯誤
4. **審計日誌** - 記錄所有指令執行歷史

```typescript
// ✅ 好的 SuperController 設計
class SuperController {
  private queue: AgentCommand[] = []
  private history: CommandHistory[] = []
  
  constructor(private defaultPolicy: ApplyPolicy) {}
  
  enqueue(rawCommand: string): void {
    try {
      const command = CommandFactory.fromString(rawCommand)
      this.queue.push(command)
      this.processQueue()
    } catch (error) {
      this.handleParseError(error, rawCommand)
    }
  }
  
  private async processQueue(): Promise<void> {
    const command = this.queue.shift()
    if (!command) return
    
    const policy = this.selectPolicy(command)
    
    try {
      await command.apply(policy)
      this.recordSuccess(command)
    } catch (error) {
      this.recordFailure(command, error)
    }
    
    this.processQueue() // 繼續處理下一個
  }
  
  private selectPolicy(command: AgentCommand): ApplyPolicy {
    // 根據指令類型選擇策略
    if (command.type.includes('DELETE')) {
      return toastPolicy // 刪除操作需要確認
    }
    return this.defaultPolicy
  }
}
```

### **Hook 設計原則**
1. **單一功能職責** - 每個 Hook 專注於一個特定功能
2. **封裝複雜性** - 隱藏 Controller 調用的複雜性
3. **提供簡潔接口** - 為 UI 提供易用的接口
4. **管理 UI 狀態** - 負責與 UI 相關的狀態管理

```typescript
// ✅ 好的 Hook 設計
function useFeature(params: FeatureParams) {
  const controller = useController()
  const [uiState, setUiState] = useState(initialState)
  
  const action = useCallback(() => {
    return controller.performAction(params)
  }, [controller, params])
  
  return {
    data: controller.getData(params),
    uiState,
    action,
    isLoading: controller.isLoading(params)
  }
}

// ❌ 避免：Hook 包含業務邏輯
function useBadFeature(params: FeatureParams) {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    // ❌ 不應該在 Hook 中實現業務邏輯
    const processData = async () => {
      const rawData = await SomeService.getData(params)
      const processedData = processRawData(rawData) // 業務邏輯
      setData(processedData)
    }
    processData()
  }, [params])
  
  return { data }
}
```

### **Controller 設計原則**
1. **業務邏輯協調** - 協調多個 Service 和 Context
2. **錯誤處理** - 統一處理業務錯誤
3. **狀態管理** - 協調多個 Context 的狀態更新
4. **快取管理** - 實現簡單有效的快取策略

```typescript
// ✅ 好的 Controller 設計
class FeatureController {
  constructor(
    private context1: Context1,
    private context2: Context2,
    private service: FeatureService
  ) {}
  
  async performComplexAction(params: ActionParams): Promise<ActionResult> {
    try {
      // 1. 驗證
      this.validateParams(params)
      
      // 2. 業務邏輯
      const data = await this.service.processAction(params)
      const result = FeatureFactory.createResult(data)
      
      // 3. 狀態協調
      this.context1.updateState(result)
      this.context2.trackAction('action_performed', params)
      
      return result
    } catch (error) {
      this.handleError(error, params)
      throw error
    }
  }
}
```

### **Context 設計原則**
1. **純狀態管理** - 只管理狀態，不包含業務邏輯
2. **簡單操作** - 提供基本的狀態 CRUD 操作
3. **狀態查詢** - 提供簡單的狀態查詢方法
4. **最小接口** - 保持接口簡潔明確

```typescript
// ✅ 好的 Context 設計
interface FeatureContextType {
  // 狀態
  items: FeatureItem[]
  currentItem: FeatureItem | null
  isLoading: boolean
  
  // 純狀態操作
  setItems: (items: FeatureItem[]) => void
  setCurrentItem: (item: FeatureItem | null) => void
  setLoading: (loading: boolean) => void
  
  // 簡單查詢
  getItemById: (id: string) => FeatureItem | undefined
}

// ❌ 避免：Context 包含業務邏輯
interface BadContextType {
  items: FeatureItem[]
  // ❌ 不應該在 Context 中實現業務邏輯
  addItemWithValidation: (item: CreateItemData) => Promise<FeatureItem>
  searchItemsWithFiltering: (query: string, filters: SearchFilters) => FeatureItem[]
}
```

## 🧪 測試策略

### **AgentCommand 測試**
測試指令解析、執行和人類可讀描述：
```typescript
describe('AddTaskCommand', () => {
  it('should execute task creation correctly', async () => {
    const mockFacade = { addTask: jest.fn().mockResolvedValue(mockTask) }
    const command = new AddTaskCommand({ title: 'Test Task' })
    
    const mockPolicy: ApplyPolicy = async (cmd, execute) => {
      await execute()
    }
    
    await command.apply(mockPolicy)
    
    expect(mockFacade.addTask).toHaveBeenCalledWith({ title: 'Test Task' })
  })
  
  it('should provide human readable description', () => {
    const command = new AddTaskCommand({ title: 'Buy milk' })
    expect(command.toHumanReadable()).toBe('新增任務: Buy milk')
  })
})
```

### **SuperController 測試**
測試指令佇列管理和策略選擇：
```typescript
describe('SuperController', () => {
  it('should process commands in queue order', async () => {
    const mockPolicy = jest.fn().mockImplementation(async (cmd, exec) => exec())
    const controller = new SuperController(mockPolicy)
    
    controller.enqueue('ADD_TASK title="First"')
    controller.enqueue('ADD_TASK title="Second"')
    
    await waitFor(() => {
      expect(mockPolicy).toHaveBeenCalledTimes(2)
    })
  })
  
  it('should select appropriate policy for different commands', () => {
    const controller = new SuperController(directApplyPolicy)
    
    // 刪除操作應該使用 Toast 策略
    const deleteCommand = new DeleteTaskCommand({ id: '123' })
    const policy = controller.selectPolicy(deleteCommand)
    
    expect(policy).toBe(toastPolicy)
  })
})
```

### **Hook 測試**
測試 Hook 的 UI 交互邏輯和 Controller 調用：
```typescript
describe('useFeature', () => {
  it('should handle feature action correctly', async () => {
    const mockController = {
      performAction: jest.fn().mockResolvedValue(mockResult),
      getData: jest.fn().mockReturnValue(mockData)
    }
    
    const { result } = renderHook(() => useFeature(mockParams), {
      wrapper: createMockWrapper(mockController)
    })
    
    await act(async () => {
      await result.current.action()
    })
    
    expect(mockController.performAction).toHaveBeenCalledWith(mockParams)
    expect(result.current.data).toEqual(mockData)
  })
})
```

### **Controller 測試**
測試業務邏輯協調和狀態管理：
```typescript
describe('FeatureController', () => {
  it('should coordinate multiple services and contexts', async () => {
    const mockService = { processAction: jest.fn().mockResolvedValue(mockData) }
    const mockContext1 = { updateState: jest.fn() }
    const mockContext2 = { trackAction: jest.fn() }
    
    const controller = new FeatureController(mockContext1, mockContext2, mockService)
    
    const result = await controller.performComplexAction(mockParams)
    
    expect(mockService.processAction).toHaveBeenCalledWith(mockParams)
    expect(mockContext1.updateState).toHaveBeenCalledWith(expect.any(Object))
    expect(mockContext2.trackAction).toHaveBeenCalledWith('action_performed', mockParams)
    expect(result).toBeDefined()
  })
})
```

## 🚀 快速開始

### 1. **創建新功能的完整流程 (AI Agent + UI 支援)**

```bash
# 1. 創建類型定義
touch src/types/newFeature.ts

# 2. 創建 Factory
touch src/lib/NewFeatureFactory.ts

# 3. 創建 Service
touch src/services/NewFeatureService.ts

# 4. 創建 Context
touch src/contexts/NewFeatureContext.tsx

# 5. 在 Controller 中添加業務邏輯
# 編輯 src/controllers/相關Controller.ts

# 6. 創建 AI Agent Command
touch src/ai-agent/commands/NewFeatureCommand.ts

# 7. 註冊到 CommandFactory
# 編輯 src/ai-agent/CommandFactory.ts

# 8. 創建 Hook (UI 支援)
touch src/hooks/useNewFeature.ts

# 9. 在 UI 中使用
# 編輯相關組件文件
```

### 2. **開發檢查清單**

#### AI Agent 支援
- [ ] 每個重要操作都有對應的 AgentCommand
- [ ] Command 提供清晰的 `toHumanReadable()` 描述
- [ ] 危險操作使用 ToastPolicy 需要確認
- [ ] SuperController 正確解析和執行指令
- [ ] Command 可以通過 Controller Facade 調用業務邏輯

#### 傳統 UI 支援
- [ ] UI 組件只調用 Hook，不直接使用 Controller/Context/Service
- [ ] Hook 封裝了所有複雜性，提供簡潔的接口
- [ ] Controller 承擔所有業務邏輯協調
- [ ] Context 只管理狀態，不包含業務邏輯
- [ ] Factory 專注於物件創建和轉換
- [ ] Service 只處理純數據 CRUD

#### 統一要求
- [ ] AI Agent 和 UI 都通過相同的 Controller 執行邏輯
- [ ] 每層都有清晰的測試覆蓋
- [ ] 錯誤處理統一且完善

## 📚 相關文檔

- [**架構設計詳解**](./architecture.md) - 深入了解 AI Agent 架構設計模式和實現細節
- [**AI Agent 實作指南**](./ai-agent-guide.md) - Command Pattern 的具體實作方法
- [**狀態流管理**](./state-flow.md) - 了解數據流和狀態管理機制
- [**專案結構說明**](./project-structure.md) - 詳細的目錄組織和文件職責
- [**程式碼規範**](./coding-standards.md) - 具體的開發規範和最佳實踐
- [**功能規格文檔**](../spec/README.md) - 功能需求和業務邏輯規格

---

💡 **記住**: AI Agent 和 UI 都通過統一的 Controller Facade 執行業務邏輯。這個架構同時支援 AI 動態控制和傳統 UI 互動，讓開發更靈活、維護更容易！ 