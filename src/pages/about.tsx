import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AboutPage() {
  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">
            🤖 關於專案
          </CardTitle>
          <CardDescription>
            AI Intellagent Reader - 智慧閱讀輔助系統
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose max-w-none">
            <h2>專案概述</h2>
            <p className="text-lg leading-relaxed">
              這是一個基於 React + TypeScript + TanStack Query + Tailwind CSS + shadcn/ui 構建的智慧閱讀輔助應用。
              採用現代化的混合架構，結合 Controller 模式和 TanStack Query，提供高效的數據管理和複雜業務邏輯處理。
            </p>
            
            <h3>核心功能</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>智慧文章管理</strong> - MDX 支援、前置資料解析、標籤分類系統</li>
              <li><strong>行為追蹤系統</strong> - 監聽用戶閱讀行為、停留時間分析</li>
              <li><strong>AI 建議引擎</strong> - 基於策略模式的智慧建議系統</li>
              <li><strong>響應式閱讀器</strong> - 自適應佈局、現代化閱讀體驗</li>
              <li><strong>混合架構</strong> - TanStack Query + Controller 的最佳實踐</li>
            </ul>
            
            <h3>技術特色</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>文件系統路由</strong> - 基於 /pages 目錄的自動路由生成</li>
              <li><strong>策略模式</strong> - 靈活的 AI 建議策略切換</li>
              <li><strong>觀察者模式</strong> - 響應式的用戶行為監聽系統</li>
              <li><strong>控制器架構</strong> - 分層架構管理複雜業務邏輯</li>
              <li><strong>TanStack Query</strong> - 強大的數據同步和快取管理</li>
              <li><strong>shadcn/ui</strong> - 現代化的 UI 組件庫</li>
            </ul>
            
            <h3>路由結構</h3>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm">
{`/pages/
├── index.tsx        → / (首頁 - 文章列表)
├── about.tsx        → /about (關於頁面)
├── 404.tsx          → /404 (錯誤頁面)
└── posts/
    ├── index.tsx    → /posts (文章總覽)
    └── [id]/
        └── index.tsx → /posts/[id] (文章詳情)`}
              </pre>
            </div>

            <h3>開發狀態</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800">✅ 已完成</h4>
                <ul className="text-sm text-green-700 mt-2 space-y-1">
                  <li>• 基礎架構和路由系統</li>
                  <li>• MDX 文章解析和渲染</li>
                  <li>• UI 組件庫整合</li>
                  <li>• 混合架構實現</li>
                  <li>• 文章管理系統</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800">🚧 開發中</h4>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• 用戶行為追蹤系統</li>
                  <li>• AI 建議引擎核心</li>
                  <li>• 策略模式實現</li>
                  <li>• 個人化推薦算法</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button 
              variant="default"
              onClick={() => window.location.href = '/'}
            >
              返回首頁
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/posts'}
            >
              瀏覽文章
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 