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
            AI Intellagent Reader - 智慧閱讀輔助系統 (完整版)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose max-w-none">
            <h2>專案概述</h2>
            <p className="text-lg leading-relaxed">
              這是一個基於 React + TypeScript + Zustand + Tailwind CSS + shadcn/ui 構建的 **完整 AI 智慧閱讀輔助應用**。
              採用現代化的 Event-Driven 架構，結合 Controller 模式和 Zustand 狀態管理，提供高效的數據管理和複雜業務邏輯處理。
              **AI 智能建議系統已完全實現並可立即使用。**
            </p>
            
            <h3>🎉 核心功能 - 全面實現</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>智慧文章管理</strong> - MDX 支援、前置資料解析、標籤分類系統</li>
              <li><strong>🤖 AI 智能建議引擎</strong> - 基於 OpenRouter API 的真實 AI 分析和智能建議</li>
              <li><strong>📊 行為追蹤系統</strong> - 實時監聽用戶閱讀行為、智能模式識別 (scanning/reading/studying)</li>
              <li><strong>🎯 個性化建議</strong> - 根據閱讀模式自動生成收藏、筆記、標記等建議</li>
              <li><strong>✨ 非侵入式 UI</strong> - 右下角 Toast 建議，Accept/Reject/Dismiss 智能交互</li>
              <li><strong>🧠 混合智能架構</strong> - AI 分析 + 規則引擎雙重保障，無 API 時自動 fallback</li>
              <li><strong>響應式閱讀器</strong> - 自適應佈局、現代化閱讀體驗</li>
            </ul>
            
            <h3>🚀 技術特色與架構亮點</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Event-Driven 架構</strong> - ControllerRegistry 統一管理，類型安全的 Action 系統</li>
              <li><strong>無狀態 Controller</strong> - 純邏輯處理，所有狀態由 Zustand Store 管理</li>
              <li><strong>AI 服務整合</strong> - OpenRouter API 真實調用，智能錯誤處理和 fallback</li>
              <li><strong>智能隊列管理</strong> - AISuggestionStore 完整的建議隊列、統計、優化機制</li>
              <li><strong>自動化系統</strong> - AppInitializer 自動啟動，定時任務，智能上下文切換</li>
              <li><strong>行為模式識別</strong> - BehaviorEventCollector 統一事件收集和智能分析</li>
              <li><strong>文件系統路由</strong> - 基於 /pages 目錄的自動路由生成</li>
              <li><strong>策略模式</strong> - 靈活的 AI 建議策略和規則引擎</li>
              <li><strong>觀察者模式</strong> - 響應式的用戶行為監聽系統</li>
              <li><strong>shadcn/ui</strong> - 現代化的 UI 組件庫</li>
            </ul>
            
            <h3>🔄 AI 智能建議流程</h3>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm">
{`🔄 完整 AI 流程：
用戶閱讀行為 → BehaviorTracker 埋點收集
       ↓
BehaviorEventCollector 統一事件處理
       ↓
BehaviorStore 智能行為模式分析
       ↓
AIAgentController 定時分析 (30秒)
       ↓
OpenRouter API 真實 AI 分析 / Mock Fallback
       ↓
AISuggestionController 智能建議生成
       ↓
AISuggestionStore 隊列管理和優化
       ↓
Toast UI 非侵入式顯示
       ↓
用戶交互 → Action 執行 → 統計更新`}
              </pre>
            </div>
            
            <h3>📁 路由結構</h3>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm">
{`/pages/
├── index.tsx        → / (首頁 - 文章列表)
├── about.tsx        → /about (關於頁面)
├── 404.tsx          → /404 (錯誤頁面)
└── posts/
    ├── index.tsx    → /posts (文章總覽)
    └── [id]/
        └── index.tsx → /posts/[id] (文章詳情 + AI 建議)`}
              </pre>
            </div>

            <h3>🎯 開發狀態</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800">✅ 已完成 - 100%</h4>
                <ul className="text-sm text-green-700 mt-2 space-y-1">
                  <li>• 基礎架構和路由系統</li>
                  <li>• MDX 文章解析和渲染</li>
                  <li>• UI 組件庫整合</li>
                  <li>• Event-Driven 架構</li>
                  <li>• 文章管理系統</li>
                  <li>• <strong>🎉 AI 智能建議系統</strong></li>
                  <li>• <strong>行為追蹤和分析</strong></li>
                  <li>• <strong>Toast UI 智能交互</strong></li>
                  <li>• <strong>Zustand 狀態管理</strong></li>
                </ul>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800">🚀 可能的未來改進</h4>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• 個性化學習和偏好記憶</li>
                  <li>• 更多 AI 建議類型 (摘要、搜尋)</li>
                  <li>• 高級 AI 功能 (知識圖譜)</li>
                  <li>• 多語言支援和國際化</li>
                  <li>• 性能優化和大數據處理</li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200 mt-4">
              <h4 className="font-semibold text-green-800 mb-2">🎉 立即體驗 AI 智能建議</h4>
              <p className="text-sm text-green-700 mb-2">
                系統已完全就緒！訪問任意文章頁面，進行 30 秒閱讀行為，即可看到右下角的智能建議 Toast。
              </p>
              <ul className="text-xs text-green-600 space-y-1">
                <li>• <strong>快速瀏覽</strong> (scanning) → 收藏建議</li>
                <li>• <strong>正常閱讀</strong> (reading) → 標記建議</li>
                <li>• <strong>深度學習</strong> (studying) → 筆記建議</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button 
              variant="default"
              onClick={() => window.location.href = '/posts/getting-started'}
            >
              體驗 AI 建議
            </Button>
            <Button 
              variant="secondary"
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