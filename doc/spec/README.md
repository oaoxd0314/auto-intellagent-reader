# 📋 專案功能規格文檔

> 簡化的功能規格文檔，專注於核心功能特性和發展方向。技術實作細節請參考 [開發文檔](../dev/README.md)。

## 🎯 文檔結構

### 📱 **專案功能規格**  
- **[project-features.md](./project-features.md)** - 完整的功能規格和互動系統

### 🤖 **AI 智能系統**
- **[ai-intelligence-system.md](./ai-intelligence-system.md)** - 行為分析與智能建議系統

### 🚀 **Library 化發展**
- **[library-development.md](./library-development.md)** - AI-First Behavior Intelligence Library 發展規劃

## 📊 **功能開發狀態**

| 功能模組 | 開發狀態 | 備註 |
|---------|---------|------|
| 文章系統 | ✅ 完成 | MDX 渲染、互動功能 |
| 行為追蹤 | ✅ 完成 | BehaviorStore + EventCollector |
| AI 智能系統 | ⚠️ 待重構 | 行為分析、建議生成、Toast UI (有架構債務) |
| Controller 架構 | ✅ 完成 | Event-Driven Action Handler 系統 |
| Library 化發展 | 🚀 進行中 | AI-First Behavior Intelligence Library |

## 🔍 **如何使用文檔**

### **產品經理 / 專案經理**
- **[project-features.md](./project-features.md)** - 掌握所有功能規格和開發狀態
- **[ai-intelligence-system.md](./ai-intelligence-system.md)** - 理解 AI 智能系統的商業價值
- **[library-development.md](./library-development.md)** - 了解 Library 化發展策略

### **開發人員**
- **[project-features.md](./project-features.md)** - 查看完整的功能架構
- **[ai-intelligence-system.md](./ai-intelligence-system.md)** - 了解 AI 系統實現邏輯
- **[../dev/](../dev/)** - 技術實作細節和 API 設計

### **架構師**
- **[library-development.md](./library-development.md)** - Library 架構設計和抽象策略
- **[ai-intelligence-system.md](./ai-intelligence-system.md)** - AI-First 架構設計理念
- **[../dev/architecture.md](../dev/architecture.md)** - 詳細技術架構

## 🔗 **相關文檔**

### **技術實作**
- [開發文檔](../dev/README.md) - 技術架構和實作指南
- [CLAUDE.md](../../CLAUDE.md) - 專案總覽和開發指令

### **技術規格** (已移至 dev/)
- [文章系統技術規格](../dev/post/) - MDX 處理和互動系統實作
- [AI 系統技術規格](../dev/integration/) - Controller 整合和測試策略
- [UI 組件技術規格](../dev/ui/) - Toast 和介面實作細節
- [策略系統技術規格](../dev/strategy/) - 建議策略和 LLM 整合

### **技術債務管理**
- [技術債務清單](./technical-debt.md) - 當前技術債務、修復計劃和優先級管理

---

**文檔結構優化**: 分離功能規格與技術實作，spec/ 專注功能特性，dev/ 專注技術細節。