# React Context to Zustand Migration Guide

## 🎯 Migration Pattern

這份指南記錄了從 React Context API 遷移到 Zustand 的標準化模式和最佳實踐。

---

## 📋 Migration Checklist

### Phase 1: Analysis
- [ ] 分析現有 Context 的狀態結構
- [ ] 識別 Actions 和 Methods
- [ ] 評估性能需求 (高頻更新 → 適合 Zustand)
- [ ] 確認跨組件使用情況

### Phase 2: Implementation  
- [ ] 創建對應的 Zustand store
- [ ] 保持相同的 API 介面
- [ ] 添加 devtools 支援
- [ ] 實作 TypeScript 類型定義

### Phase 3: Migration
- [ ] 逐步替換 useContext → useStore
- [ ] 移除 Provider 依賴
- [ ] 測試功能一致性
- [ ] 清理舊的 Context 文件

---

## 🛠️ Code Pattern

### Before: React Context Pattern

```typescript
// contexts/ExampleContext.tsx
import { createContext, useContext, useReducer, useCallback, useMemo } from 'react'

interface ExampleState {
  data: string[]
  loading: boolean
  error: string | null
}

type ExampleAction = 
  | { type: 'ADD_DATA'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

const initialState: ExampleState = {
  data: [],
  loading: false,
  error: null
}

function exampleReducer(state: ExampleState, action: ExampleAction): ExampleState {
  switch (action.type) {
    case 'ADD_DATA':
      return { ...state, data: [...state.data, action.payload] }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    default:
      return state
  }
}

interface ExampleContextType extends ExampleState {
  addData: (item: string) => void
  setLoading: (loading: boolean) => void
  clearError: () => void
  processData: () => void
}

const ExampleContext = createContext<ExampleContextType | undefined>(undefined)

export function ExampleProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(exampleReducer, initialState)

  const addData = useCallback((item: string) => {
    dispatch({ type: 'ADD_DATA', payload: item })
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null })
  }, [])

  const processData = useCallback(() => {
    // Complex business logic
  }, [])

  const value = useMemo(() => ({
    ...state,
    addData,
    setLoading,
    clearError,
    processData
  }), [state, addData, setLoading, clearError, processData])

  return (
    <ExampleContext.Provider value={value}>
      {children}
    </ExampleContext.Provider>
  )
}

export function useExample() {
  const context = useContext(ExampleContext)
  if (!context) {
    throw new Error('useExample must be used within ExampleProvider')
  }
  return context
}
```

### After: Zustand Store Pattern

```typescript
// stores/exampleStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface ExampleState {
  // State
  data: string[]
  loading: boolean
  error: string | null
  
  // Actions (Zustand pattern: actions are part of the state)
  addData: (item: string) => void
  setLoading: (loading: boolean) => void
  clearError: () => void
  processData: () => void
}

export const useExampleStore = create<ExampleState>()(
  devtools(
    (set, get) => ({
      // Initial state
      data: [],
      loading: false,
      error: null,

      // Actions
      addData: (item: string) =>
        set((state) => ({
          data: [...state.data, item]
        }), false, 'addData'),

      setLoading: (loading: boolean) =>
        set({ loading }, false, 'setLoading'),

      clearError: () =>
        set({ error: null }, false, 'clearError'),

      processData: () => {
        const state = get()
        // Complex business logic using get() to access current state
        set({ loading: true }, false, 'processData:start')
        
        // ... async operations
        
        set({ loading: false }, false, 'processData:end')
      }
    }),
    { name: 'example-store' } // DevTools store name
  )
)

// Optional: Create selectors for better performance
export const useExampleData = () => useExampleStore((state) => state.data)
export const useExampleLoading = () => useExampleStore((state) => state.loading)
export const useExampleActions = () => useExampleStore((state) => ({
  addData: state.addData,
  setLoading: state.setLoading,
  clearError: state.clearError,
  processData: state.processData
}))
```

---

## 🔄 Component Usage Comparison

