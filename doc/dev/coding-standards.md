# 開發指南

## 🚀 快速開始

### 環境要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安裝和運行
```bash
# 克隆項目
git clone <repository-url>
cd ai-sidebar-suggestion-app

# 安裝依賴
pnpm install

# 啟動開發服務器
pnpm dev
```

訪問 `http://localhost:5173` 查看應用

### 開發命令
```bash
pnpm dev          # 啟動開發服務器
pnpm build        # 構建生產版本
pnpm preview      # 預覽生產版本
pnpm lint         # 代碼檢查
```

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

### 開發規範
- 使用 TypeScript 進行開發
- 遵循 ESLint 規則
- 編寫單元測試
- 保持代碼文檔更新

### 提交規範
```
feat: 新功能
fix: 修復問題
docs: 文檔更新
style: 代碼格式
refactor: 重構
test: 測試
chore: 構建工具
```

## 📝 代碼標準

### TypeScript 規範
- 使用嚴格模式 (`strict: true`)
- 優先使用 interface 而非 type
- 避免 any 類型，使用 unknown 或具體類型
- 為所有函數參數和返回值添加類型註解

### React 規範
- 使用函數組件和 Hooks
- 組件名稱使用 PascalCase
- Props 接口使用 `ComponentNameProps` 命名
- 使用 React.memo 優化性能

### 文件組織
- 每個組件一個文件
- 相關功能放在同一目錄
- 使用 index.ts 進行導出
- 保持目錄結構清晰

## 🧪 測試指南

### 單元測試
- 使用 Vitest 作為測試框架
- 測試文件命名為 `*.test.ts` 或 `*.spec.ts`
- 覆蓋核心業務邏輯
- 測試邊界條件

### 組件測試
- 使用 React Testing Library
- 測試用戶交互行為
- 驗證組件渲染結果
- 模擬用戶事件

### 集成測試
- 測試組件間協作
- 驗證數據流
- 測試路由跳轉
- 模擬 API 調用

## 🔧 開發工具

### 推薦的 VS Code 擴展
- TypeScript Importer
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Auto Rename Tag

### 調試工具
- React Developer Tools
- Redux DevTools (如果使用)
- Network Tab (開發者工具)
- Console Logging

## 📚 學習資源

### React 19 新特性
- [React 19 官方文檔](https://react.dev/)
- [Concurrent Features](https://react.dev/blog/2024/02/15/react-labs-what-we-have-been-working-on-february-2024)
- [Server Components](https://react.dev/learn/server-components)

### TypeScript
- [TypeScript 官方文檔](https://www.typescriptlang.org/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

### 設計模式
- [Strategy Pattern](https://refactoring.guru/design-patterns/strategy)
- [Observer Pattern](https://refactoring.guru/design-patterns/observer)
- [Factory Pattern](https://refactoring.guru/design-patterns/factory-method)

## 🐛 常見問題

### 開發環境問題
**Q: 啟動開發服務器時出現端口衝突**
A: 修改 `vite.config.ts` 中的端口配置，或使用 `pnpm dev --port 3001`

**Q: TypeScript 類型錯誤**
A: 檢查 `tsconfig.json` 配置，確保路徑別名正確設置

### 構建問題
**Q: 生產構建失敗**
A: 檢查是否有未使用的導入或類型錯誤，運行 `pnpm lint` 檢查

**Q: 組件渲染異常**
A: 檢查 React 版本兼容性，確保所有依賴版本匹配

## 📞 支持

如果遇到問題，請：
1. 查看 [Issues](../../issues) 是否有類似問題
2. 搜索項目文檔
3. 提交新的 Issue，包含詳細的錯誤信息和復現步驟 