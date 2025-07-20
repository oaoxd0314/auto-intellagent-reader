# 技術債務管理

## 📋 當前技術債務清單

### 🔥 高優先級

#### 1. Controller Registry 初始化時序問題
**標記:** FIXME  
**狀態:** 待修復  
**描述:** Registry 應該在所有組件掛載前完成初始化，目前使用 polling workaround

**影響範圍:**
- `src/hooks/useControllerRegistry.ts:24` - 使用 50ms polling 等待初始化
- `src/contexts/PostContext.tsx:140` - Controller 可能為 null 的保護檢查
- `src/hooks/usePostPage.ts:27, 184` - usePostsList 和 usePostDetail 的時序檢查

**當前 Workaround:**
```typescript
// 使用 polling 機制等待 AppInitializer 完成
const pollInterval = setInterval(() => {
    if (AppInitializer.isInitialized()) {
        const registryInstance = AppInitializer.getControllerRegistry()
        setRegistry(registryInstance)
        setIsReady(true)
        clearInterval(pollInterval)
    }
}, 50)
```

**推薦解決方案:**

#### 選項 1: Suspense 邊界 (推薦)
```typescript
// App.tsx
function App() {
  return (
    <Suspense fallback={<AppInitializingSpinner />}>
      <AppInitializerBoundary>
        <BrowserRouter>
          <ProviderComposer providers={providers}>
            {/* ... */}
          </ProviderComposer>
        </BrowserRouter>
      </AppInitializerBoundary>
    </Suspense>
  )
}

// AppInitializerBoundary.tsx
function AppInitializerBoundary({ children }) {
  const [isReady, setIsReady] = useState(false)
  
  useEffect(() => {
    AppInitializer.initialize().then(() => setIsReady(true))
  }, [])
  
  if (!isReady) {
    throw new Promise(resolve => {
      // Suspense will catch this
    })
  }
  
  return children
}
```

#### 選項 2: React Context 改進
```typescript
// 創建 AppInitializationContext 提供全局初始化狀態
const AppInitializationContext = createContext<{
  isInitialized: boolean
  registry: ControllerRegistry | null
}>()
```

#### 選項 3: AppInitializer 改進
```typescript
// 讓 AppInitializer 提供初始化完成的 Promise
class AppInitializer {
  private static initializationPromise: Promise<void> | null = null
  
  static async waitForInitialization(): Promise<void> {
    return this.initializationPromise || this.initialize()
  }
}
```

**預計工作量:** 4-6 小時  
**風險評估:** 低 - 不會影響現有功能，只是改善架構

---

### 🟡 中優先級

#### 2. executeAction 返回類型推斷問題
**標記:** TODO  
**狀態:** 需改善  
**描述:** executeAction 返回類型需要基於 action 類型進行更精確的推斷，目前使用 `as any` workaround

**影響範圍:**
- `src/contexts/PostContext.tsx:258, 276, 292` - 三處 `as any` 類型斷言

**當前 Workaround:**
```typescript
const result = await executeAction('PostController', 'SEARCH_POSTS', {
    query: filters.searchTerm || '',
    filters
}) as any // TODO: Fix type inference
```

**推薦解決方案:**

#### 類型映射改進
```typescript
// 定義 Action 返回類型映射
interface ControllerActionMap {
  PostController: {
    'GET_RECOMMENDATIONS': { recommendations: Post[] }
    'SEARCH_POSTS': { results: Post[] }
    'LOAD_POSTS': { posts: Post[] }
    'LOAD_POST': { post: Post }
    // ...
  }
  InteractionController: {
    'ADD_COMMENT': { interaction: PostInteraction }
    'ADD_HIGHLIGHT': { interaction: PostInteraction }
    // ...
  }
}

// 改進 executeAction 簽名
function executeAction<
  C extends keyof ControllerActionMap,
  A extends keyof ControllerActionMap[C]
>(
  controllerName: C,
  actionType: A,
  payload?: any
): Promise<ControllerActionMap[C][A]>
```

**預計工作量:** 2-3 小時  
**風險評估:** 低 - 純類型改善，不影響運行時行為

---

## 📈 技術債務指標

### 當前狀況
- **總 FIXME:** 3 個
- **總 TODO:** 4 個  
- **總 HACK:** 0 個
- **高優先級債務:** 1 個
- **中優先級債務:** 1 個

### 目標
- **下週目標:** 解決高優先級時序問題
- **月度目標:** 清理所有 TODO 標記
- **長期目標:** 保持零 HACK 標記

## 🔄 債務處理流程

1. **識別階段:** 使用 FIXME/TODO/HACK 標記
2. **分類階段:** 評估優先級和影響範圍
3. **規劃階段:** 估算工作量和風險
4. **執行階段:** 按優先級順序處理
5. **驗證階段:** 確保修復不引入新問題

## 📊 債務預防策略

### Code Review 檢查點
- [ ] 新 PR 不引入 HACK 標記
- [ ] TODO 必須有明確的處理計劃
- [ ] FIXME 必須在下一個迭代處理

### 自動化檢查
```bash
# 在 CI 中檢查技術債務數量
grep -r "FIXME\|TODO\|HACK" src/ | wc -l
```

### 定期檢視
- **每週:** 檢視高優先級債務進度
- **每月:** 整體債務狀況評估
- **每季:** 債務預防策略調整