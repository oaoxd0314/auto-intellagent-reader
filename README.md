# Auto Intellagent Reader

## 📋 項目概述

基於用戶行為分析的 AI 閱讀助手，通過智能建議提升閱讀體驗。

### 核心功能
- 📖 **Markdown 閱讀器** - 流暢的長文章閱讀體驗
- 🤖 **智能行為分析** - 實時監聽滾動、停留、選擇等用戶行為
- 💡 **AI 智能建議** - 基於 OpenRouter API 的個性化建議系統
- ✨ **非侵入式 UI** - 右下角 Toast 提示，Accept/Reject/Dismiss 機制
- 🧠 **混合智能引擎** - AI 分析 + 規則引擎的雙重保障

---

## 📊 開發狀態

| 模組 | 狀態 | 完成度 |
|------|------|--------|
| 基礎架構 | ✅ 完成 | 100% |
| Event-Driven 架構 | ✅ 完成 | 100% |
| Controller 系統 | ✅ 完成 | 100% |
| 行為事件收集 | ✅ 完成 | 100% |
| **AI 智能建議系統** | ✅ **完成** | **100%** |
| 狀態管理優化 | ✅ 完成 | 100% |
| Toast UI 交互 | ✅ 完成 | 100% |

**🎉 系統已完全就緒，可立即體驗智能閱讀建議！**

---

## 🏗️ 系統架構

### AI 智能建議完整架構
```
用戶行為 → BehaviorTracker → BehaviorEventCollector → BehaviorStore
    ↓
定時分析 → AIAgentController → OpenRouter API / Mock Fallback
    ↓
智能洞察 → AISuggestionController → AISuggestionStore (Zustand)
    ↓
Toast UI → 用戶交互 → Action 執行 → ControllerRegistry
```

### Event-Driven Action Handler 架構
```
Hook Layer ↔ Controller Layer ↔ Services Layer
     ↓             ↓                ↓
UI 狀態管理    純 Action Handler   數據 + 緩存 + 業務邏輯
事件監聽      Command Pattern     持久化 + 搜索 + 推薦
executeAction  Event Emitter      完整 Data Layer
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

### 🤖 AI 功能配置 (可選)

```bash
# .env.local (可選 - 不配置會使用智能 mock)
VITE_OPENROUTER_API_KEY=your_api_key_here
VITE_OPENROUTER_MODEL=openai/gpt-4o-mini
```

訪問 `http://localhost:5173` 查看應用

### 🧪 體驗 AI 智能建議

1. 訪問任意文章頁面 `/posts/getting-started`
2. 進行閱讀行為：滾動、停留、選擇文字
3. 30秒後觀察右下角的智能建議 Toast
4. 嘗試不同的閱讀模式：
   - **快速瀏覽** → 收藏建議
   - **正常閱讀** → 標記建議  
   - **深度學習** → 筆記建議

---

## 📚 文檔

### 📋 功能規格
- [🎯 功能規格總覽](./doc/spec/features.md) - 完整的功能規劃、開發狀態
- [🤖 AI 行為系統](./doc/spec/ai-behavior-system.md) - AI 智能建議系統設計
- [🗺️ AI 實施狀況](./doc/spec/ai-behavior-roadmap.md) - 完整測試指南

### 🛠️ 技術文檔
- [📋 系統架構](./doc/dev/architecture.md) - 架構設計、技術棧、數據流
- [🚀 開發指南](./doc/dev/README.md) - 快速開始、貢獻指南、代碼標準
- [📁 項目結構](./doc/dev/project-structure.md) - 文件夾結構說明
- [🔄 狀態流程](./doc/dev/state-flow.md) - 數據流和狀態管理

## 🎯 當前狀況與下一步

**當前階段: 🎉 AI 智能建議系統完全就緒** 

### ✅ 已完成 
- ✅ Event-Driven Action Handler 架構
- ✅ ControllerRegistry 統一管理 (多個 Actions)
- ✅ 行為事件收集系統 (BehaviorEventCollector)
- ✅ Zustand 狀態管理遷移
- ✅ **AI 智能建議系統完整實現**
  - AIAgentController (行為分析 + OpenRouter API)
  - AISuggestionController (建議生成 + 隊列管理)
  - AISuggestionStore (Zustand 狀態管理)
  - Toast UI (智能顯示 + 用戶交互)
  - 自動初始化和定時任務系統

### 🚀 系統特色
- **真實 AI 整合**: 支援 OpenRouter API 真實 AI 分析
- **智能 Fallback**: 無 API 時自動使用 mock 分析
- **無狀態架構**: Controller 純邏輯，Zustand 管理狀態
- **類型安全**: 完整 TypeScript 類型定義
- **自動化**: 系統自動啟動、定時分析、智能建議

### 🎯 可能的後續改進方向
1. **個性化學習**: 基於用戶偏好調整建議策略
2. **更多建議類型**: 搜尋相關文章、創建摘要等
3. **性能優化**: 大數據處理、複雜場景優化
4. **多語言支援**: 國際化和本地化
5. **高級 AI 功能**: 文章總結、知識圖譜等

**🎉 系統已完全準備就緒，立即體驗智能閱讀助手！**

---

MIT License
