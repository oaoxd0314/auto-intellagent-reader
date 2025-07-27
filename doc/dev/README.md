# 🛠️ 開發規範與約定

> 本目錄專注於 **通用的開發約定和架構原則**，不包含具體功能實現細節。

---

## 🎯 文檔定位

### **doc/dev/ 的職責範圍**
只包含 **general** 的技術約定和架構原則：
- 📐 通用架構設計原則
- 📝 代碼規範和約定  
- 📁 專案結構組織規範

### **具體功能設計文檔位置**
具體的功能和實現設計請參考：
- 📋 [../spec/](../spec/) - 功能規格和具體設計文檔

---

## 📚 文檔列表

### 🏗️ **架構設計原則**
- **[architecture.md](./architecture.md)** - Event-Driven Action Handler 架構
  - 核心架構概覽和 AI Agent 準備
  - 分層架構設計 (Hook/Controller/Services)
  - 核心設計模式 (Command/Facade/Mediator/Strategy)
  - 數據流運作機制和架構優勢

### 📝 **開發規範約定**
- **[conventions.md](./conventions.md)** - 統一開發規範
  - TypeScript 開發規範 (類型優先、禁用語法)
  - React 開發規範 (組件設計、Hook 模式、性能優化)
  - 架構設計約定 (分層職責、設計模式、依賴方向)
  - 文件組織約定 (命名規範、目錄結構、導入導出)
  - 代碼品質約定 (技術債務管理、錯誤處理、測試約定)
  - 文檔約定和性能約定

### 📁 **專案結構規範**
- **[project-structure.md](./project-structure.md)** - 目錄結構組織
  - 各層目錄詳解和職責劃分
  - 文件命名規範和組織原則
  - 依賴關係管理和禁止模式
  - 開發工作流和重構指南

---

## 🎯 架構核心理念

### **Event-Driven Action Handler 架構**
- ✅ **已完成重構**: Controller 系統完全轉換為純 Action Handler
- ✅ **統一接口**: 所有 Controllers 實現 `executeAction(actionType, payload)` 接口  
- ✅ **ControllerRegistry**: 22 個 Actions 可用，3 個 Controllers 統一管理
- ✅ **事件驅動**: Hook ↔ Controller ↔ Services 的清晰數據流

### **分層職責清晰**
```
UI Components → Hook (UI 狀態) → Controller (Action Handler) → Context/Services
                                      ↓
                              ControllerRegistry (統一調度)
                                      ↓
                      未來: AI Agent SuperController
```

### **設計原則**
- **單一職責**: 每層都有明確的職責邊界
- **事件驅動**: 通過事件實現解耦通訊
- **統一接口**: executeAction 模式為 AI Agent 做準備
- **可測試性**: 每層都可以獨立測試

---

## 🚀 開發工作流

### **開發前準備**

#### 📖 **必讀文檔**
1. [architecture.md](./architecture.md) - 理解整體架構
2. [conventions.md](./conventions.md) - 掌握開發規範
3. [project-structure.md](./project-structure.md) - 了解目錄組織

#### 🎯 **功能開發指引**
- 具體功能設計和實現細節請參考 [../spec/](../spec/)
- AI 相關功能請參考 [../spec/implementing-ai-features.md](../spec/implementing-ai-features.md)
- 狀態管理設計請參考 [../spec/state-flow.md](../spec/state-flow.md)

### **標準開發流程**

#### 1. **架構檢查**
- ✅ 確認功能符合 Event-Driven Action Handler 原則
- ✅ 驗證分層職責劃分 (Hook → Controller → Services)
- ✅ 檢查是否需要新的 Action 註冊到 ControllerRegistry

#### 2. **規範遵循**
- ✅ TypeScript 嚴格模式，禁用 `any`，優先使用 `type`
- ✅ React 函數組件 + Hooks 模式
- ✅ 文件命名和目錄組織符合約定
- ✅ 適當標記技術債務 (FIXME/TODO/HACK)

#### 3. **實現驗證**
- ✅ 所有新 Action 通過 executeAction 接口調用
- ✅ 事件驅動通訊正常運作
- ✅ Hook 正確封裝業務邏輯調用
- ✅ UI 組件只調用 Hook，不直接操作 Controller/Context/Service

---

## 📊 當前系統狀態

### **✅ 架構完成度**
- **Event-Driven Action Handler**: 100% 完成
- **ControllerRegistry 統一調度**: 22 個 Actions，3 個 Controllers
- **統一 executeAction 接口**: 所有 Controllers 實現
- **分層架構**: Hook → Controller → Services 完整實現

