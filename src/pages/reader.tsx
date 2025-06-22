import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ReaderPage() {
  return (
    <div className="container mx-auto p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 主要阅读区域 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-primary">
                📖 阅读器页面
              </CardTitle>
              <CardDescription>
                这里是专门的阅读器页面，支持AI侧边栏建议功能
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose max-w-none">
                <h2>文章标题</h2>
                <p className="text-lg leading-relaxed">
                  这是一篇示例文章的内容。用户可以在这里阅读长文章，AI侧边栏会观察用户行为并提供智能建议。
                </p>
                <p className="text-lg leading-relaxed">
                  当用户滚动、高亮文本或在某个段落停留时间较长时，AI会分析这些行为并生成相应的建议。
                </p>
                <p className="text-lg leading-relaxed">
                  这种基于文件系统的路由架构让页面组织更加清晰，类似于Next.js的pages目录结构。
                </p>
              </div>
              
              <div className="flex gap-4">
                <Button variant="default">
                  添加书签
                </Button>
                <Button variant="secondary">
                  分享文章
                </Button>
                <Button variant="outline">
                  打印
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* AI 侧边栏 */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                AI 阅读助手
              </CardTitle>
              <CardDescription>
                基于文件系统路由的智能建议
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                <p className="text-sm font-medium text-primary">
                  💡 建议：添加书签
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  当前段落值得收藏，点击添加书签
                </p>
              </div>
              
              <div className="bg-secondary/50 p-3 rounded-lg">
                <p className="text-sm font-medium">
                  📚 相关阅读
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  推荐 3 篇相关文章
                </p>
              </div>
              
              <div className="bg-accent/30 p-3 rounded-lg">
                <p className="text-sm font-medium">
                  💬 分享佳句
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  "这是一个很好的引用示例"
                </p>
              </div>
              
              <Button className="w-full" variant="outline">
                查看更多建议
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 