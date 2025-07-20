# 架構重構計劃

## 🎯 目標

重構現有的 Controller-Context-Hook 架構，為 AI Agent 系統奠定基礎，實現清晰的職責分離和事件驅動架構。

## 🔍 現狀問題

### 1. Controller Interface 混亂
- 同時負責狀態管理和業務邏輯
- Hook 直接從 Controller 獲取狀態，繞過 Context
- 例如：`controller.getLoadingState()`, `controller.getCachedPosts()`

### 2. 職責不清
```typescript
// 現狀：混亂的數據流
Hook → Controller.getState() + Context.state
Hook → Controller.actions()
```

### 3. 阻礙 AI Agent 架構
- SuperController 無法統一管理各 Controller
- 狀態分散在多處難以統一控制

## 🎯 目標架構

### 理想數據流
```typescript
UI Hook → Context (狀態) → Controller (純 Actions) → Service
```

### 核心原則
1. **Controller = 純 Action Handler**
   - 只處理 `executeAction(type, payload)`
   - 通過事件通知狀態變更
   - 不暴露狀態獲取方法

2. **Context = 統一狀態管理**
   - 監聽 Controller 事件
   - 更新和提供狀態給 Hook
   - 單一數據源

3. **為 AI Agent 準備**
   - SuperController 統一調用各 Controller actions
   - 事件驅動的命令執行
   - 統一的狀態更新機制

## 📋 實施階段

### 階段 1: Event-Driven Interface 設計
- [ ] 分析現有 AbstractController 事件系統
- [ ] 設計標準化的 Action Handler Interface
- [ ] 定義事件規範和狀態更新流程

### 階段 2: PostController 重構
- [ ] 移除狀態獲取方法 (`getCachedPosts`, `getLoadingState` 等)
- [ ] 轉換為純 Action Handler 模式
- [ ] 重新設計事件發送機制

### 階段 3: PostContext 優化
- [ ] 統一接收 Controller 事件
- [ ] 整合所有狀態管理
- [ ] 簡化 Hook 介面

### 階段 4: Hook 層簡化
- [ ] 移除直接 Controller 調用
- [ ] 只通過 Context 獲取狀態和觸發 Actions
- [ ] 統一事件處理

### 階段 5: SuperController 基礎
- [ ] 實現統一 Action 調度
- [ ] 建立 Command Pattern 基礎
- [ ] 為 AI Agent 準備介面

## 🔗 相關文檔

- [Controller 重構 TODO](./controller-refactor-todo.md)
- [Event-Driven 架構設計](./event-driven-design.md)
- [AI Agent 整合計劃](./ai-agent-integration.md)

## 📊 下一步行動

**當前優先級:** Controller Event-Driven Interface 分析和設計

**對應 AI Agent 架構:** 為 SuperController 統一調度各 Controller 做準備