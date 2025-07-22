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
| Event-Driven 架構 | ✅ 完成 | 100% |
| Controller 系統 | ✅ 完成 | 100% |
| 行為事件收集 | ✅ 完成 | 100% |
| AI Agent 基礎 | 🚧 開發中 | 20% |

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

**當前階段: Natural LLM Integration** 🚀

### ✅ 已完成 
- ✅ Event-Driven Action Handler 架構
- ✅ ControllerRegistry 統一管理 (22 Actions)
- ✅ 行為事件收集系統 (BehaviorEventCollector)
- ✅ Zustand 狀態管理遷移

### 🚧 進行中: AI Agent 智能建議系統
**目標**: 基於行為分析提供智能操作建議

**下一步**: 
1. 實作 AI 行為分析引擎
2. 建議生成和隊列管理 
3. Toast UI 非侵入式建議展示

詳細規格請參考:
- [AI 行為分析架構](./doc/spec/ai-behavior-architecture.md)
- [系統架構文檔](./doc/dev/architecture.md)

---

MIT License
