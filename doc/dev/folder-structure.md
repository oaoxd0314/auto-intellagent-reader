# 項目文件夾結構規範

## 🏗️ **整體架構原則**

本項目採用 **分層架構** 和 **關注點分離** 的設計原則，參考現代 React 生態系統的最佳實踐。

## 📁 **根目錄結構**

```
auto-intellagent-reader/
├── src/                    # 📁 源代碼目錄
├── spec/                   # 📁 項目規範和文檔
├── public/                 # 📁 靜態資源
├── package.json            # 📄 項目配置
├── vite.config.ts          # 📄 Vite 配置
├── tailwind.config.js      # 📄 Tailwind CSS 配置
└── tsconfig.json           # 📄 TypeScript 配置
```

## 📂 **src/ 目錄詳細結構**

```
src/
├── pages/                  # 📁 UI Components 層 - 頁面和組件
│   └── posts/              # 📁 文章相關頁面（動態路由）
├── components/             # 📁 可重用 UI 組件
│   └── ui/                 # 📁 基礎 UI 組件庫
├── contexts/               # 📁 Context 層 - React 狀態管理
├── controllers/            # 📁 Controller 層 - 業務邏輯協調
├── services/               # 📁 Service 層 - 數據操作和持久化
├── types/                  # 📁 TypeScript 類型定義
├── lib/                    # 📁 工具庫和工廠類
├── content/                # 📁 靜態內容文件 (MDX)
├── router/                 # 📁 路由配置
└── ...                     # 📁 其他配置文件
```

## 🎯 **目錄職責說明**

### 📁 **components/**
**職責：** 可重用的 UI 組件
- **原則：** 純展示組件，不包含業務邏輯
- **命名：** PascalCase，如 `UserProfile.tsx`
- **子目錄：**
  - `ui/` - 基礎 UI 組件（按鈕、卡片等）
  - 根目錄 - 業務相關組件

### 📁 **pages/**
**職責：** 頁面級組件
- **原則：** 對應路由的頁面組件
- **命名：** camelCase 或 PascalCase
- **結構：** 支援嵌套目錄對應嵌套路由

### 📁 **services/**
**職責：** 對外業務服務接口
- **原則：** 提供統一的 API 接口，處理錯誤和邊界情況
- **命名規範：** `xxxService.ts`
- **特點：** 
  - 靜態類方法
  - 統一錯誤處理
  - 對外暴露的服務接口

### 📁 **lib/**
**職責：** 核心業務邏輯和工具類
- **原則：** 不直接對外暴露，被 services 層調用
- **包含：**
  - Factory 類（如 `MarkdownFactory`）
  - 核心業務邏輯
  - 複雜工具類
- **特點：** 專注於具體實現細節

### 📁 **types/**
**職責：** TypeScript 類型定義
- **原則：** 集中管理類型，便於重用和維護
- **命名：** 按功能模塊分組
- **導出：** 使用 `export type` 或 `export interface`

### 📁 **content/**
**職責：** 靜態內容文件
- **原則：** 存放 MDX、JSON 等內容文件
- **結構：** 按內容類型分組
- **特點：** 可被動態導入和處理

### 📁 **router/**
**職責：** 路由配置
- **原則：** 集中管理路由定義
- **特點：** 與 pages 目錄結構對應

## 🔄 **數據流架構**

```
Pages → Services → Lib → Content
  ↓        ↓        ↓       ↓
UI組件   業務接口   核心邏輯  數據源
```

### **層級說明：**
1. **Pages** - 頁面組件，調用 Services
2. **Services** - 業務服務，提供統一接口
3. **Lib** - 核心邏輯，具體實現
4. **Content** - 數據源，MDX 文件

## 📋 **命名規範**

### **文件命名：**
- **組件：** PascalCase (如 `UserProfile.tsx`)
- **服務：** xxxService.ts (如 `PostService.ts`)
- **工具類：** camelCase.ts (如 `utils.ts`)
- **類型：** camelCase.ts (如 `post.ts`)

### **目錄命名：**
- **小寫 + 連字符：** `folder-name/`
- **camelCase：** `folderName/` (React 慣例)

### **類和接口命名：**
- **類：** PascalCase (如 `PostService`)
- **接口：** PascalCase (如 `Post`)
- **類型別名：** PascalCase (如 `PostFrontmatter`)

## 🎯 **架構優勢**

### **1. 清晰分離**
- UI 組件與業務邏輯分離
- 服務接口與實現細節分離
- 類型定義集中管理

### **2. 易於維護**
- 每個目錄職責明確
- 依賴關係清晰
- 便於單元測試

### **3. 可擴展性**
- 新增功能只需在對應層級添加
- 不會影響其他模塊
- 支援大型項目擴展

### **4. 團隊協作**
- 統一的命名和結構規範
- 易於理解和上手
- 減少溝通成本

## 📚 **參考標準**

本架構參考了以下最佳實踐：
- React 官方文檔建議
- Next.js 項目結構
- 現代前端工程化標準
- TypeScript 項目最佳實踐

---

**版本：** v1.0  
**更新日期：** 2024-01-30  
**維護者：** 開發團隊 