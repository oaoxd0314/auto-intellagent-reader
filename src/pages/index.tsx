import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="container mx-auto p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 主要阅读区域 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-primary">
                Hello World! 🌍
              </CardTitle>
              <CardDescription>
                AI Sidebar Suggestion App - 练习架构已成功搭建
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg leading-relaxed">
                这是一个基于 React + TypeScript + Tailwind CSS + shadcn/ui 构建的 AI 侧边栏建议应用。
                应用采用了 Strategy Pattern、Observer Pattern 和 Controller 架构模式。
              </p>
              
              <div className="flex gap-4">
                <Button variant="default">
                  主要按钮
                </Button>
                <Button variant="secondary">
                  次要按钮
                </Button>
                <Button variant="outline">
                  轮廓按钮
                </Button>
                <Button variant="ghost">
                  幽灵按钮
                </Button>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">技术栈：</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>React 19 + TypeScript</li>
                  <li>React Router v6</li>
                  <li>Tailwind CSS</li>
                  <li>shadcn/ui 组件库</li>
                  <li>Vite 构建工具</li>
                </ul>
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
                AI 助手
              </CardTitle>
              <CardDescription>
                智能阅读建议和互动功能
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