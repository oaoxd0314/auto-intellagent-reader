# 路由系統規格

## 🎯 目標

實作類似 Next.js 的文件夾自動路由系統，根據文件結構自動生成路由配置。

## 📊 當前狀態

### ✅ 已完成
- **基本 React Router 配置** - 手動定義的路由
  - `/posts` → `src/pages/posts/index.tsx`
  - `/posts/:id` → `src/pages/posts/[id]/index.tsx`
  - 基本的 404 重定向處理

### ❌ 缺少功能
- **自動路由生成** - 根據文件結構自動生成路由
- **動態路由掃描** - 監聽文件變化自動更新路由
- **嵌套路由支援** - 支援多層路由結構

## 🏗️ 目標架構

### 理想的文件結構 → 路由對應
```
src/pages/
├── index.tsx           → /
├── about.tsx           → /about
├── posts/
│   ├── index.tsx       → /posts
│   ├── [id]/
│   │   └── index.tsx   → /posts/:id
│   └── tags/
│       ├── index.tsx   → /posts/tags
│       └── [tag]/
│           └── index.tsx → /posts/tags/:tag
└── reader.tsx          → /reader
```

### 動態路由規則
- `[id]` → 動態參數 `:id`
- `[...slug]` → 萬用路由 `*`
- `index.tsx` → 該目錄的根路由

## 🔧 需要實作的服務

### RouteGenerator 服務
```typescript
// src/services/RouteGenerator.ts
export interface RouteConfig {
  path: string
  element: React.ComponentType
  filePath: string
  isDynamic: boolean
  params?: string[]
}

export class RouteGenerator {
  /**
   * 掃描 pages 目錄生成路由配置
   */
  static async generateRoutes(pagesDir: string = 'src/pages'): Promise<RouteConfig[]>

  /**
   * 將文件路徑轉換為路由路徑
   * @example
   * 'posts/[id]/index.tsx' → '/posts/:id'
   * 'posts/tags/[tag]/index.tsx' → '/posts/tags/:tag'
   */
  static filePathToRoutePath(filePath: string): string

  /**
   * 檢查文件是否為有效的頁面組件
   */
  static isValidPageFile(filePath: string): boolean

  /**
   * 提取動態路由參數
   * @example
   * '[id]' → ['id']
   * '[...slug]' → ['slug']
   */
  static extractDynamicParams(segment: string): string[]

  /**
   * 監聽文件變化自動更新路由
   */
  static watchPagesDirectory(
    pagesDir: string,
    callback: (routes: RouteConfig[]) => void
  ): () => void
}
```

### 使用範例
```typescript
// src/router/routes.tsx
import { RouteGenerator } from '@/services/RouteGenerator'

// 生成路由配置
const routes = await RouteGenerator.generateRoutes('src/pages')

// 動態創建 React Router 配置
const router = createBrowserRouter(
  routes.map(route => ({
    path: route.path,
    element: React.createElement(route.element)
  }))
)

// 開發環境監聽文件變化
if (process.env.NODE_ENV === 'development') {
  RouteGenerator.watchPagesDirectory('src/pages', (newRoutes) => {
    // 熱重載路由配置
    console.log('路由已更新:', newRoutes)
  })
}
```

## 📋 實作步驟

### Phase 1: 基礎路由生成
- [ ] 創建 `RouteGenerator` 服務
- [ ] 實作 `generateRoutes()` 方法
- [ ] 實作 `filePathToRoutePath()` 轉換邏輯
- [ ] 支援基本的動態路由 `[id]`

### Phase 2: 進階功能
- [ ] 支援嵌套路由結構
- [ ] 實作萬用路由 `[...slug]`
- [ ] 添加路由驗證和錯誤處理
- [ ] 優化路由生成性能

### Phase 3: 開發體驗
- [ ] 文件監聽和熱重載
- [ ] 路由衝突檢測
- [ ] 開發工具整合
- [ ] 路由生成報告

## 🔍 技術實作細節

### 文件掃描邏輯
```typescript
async function scanPagesDirectory(dir: string): Promise<string[]> {
  const files: string[] = []
  
  const scan = async (currentDir: string, relativePath: string = '') => {
    const entries = await fs.readdir(currentDir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      const relPath = path.join(relativePath, entry.name)
      
      if (entry.isDirectory()) {
        await scan(fullPath, relPath)
      } else if (entry.isFile() && isValidPageFile(entry.name)) {
        files.push(relPath)
      }
    }
  }
  
  await scan(dir)
  return files
}
```

### 路徑轉換邏輯
```typescript
function filePathToRoutePath(filePath: string): string {
  // 移除 .tsx 副檔名
  let routePath = filePath.replace(/\.tsx?$/, '')
  
  // 處理 index 文件
  routePath = routePath.replace(/\/index$/, '')
  
  // 處理動態路由
  routePath = routePath.replace(/\[([^\]]+)\]/g, (match, param) => {
    if (param.startsWith('...')) {
      // 萬用路由 [...slug] → *
      return '*'
    }
    // 動態參數 [id] → :id
    return `:${param}`
  })
  
  // 確保以 / 開頭
  return '/' + routePath.replace(/^\//, '')
}
```

### 動態導入組件
```typescript
async function loadPageComponent(filePath: string): Promise<React.ComponentType> {
  const fullPath = path.resolve('src/pages', filePath)
  
  try {
    const module = await import(fullPath)
    return module.default || module
  } catch (error) {
    console.error(`無法載入頁面組件: ${filePath}`, error)
    // 返回 404 組件
    return () => <div>頁面不存在</div>
  }
}
```

## ⚠️ 注意事項

### 限制和約束
1. **文件命名規範** - 必須遵循 `[param]` 格式
2. **組件導出** - 必須使用 `export default`
3. **路由衝突** - 靜態路由優先於動態路由
4. **性能考量** - 大量文件時需要優化掃描效率

### 錯誤處理
```typescript
// 路由衝突檢測
function detectRouteConflicts(routes: RouteConfig[]): string[] {
  const conflicts: string[] = []
  const pathMap = new Map<string, string[]>()
  
  routes.forEach(route => {
    if (!pathMap.has(route.path)) {
      pathMap.set(route.path, [])
    }
    pathMap.get(route.path)!.push(route.filePath)
  })
  
  pathMap.forEach((files, path) => {
    if (files.length > 1) {
      conflicts.push(`路由衝突 ${path}: ${files.join(', ')}`)
    }
  })
  
  return conflicts
}
```

## 🚀 未來擴展

### 可能的增強功能
- **中間件支援** - 路由級別的中間件
- **佈局系統** - 自動應用佈局組件
- **預渲染支援** - 靜態路由預渲染
- **國際化路由** - 多語言路由支援

---

**當前狀態：** 僅有基本的手動路由配置
**下一步：** 實作 `RouteGenerator` 服務的基礎功能 