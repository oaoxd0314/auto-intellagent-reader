# 🚀 Controller-Facade 簡化架構開發指南

歡迎來到 auto-intellagent-reader 專案！這是一個採用 **Controller-Facade Pattern** 的現代化 React 應用，專為靜態 MDX 文件閱讀和互動而設計。

## 🎯 架構核心理念

### **「UI 只與 Hook 交互」**
UI 組件完全不需要了解業務邏輯的實現細節，所有複雜性都被封裝在 Hook 內部。

### **「Controller 是真正的髒地方」**
Controller 承擔所有業務邏輯協調，是真正的 Facade Pattern 實現。

### **「每層職責單一且明確」**
- **Hook**: UI 狀態管理 + Controller 調用
- **Controller**: 業務邏輯協調 (Facade)
- **Context**: 純狀態管理
- **Factory**: 物件創建和轉換
- **Services**: 純數據 CRUD

## 🏗️ 簡化架構概覽

```
UI Components ← → Hook (唯一交互層)
                  ↓
              Controller (業務邏輯)
                  ↓
          Context/Factory/Services
```

這個簡化架構專為靜態文件場景優化，提供最佳的開發體驗和維護性。

## 🛠️ 開發工作流

### 1. **新增 UI 功能**

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

### 2. **新增業務邏輯**

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

### 3. **新增數據類型**

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

### 4. **新增 Context 狀態**

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
├── hooks/           # UI 交互層 - Hook 實現
├── controllers/     # 業務邏輯層 - Controller 實現  
├── contexts/        # 狀態管理層 - Context 實現
├── lib/            # 工廠層 - Factory 實現
├── services/       # 數據層 - Service 實現
├── types/          # 類型定義
└── components/     # UI 組件
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

### 1. **創建新功能的完整流程**

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

# 6. 創建 Hook
touch src/hooks/useNewFeature.ts

# 7. 在 UI 中使用
# 編輯相關組件文件
```

### 2. **開發檢查清單**

- [ ] UI 組件只調用 Hook，不直接使用 Controller/Context/Service
- [ ] Hook 封裝了所有複雜性，提供簡潔的接口
- [ ] Controller 承擔所有業務邏輯協調
- [ ] Context 只管理狀態，不包含業務邏輯
- [ ] Factory 專注於物件創建和轉換
- [ ] Service 只處理純數據 CRUD
- [ ] 每層都有清晰的測試覆蓋

## 📚 相關文檔

- [**架構設計詳解**](./architecture.md) - 深入了解架構設計模式和實現細節
- [**狀態流管理**](./state-flow.md) - 了解數據流和狀態管理機制
- [**目錄結構說明**](./folder-structure.md) - 詳細的目錄組織和文件職責
- [**開發指南**](./development.md) - 具體的開發規範和最佳實踐

---

💡 **記住**: UI 只與 Hook 交互，Controller 作為真正的 Facade 協調所有業務邏輯。這個簡化架構讓開發更直觀、維護更容易！ 