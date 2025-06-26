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
| 分層架構 | ✅ 完成 | 100% |
| 控制器系統 | ✅ 完成 | 80% |
| 行為追蹤 | 🚧 開發中 | 60% |
| AI 建議系統 | 🚧 開發中 | 30% |

---

## 📚 文檔

### 功能規格
詳細的功能規格請查看 [`/doc/spec`](./doc/spec/) 目錄：
- [🎯 功能規格](./doc/spec/features.md) - 功能規劃、開發狀態、未來規劃
- [📖 規格說明](./doc/spec/README.md) - 整體規格概述

### 技術文檔
詳細的技術文檔請查看 [`/doc/dev`](./doc/dev/) 目錄：
- [📋 系統架構](./doc/dev/architecture.md) - 架構設計、技術棧、數據流
- [🚀 開發指南](./doc/dev/development.md) - 快速開始、貢獻指南、代碼標準
- [📁 文件夾結構](./doc/dev/folder-structure.md) - 項目結構說明
- [🔄 狀態流程](./doc/dev/state-flow.md) - 數據流和狀態管理

---

## 🏗️ 系統架構

### 分層架構
```
UI Components → Context → Controller → Service
     ↑            ↓         ↓           ↓
   Render    State Mgmt  Business   Data Layer
   Update    & Events    Logic      Operations
```

### 事件驅動流程
```
User Events → Context → Controller → AI Strategies → UI Render
     ↓           ↓          ↓            ↓           ↓
  滾動/懸停   React狀態   業務邏輯    建議生成    動態展示
  選擇/停留   事件處理   流程控制    策略選擇    用戶反饋
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

- [🎯 功能規格](./spec/features.md) - 完整的功能規劃和開發里程碑
- [🏗️ 控制器架構](./spec/core-controller/README.md) - AI 輔助系統技術規格
- [📋 系統架構](./spec/architecture.md) - 整體架構設計

## 🎯 下一步

**Phase 2: AI 輔助系統核心**
- [ ] 實作 EventTracker 行為追蹤
- [ ] 建立 AgentController 建議引擎  
- [ ] 創建 SuggestionHint 提示組件

MIT License
