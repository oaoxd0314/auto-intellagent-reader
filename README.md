# AI Sidebar Suggestion App

## 📋 項目概述

AI Sidebar Suggestion App 是一個智能閱讀助手，通過觀察用戶閱讀行為，即時提供個性化建議。


### 核心功能
- 📖 **智能閱讀** - 基於 markdown 的長文章閱讀體驗
- 🤖 **AI 建議** - 實時分析用戶行為，提供個性化建議
- 🎯 **行為感知** - 監聽滾動、停留、選擇等用戶行為
- 💡 **智能推薦** - 書籤、相關文章、可分享佳句等建議

---

## 📊 開發狀態

| 模組 | 狀態 | 完成度 |
|------|------|--------|
| 基礎架構 | ✅ 完成 | 100% |
| 路由系統 | ✅ 完成 | 100% |
| UI 組件 | ✅ 完成 | 100% |
| Markdown 解析 | 🚧 開發中 | 0% |
| AI 建議系統 | 🚧 開發中 | 0% |

---

## 📚 文檔

詳細的技術文檔請查看 [`/spec`](./spec/) 目錄：

- [📋 系統架構](./spec/architecture.md) - 架構設計、技術棧、數據流
- [🎯 功能規格](./spec/features.md) - 功能規劃、開發狀態、未來規劃
- [🚀 開發指南](./spec/development.md) - 快速開始、貢獻指南、代碼標準

---

## 🏗️ 系統架構簡圖

```
User Events → Controller → AI Strategies → UI Render
     ↓              ↓            ↓           ↓
  滾動/懸停    狀態管理    建議生成    動態展示
  選擇/停留    事件處理    策略選擇    用戶反饋
```

## 🚀 快速開始

```bash
# 安裝依賴
pnpm install

# 啟動開發服務器
pnpm dev
```

訪問 `http://localhost:5173` 查看應用


MIT License