### **📋 開發指標**
- **Controllers**: PostController (11), InteractionController (6), AIAgentController (5)
- **代碼規範**: TypeScript 嚴格模式，React Hooks 模式
- **技術債務**: 定期追蹤和管理 (詳見 [../spec/technical-debt.md](../spec/technical-debt.md))

### **🔮 架構擴展性**
- **AI Agent 準備**: 統一 executeAction 接口已就位
- **事件驅動通訊**: 跨 Controller 事件訂閱機制完整
- **可測試性**: 每層都支持獨立測試

---

## 📋 核心原則速查

### **架構原則** (詳見 [architecture.md](./architecture.md))
- **分層職責**: UI → Hook → Controller → Context/Services
- **事件驅動**: executeAction 統一接口
- **單一職責**: 每層邊界清晰
- **解耦設計**: 事件通訊，避免直接依賴

### **開發規範** (詳見 [conventions.md](./conventions.md))
- **TypeScript**: 嚴格模式，禁用 `any`，優先 `type`
- **React**: 函數組件 + Hooks，適當使用 memo/callback
- **架構**: 組件不直接操作 Controller/Context/Service
- **品質**: FIXME/TODO/HACK 標記，測試覆蓋

### **文件組織** (詳見 [project-structure.md](./project-structure.md))
- **目錄結構**: hooks/controllers/contexts/lib/services
- **命名約定**: PascalCase 組件，camelCase hooks
- **依賴方向**: 單向依賴，禁止循環引用
- **導入順序**: React → 類型 → 內部 hooks → 組件 → 樣式

---

## 🔧 開發工具和檢查

### **代碼品質檢查**
```bash
# 開發伺服器
pnpm dev

# 代碼檢查
pnpm lint

# 類型檢查
pnpm typecheck

# 運行測試
pnpm test

# 構建檢查
pnpm build
```

### **架構驗證清單**
- ✅ 新 Action 已註冊到對應 Controller
- ✅ Hook 正確封裝 Controller 調用
- ✅ UI 組件只調用 Hook
- ✅ 事件驅動通訊正常
- ✅ 遵循 TypeScript 和 React 規範

### **技術債務追蹤**
- 當前狀況請參考 [../spec/technical-debt.md](../spec/technical-debt.md)
- 使用 FIXME/TODO/HACK 標記問題
- 定期檢視和處理債務

---

## 🚀 新手快速上手

### **第一步：理解架構**
1. 📖 閱讀 [architecture.md](./architecture.md) - 掌握核心架構
2. 📋 了解分層職責：UI → Hook → Controller → Services
3. ⚡ 熟悉 executeAction 統一接口

### **第二步：學習規範**
1. 📝 研讀 [conventions.md](./conventions.md) - 代碼規範
2. 📁 理解 [project-structure.md](./project-structure.md) - 目錄組織
3. 🎯 掌握命名約定和依賴規則

### **第三步：開始開發**
1. 🔍 查看 [../spec/](../spec/) 了解具體功能設計
2. 🏗️ 按照分層架構實現功能
3. ✅ 確保代碼符合規範
4. 🧪 編寫相應測試

### **開發檢查清單**
- [ ] 理解 Event-Driven Action Handler 架構
- [ ] 掌握 TypeScript 和 React 開發規範  
- [ ] 了解目錄結構和文件組織
- [ ] 能夠通過 Hook 調用 Controller Actions
- [ ] 遵循技術債務管理流程

---

## 🔗 相關文檔導航

### **📐 本目錄 (General 約定)**
- [architecture.md](./architecture.md) - 通用架構設計原則
- [conventions.md](./conventions.md) - 統一開發規範約定
- [project-structure.md](./project-structure.md) - 專案結構組織規範

### **📋 具體功能和設計**
- [../spec/](../spec/) - 功能規格和具體設計文檔
  - [state-flow.md](../spec/state-flow.md) - 狀態流設計
  - [implementing-ai-features.md](../spec/implementing-ai-features.md) - AI 功能實現
  - [technical-debt.md](../spec/technical-debt.md) - 技術債務狀況
  - [ai-intelligence-system.md](../spec/ai-intelligence-system.md) - AI 智能系統
  - [project-features.md](../spec/project-features.md) - 專案功能列表

---

💡 **明確分界**: `doc/dev/` 專注通用約定，`doc/spec/` 包含具體設計。這樣分工更清晰，維護更容易！