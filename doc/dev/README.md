# 技術開發文檔

歡迎來到 AI Sidebar Suggestion App 的技術開發文檔目錄！

## 📚 文檔導航

### 🏗️ [系統架構](./architecture.md)
- 分層架構原則與責任定義
- 整體架構圖和設計模式
- 技術棧詳解
- 數據流設計

### 📁 [文件夾結構](./folder-structure.md)
- 項目目錄規範
- 命名規則
- 分層架構說明
- 最佳實踐指南

### 🔄 [狀態流架構](./state-flow.md)
- 完整資料流設計
- 狀態管理架構
- 分層職責說明
- 擴展性設計

### 🚀 [開發指南](./development.md)
- 快速開始指南
- 貢獻規範
- 代碼標準
- 測試指南
- 常見問題解答

### 🎮 [核心控制器](./core-controller/)
- 控制器設計模式
- 抽象控制器實現
- 具體控制器示例

### 🛣️ [路由系統](./routing/)
- 路由架構設計
- 文件系統路由
- 動態路由處理

## 🔍 快速查找

| 主題 | 文檔 | 主要內容 |
|------|------|----------|
| 架構設計 | [architecture.md](./architecture.md) | 分層架構、設計模式、技術棧 |
| 文件夾結構 | [folder-structure.md](./folder-structure.md) | 目錄規範、命名規則、分層架構 |
| 狀態流架構 | [state-flow.md](./state-flow.md) | 資料流設計、狀態管理、分層職責 |
| 開發環境 | [development.md](./development.md) | 環境設置、代碼規範、測試 |
| 控制器系統 | [core-controller/](./core-controller/) | 控制器架構、實現細節 |
| 路由系統 | [routing/](./routing/) | 路由設計、實現方式 |

## 🎯 分層架構快速參考

```
UI Components → Context → Controller → Service
     ↑            ↓         ↓           ↓
   Render    State Mgmt  Business   Data Layer
   Update    & Events    Logic      Operations
```

### 責任分工
- **Context 層**: React 狀態管理和 UI 邏輯
- **Controller 層**: 協調業務邏輯和流程控制
- **Service 層**: 專注數據操作和持久化

## 📝 文檔維護

這些技術文檔會隨著架構演進持續更新。如果你發現任何過時或不準確的信息，請提交 Issue 或 Pull Request。

## 🤝 貢獻指南

歡迎貢獻技術文檔改進！請遵循以下原則：

1. **技術準確性** - 確保技術細節正確無誤
2. **架構一致性** - 遵循分層架構原則
3. **代碼示例** - 提供實際的代碼範例
4. **及時更新** - 確保文檔與代碼同步
5. **清晰結構** - 使用清晰的標題和結構

---

📋 查看 [功能規格文檔](../spec/) | 🏠 返回 [主 README](../../README.md) 