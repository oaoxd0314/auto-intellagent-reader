export interface Post {
    id: string
    title: string
    content: string
    date: string
    tags?: string[]
}

// 簡單的文章數據 - 後面可以改成從文件讀取
export const posts: Post[] = [
    {
        id: 'getting-started',
        title: '開始使用 Auto IntelliAgent Reader',
        date: '2024-01-15',
        tags: ['tutorial', 'getting-started'],
        content: `# 歡迎使用 Auto IntelliAgent Reader

這是一個簡單的文章管理系統。

## 主要功能

- 📝 Markdown 文章支援
- 🔍 文章列表瀏覽
- 📖 文章詳細頁面
- 🏷️ 標籤系統

## 開始使用

只需要訪問 \`/posts\` 頁面就可以看到所有文章列表。

點擊任何文章標題就可以查看詳細內容。

**就是這麼簡單！**`
    },
    {
        id: 'react-best-practices',
        title: 'React 開發最佳實踐',
        date: '2024-01-20',
        tags: ['react', 'javascript', 'best-practices'],
        content: `# React 開發最佳實踐

在 React 開發中，遵循最佳實踐可以讓你的代碼更加清晰和可維護。

## 1. 組件設計

### 保持組件簡單
每個組件應該只做一件事情：

\`\`\`jsx
// ✅ 好的做法
function UserProfile({ user }) {
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  )
}
\`\`\`

### 使用 TypeScript
TypeScript 可以幫助你避免很多運行時錯誤：

\`\`\`tsx
interface User {
  name: string
  email: string
}

function UserProfile({ user }: { user: User }) {
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  )
}
\`\`\`

## 2. State 管理

使用 \`useState\` 進行簡單的狀態管理：

\`\`\`jsx
function Counter() {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        增加
      </button>
    </div>
  )
}
\`\`\`

## 總結

- 保持組件簡單
- 使用 TypeScript
- 合理管理狀態
- 遵循命名規範

這些簡單的原則就能讓你的 React 代碼更加優秀！`
    },
    {
        id: 'markdown-guide',
        title: 'Markdown 語法指南',
        date: '2024-01-25',
        tags: ['markdown', 'documentation'],
        content: `# Markdown 語法指南

Markdown 是一種輕量級標記語言，非常適合寫文檔。

## 基本語法

### 標題
\`\`\`markdown
# H1 標題
## H2 標題  
### H3 標題
\`\`\`

### 文字格式
- **粗體文字**
- *斜體文字*
- \`行內代碼\`

### 列表
1. 有序列表項目 1
2. 有序列表項目 2

- 無序列表項目
- 另一個項目

### 連結和圖片
[連結文字](https://example.com)

![圖片描述](https://via.placeholder.com/300x200)

### 代碼區塊
\`\`\`javascript
function hello() {
  console.log('Hello, World!')
}
\`\`\`

### 引用
> 這是一個引用文字
> 可以跨越多行

## 進階功能

### 表格
| 欄位 1 | 欄位 2 | 欄位 3 |
|--------|--------|--------|
| 資料 1 | 資料 2 | 資料 3 |
| 資料 4 | 資料 5 | 資料 6 |

### 分隔線
---

就是這麼簡單！Markdown 讓文檔撰寫變得更加輕鬆。`
    }
]

// 工具函數
export function getPostById(id: string): Post | undefined {
    return posts.find(post => post.id === id)
}

export function getAllPosts(): Post[] {
    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
} 