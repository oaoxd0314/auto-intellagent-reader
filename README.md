# Auto Intellagent Reader

## 📋 項目概述

基於用戶行為分析的 AI 閱讀助手，通過智能建議提升閱讀體驗。

### 核心功能
- 📖 **Markdown 閱讀器** - 流暢的長文章閱讀體驗
- 🤖 **行為追蹤** - 滾動、停留、選擇等行為分析
- 💡 **智能建議** - 收藏、筆記、總結等個性化建議
- ✨ **非侵入式 UI** - 右下角提示，Accept/Reject 機制

---

## 📊 開發狀態

| 模組 | 狀態 | 完成度 |
|------|------|--------|
| 基礎架構 | ✅ 完成 | 100% |
| 路由系統 | ✅ 完成 | 100% |
| UI 組件 | ✅ 完成 | 100% |
| Markdown 解析 | ✅ 完成 | 100% |
| Event-Driven 架構 | ✅ 完成 | 100% |
| Controller 系統 | ✅ 完成 | 95% |
| Action Handler 模式 | ✅ 完成 | 100% |
| 行為追蹤 | 🚧 開發中 | 60% |
| AI Agent 準備 | ✅ 完成 | 90% |

---

## 🏗️ 系統架構

### Event-Driven Action Handler 架構
```
Hook Layer ↔ Controller Layer ↔ Services Layer
     ↓             ↓                ↓
UI 狀態管理    純 Action Handler   數據 + 緩存 + 業務邏輯
事件監聽      Command Pattern     持久化 + 搜索 + 推薦
executeAction  Event Emitter      完整 Data Layer
```

### AI Agent 準備架構
```
AI Agent → SuperController → ControllerRegistry → xxxController
   ↓            ↓                ↓                    ↓
string cmd   Command Pattern   22 Actions         Event-Driven
"ADD_TASK"   Action Parsing    Action Discovery   State Updates
```

### 統一 Action 調用
```
Hook/Context → executeAction(controller, action, payload) → Events → State Update
```

## 🚀 快速開始

```bash
# 安裝依賴
pnpm install

# 啟動開發服務器
pnpm dev
```

訪問 `http://localhost:5173` 查看應用

---

## 📚 文檔

### 📋 功能規格
- [🎯 功能規格總覽](./doc/spec/features.md) - 完整的功能規劃、開發狀態、六個階段規劃

### 🛠️ 技術文檔
- [📋 系統架構](./doc/dev/architecture.md) - 架構設計、技術棧、數據流
- [🚀 開發指南](./doc/dev/development.md) - 快速開始、貢獻指南、代碼標準
- [📁 文件夾結構](./doc/dev/folder-structure.md) - 項目結構說明
- [🔄 狀態流程](./doc/dev/state-flow.md) - 數據流和狀態管理

## 🎯 下一步

**當前階段: AI Agent SuperController 實現** 🚀

### ✅ 已完成 (重構階段)
- ✅ Event-Driven Action Handler 架構
- ✅ ControllerRegistry 統一管理 (22 Actions)
- ✅ Command Pattern 基礎建立
- ✅ 所有 Controller 轉換為純 Action Handler

### 🚧 技術債務待處理
- [ ] 修復 Controller Registry 初始化時序問題 (FIXME)
- [ ] 改善 executeAction 返回類型推斷 (TODO)

### 🚀 下一個里程碑: SuperController
- [ ] 創建 SuperController 類
- [ ] 實現 AI Agent string command parsing
- [ ] 建立 Action 執行策略 (direct/toast)
- [ ] 整合 OpenRouter API

詳細計劃請參考:
- [Controller 重構狀態](./doc/dev/refactor/controller-refactor-todo.md)
- [功能規格總覽](./doc/spec/features.md)

---

MIT License
