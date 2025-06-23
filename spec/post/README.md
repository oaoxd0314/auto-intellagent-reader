# 文章系統實作狀態

## 🎯 目標功能

1. **Markdown render** - 真正的 markdown 文件渲染 ⚠️ 
2. **/posts** - 列出所有文章 ✅
3. **/posts/:id** - 顯示指定文章 ✅

## ✅ 已完成功能

### 1. UI 組件
- **文章列表頁面** (`src/pages/posts/index.tsx`)
  - 顯示所有文章卡片
  - 標題、日期、標籤顯示
  - 點擊跳轉到詳情頁
  
- **文章詳情頁面** (`src/pages/posts/[id]/index.tsx`)
  - 完整文章內容顯示
  - ReactMarkdown 渲染
  - 返回列表導航
  - 自定義 markdown 組件樣式

### 2. 數據結構定義
```typescript
interface Post {
  id: string        // 文章唯一標識符
  title: string     // 文章標題
  content: string   // Markdown 內容
  date: string      // 發布日期 (YYYY-MM-DD)
  tags?: string[]   // 標籤陣列（可選）
}
```

## ⚠️ 當前臨時實作

### 假的數據源 (`src/data/posts.ts`)
**問題：** 目前使用硬編碼的 JSON 數據，不是真正從 markdown 文件讀取

```typescript
// 當前的臨時做法 - 硬編碼數據
export const posts: Post[] = [
  {
    id: 'getting-started',
    title: '開始使用 Auto IntelliAgent Reader',
    date: '2024-01-15',
    tags: ['tutorial', 'getting-started'],
    content: `# 歡迎使用...` // markdown 字符串直接寫在這裡
  },
  // ... 更多硬編碼文章
]
```

**工具函數：**
- `getPostById(id: string): Post | undefined`
- `getAllPosts(): Post[]`

## 🚧 缺少的核心功能

### 1. Markdown 文件存放區域
**需要：** 創建專門存放 `.md` 文件的目錄結構

建議結構：
```
src/content/posts/
├── getting-started.md
├── react-best-practices.md
└── markdown-guide.md
```

### 2. Markdown Frontmatter 解析
**需要：** 真正的 markdown 文件需要包含 metadata

標準格式：
```markdown
---
title: "文章標題"
date: "2024-01-15"
tags: ["tag1", "tag2"]
---

# 文章內容

這裡是 markdown 內容...
```

### 3. Markdown 文件讀取 Factory
**需要：** 創建服務來讀取和解析 markdown 文件

需要實作：
```typescript
// src/services/MarkdownFactory.ts
class MarkdownFactory {
  // 讀取單個 markdown 文件
  static async loadMarkdownFile(filename: string): Promise<Post>
  
  // 讀取所有 markdown 文件
  static async loadAllMarkdownFiles(): Promise<Post[]>
  
  // 解析 frontmatter + content
  static parseMarkdown(rawContent: string): {
    metadata: Frontmatter
    content: string
  }
}
```

### 4. 真正的 Data Source
**需要：** 替換當前的假數據，使用真正從文件讀取的數據

```typescript
// src/services/PostDataSource.ts
class PostDataSource {
  // 從 markdown 文件獲取所有文章
  static async getAllPosts(): Promise<Post[]>
  
  // 從 markdown 文件獲取指定文章
  static async getPostById(id: string): Promise<Post | undefined>
  
  // 監聽文件變化（開發環境）
  static watchFiles(callback: () => void): void
}
```

## 📋 下一步實作清單

### Phase 1: 基礎 Markdown 支援
- [ ] 創建 `src/content/posts/` 目錄
- [ ] 將現有硬編碼內容轉為 `.md` 文件
- [ ] 安裝 frontmatter 解析套件 (`gray-matter`)
- [ ] 實作 `MarkdownFactory` 服務

### Phase 2: 數據源整合  
- [ ] 實作 `PostDataSource` 服務
- [ ] 更新 `src/data/posts.ts` 使用真正的數據源
- [ ] 測試文章列表和詳情頁面
- [ ] 處理文件讀取錯誤

### Phase 3: 開發體驗優化
- [ ] 開發環境熱重載支援
- [ ] 文件變化監聽
- [ ] 錯誤處理和提示
- [ ] 性能優化（文件快取）

## 🔧 技術需求

### 新增依賴套件
```bash
pnpm add gray-matter    # frontmatter 解析
pnpm add fs-extra       # 文件系統操作  
pnpm add chokidar       # 文件監聽（開發環境）
```

### 文件結構規劃
```
src/
├── content/posts/          # 📁 Markdown 文件存放
│   ├── getting-started.md
│   └── react-best-practices.md
├── services/              # 📁 業務邏輯服務
│   ├── MarkdownFactory.ts # 📄 Markdown 解析
│   └── PostDataSource.ts # 📄 文章數據源
├── data/
│   └── posts.ts          # 📄 數據接口（改為調用服務）
└── types/
    └── post.ts           # 📄 類型定義
```

## 🎯 實作優先級

1. **高優先級** - 基本 markdown 文件讀取功能
2. **中優先級** - 開發環境優化和錯誤處理  
3. **低優先級** - 性能優化和進階功能

## 💡 技術決策

### 為什麼需要真正的 Markdown 文件？
1. **內容管理** - 方便編輯和版本控制
2. **標準格式** - 符合 markdown 生態系統
3. **可擴展性** - 未來可以整合 CMS 或其他工具
4. **開發體驗** - 支援語法高亮和預覽

### 架構考量
- **簡單優先** - 先實作基本功能，避免過度設計
- **漸進式** - 可以逐步添加功能
- **類型安全** - 使用 TypeScript 確保數據一致性

---

**當前狀態：** UI 和路由完成，需要實作真正的 markdown 文件處理機制
**下次開發：** 從 Phase 1 開始，創建 markdown 文件和解析服務 