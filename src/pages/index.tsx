import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePost } from '@/contexts/PostContext'
import { SimpleChat } from '@/components/SimpleChat'

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
                歡迎使用 AI Intellagent Reader! 📚
              </CardTitle>
              <CardDescription>
                智慧閱讀輔助系統 - 混合架構已成功搭建
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg leading-relaxed">
                這是一個基於 React + TypeScript + TanStack Query + Tailwind CSS + shadcn/ui 構建的智慧閱讀輔助應用。
                採用混合架構，結合 Controller 模式處理複雜業務邏輯，TanStack Query 管理數據同步。
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
                  onClick={() => window.location.href = '/about'}
                >
                  關於專案
                </Button>
                <Button variant="outline" disabled>
                  AI 建議 (開發中)
                </Button>
                <Button variant="ghost" disabled>
                  個人化 (規劃中)
                </Button>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3">技術棧</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <strong>前端框架：</strong>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li>React 19 + TypeScript</li>
                      <li>React Router v6</li>
                      <li>TanStack Query</li>
                    </ul>
                  </div>
                  <div>
                    <strong>UI 與工具：</strong>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li>Tailwind CSS</li>
                      <li>shadcn/ui 組件庫</li>
                      <li>Vite 構建工具</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-2 text-blue-800">🚀 開發狀態</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-green-600 font-medium">✅ 已完成：</span>
                    <ul className="ml-4 space-y-1 text-green-700">
                      <li>• 文章管理系統</li>
                      <li>• MDX 解析渲染</li>
                      <li>• 混合架構實現</li>
                    </ul>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">🚧 開發中：</span>
                    <ul className="ml-4 space-y-1 text-blue-700">
                      <li>• 行為追蹤系統</li>
                      <li>• AI 建議引擎</li>
                      <li>• 策略模式實現</li>
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

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <p className="text-sm font-medium text-amber-800">
                  🔧 開發提醒
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  AI 建議系統正在開發中，敬請期待智慧閱讀體驗！
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI 聊天測試區塊 */}
      <div className="container mx-auto mt-12">
        <SimpleChat />
      </div>
    </div>
  )
}

 