### Before: Context Usage
```typescript
function MyComponent() {
  // Requires Provider wrapper
  const { data, loading, addData, processData } = useExample()
  
  return (
    <div>
      {loading && <div>Loading...</div>}
      {data.map(item => <div key={item}>{item}</div>)}
      <button onClick={() => addData('new item')}>Add</button>
      <button onClick={processData}>Process</button>
    </div>
  )
}

// App.tsx needs Provider
function App() {
  return (
    <ExampleProvider>
      <MyComponent />
    </ExampleProvider>
  )
}
```

### After: Zustand Usage
```typescript
function MyComponent() {
  // No Provider needed, can be used anywhere
  const { data, loading, addData, processData } = useExampleStore()
  
  // Or use selectors for better performance
  const data = useExampleData()
  const loading = useExampleLoading()
  const { addData, processData } = useExampleActions()
  
  return (
    <div>
      {loading && <div>Loading...</div>}
      {data.map(item => <div key={item}>{item}</div>)}
      <button onClick={() => addData('new item')}>Add</button>
      <button onClick={processData}>Process</button>
    </div>
  )
}

// App.tsx - no Provider needed
function App() {
  return <MyComponent />
}
```

---

## 📈 Benefits After Migration

### Performance Improvements
- ✅ **Selective Updates**: Only components using changed state re-render
- ✅ **No Provider Re-renders**: Eliminates Provider wrapper re-render issues  
- ✅ **Fine-grained Subscriptions**: Use selectors to subscribe to specific state slices

### Developer Experience  
- ✅ **DevTools Integration**: Built-in Redux DevTools support
- ✅ **Simpler Code**: No Provider setup, useContext boilerplate
- ✅ **Better TypeScript**: Improved type inference and autocomplete
- ✅ **Cross-component Access**: Use store anywhere without drilling

### Maintainability
- ✅ **Less Boilerplate**: No reducer actions, dispatch calls
- ✅ **Clearer Code**: Actions are methods, not action objects
- ✅ **Easier Testing**: Direct store access without Provider mocks

---

## 🚨 Migration Gotchas

### 1. Timing of State Updates
```typescript
// Context: State updates are batched by React
dispatch({ type: 'ADD_ITEM', payload: item })
console.log(state.items) // Still old value

// Zustand: Updates are immediate
addItem(item)
console.log(get().items) // New value immediately available
```

### 2. Async Operations
```typescript
// Context: Need to handle cleanup manually
useEffect(() => {
  let cancelled = false
  fetchData().then(data => {
    if (!cancelled) setData(data)
  })
  return () => { cancelled = true }
}, [])

// Zustand: Handle in actions
const fetchData = async () => {
  set({ loading: true })
  try {
    const data = await api.getData()
    set({ data, loading: false })
  } catch (error) {
    set({ error: error.message, loading: false })
  }
}
```

### 3. Component Lifecycle
```typescript
// Context: Tied to React component lifecycle
// Zustand: Persistent across component mounts/unmounts
```

---

## 📝 Migration Steps Template

1. **Create New Store**
   ```bash
   # Create store file
   touch src/stores/[name]Store.ts
   ```

2. **Map Context to Store**
   - State → Store state
   - Actions → Store methods  
   - Computed values → Derived state or methods

3. **Add DevTools**
   ```typescript
   import { devtools } from 'zustand/middleware'
   ```

4. **Create Selectors** (optional)
   ```typescript
   export const use[Name]Data = () => use[Name]Store(state => state.data)
   ```

5. **Replace Usage**
   - `useContext` → `useStore`
   - Remove Provider wrapping
   - Test functionality

6. **Clean Up**
   - Delete Context file
   - Remove Provider from App
   - Update imports

---

## 🎯 When to Migrate

### ✅ Good Candidates for Zustand:
- High-frequency state updates
- Cross-component state sharing
- Global application state
- Performance-sensitive components
- Simple state structure

### ❌ Keep as React Context:
- Component-scoped state
- Complex lifecycle management
- Deep integration with React features
- Small, stable state

---

*Last updated: 2025-01-22*