import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePost } from '@/contexts/PostContext'

export default function HomePage() {
  const { posts, isPostsLoading, tags } = usePost()
  
  // 取前 3 篇文章作為預覽
  const recentPosts = posts.slice(0, 3)

  return (
    <div className="container mx-auto p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 主要內容區域 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-primary">
                歡迎使用 AI Intellagent Reader! 🤖📚
              </CardTitle>
              <CardDescription>
                智慧閱讀輔助系統 - AI 智能建議功能已完全就緒！
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg leading-relaxed">
                這是一個基於 React + TypeScript + Zustand + Tailwind CSS + shadcn/ui 構建的 **完整 AI 智慧閱讀輔助應用**。
                採用 Event-Driven 架構，結合 Controller 模式處理複雜業務邏輯，Zustand 管理狀態。
                **🎉 AI 智能建議系統已完全實現，立即體驗智慧閱讀！**
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button 
                  variant="default"
                  onClick={() => window.location.href = '/posts'}
                >
                  瀏覽文章
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => window.location.href = '/posts/getting-started'}
                >
                  體驗 AI 建議
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/about'}
                >
                  了解系統
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    const url = 'https://github.com/your-repo/auto-intellagent-reader'
                    window.open(url, '_blank')
                  }}
                >
                  GitHub 源碼
                </Button>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold mb-3 text-green-800">🎉 AI 智能建議系統已就緒</h3>
                <p className="text-sm text-green-700 mb-2">
                  **立即體驗**：訪問任意文章頁面，進行 30 秒閱讀行為，觀察右下角的智能建議 Toast！
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div className="bg-white/50 p-2 rounded">
                    <strong>快速瀏覽</strong><br/>
                    → 收藏建議
                  </div>
                  <div className="bg-white/50 p-2 rounded">
                    <strong>正常閱讀</strong><br/>
                    → 標記建議
                  </div>
                  <div className="bg-white/50 p-2 rounded">
                    <strong>深度學習</strong><br/>
                    → 筆記建議
                  </div>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3">技術棧</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <strong>前端框架：</strong>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li>React 19 + TypeScript</li>
                      <li>React Router v6</li>
                      <li>Zustand 狀態管理</li>
                    </ul>
                  </div>
                  <div>
                    <strong>AI 與工具：</strong>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li>OpenRouter AI API</li>
                      <li>Tailwind CSS</li>
                      <li>shadcn/ui 組件庫</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-2 text-blue-800">🚀 開發狀態</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-green-600 font-medium">✅ 已完成 100%：</span>
                    <ul className="ml-4 space-y-1 text-green-700">
                      <li>• 文章管理系統</li>
                      <li>• MDX 解析渲染</li>
                      <li>• Event-Driven 架構</li>
                      <li>• <strong>🎉 AI 智能建議系統</strong></li>
                      <li>• <strong>行為追蹤分析</strong></li>
                      <li>• <strong>Toast UI 交互</strong></li>
                    </ul>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">🚀 未來可能改進：</span>
                    <ul className="ml-4 space-y-1 text-blue-700">
                      <li>• 個性化學習機制</li>
                      <li>• 更多 AI 建議類型</li>
                      <li>• 高級 AI 功能</li>
                      <li>• 多語言支援</li>
                      <li>• 性能優化</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 文章預覽側邊欄 */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📝</span>
                最新文章
              </CardTitle>
              <CardDescription>
                {isPostsLoading ? '載入中...' : `共 ${posts.length} 篇文章，${tags.length} 個標籤`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isPostsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-muted animate-pulse p-3 rounded-lg h-16"></div>
                  ))}
                </div>
              ) : recentPosts.length > 0 ? (
                recentPosts.map(post => (
                  <div 
                    key={post.id} 
                    className="bg-secondary/30 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/posts/${post.id}`}
                  >
                    <p className="text-sm font-medium line-clamp-2">
                      {post.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {post.date} • {post.author}
                    </p>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {post.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p className="text-sm">暫無文章</p>
                </div>
              )}
              
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => window.location.href = '/posts'}
              >
                查看所有文章
              </Button>

              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-800">
                  🎉 AI 系統已就緒
                </p>
                <p className="text-xs text-green-700 mt-1">
                  點擊任意文章開始體驗智能閱讀建議！支援 OpenRouter API 和智能 fallback。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

 