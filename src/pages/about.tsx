import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AboutPage() {
  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">
            🚀 关于项目
          </CardTitle>
          <CardDescription>
            AI Sidebar Suggestion App - 基于文件系统路由的架构
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose max-w-none">
            <h2>项目概述</h2>
            <p className="text-lg leading-relaxed">
              这是一个基于 React + TypeScript + Tailwind CSS + shadcn/ui 构建的 AI 侧边栏建议应用。
              应用采用了类似 Next.js 的文件系统路由架构，让页面组织更加清晰。
            </p>
            
            <h3>技术特性</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>文件系统路由</strong> - 基于 /pages 目录的自动路由生成</li>
              <li><strong>Strategy Pattern</strong> - 不同AI建议策略的灵活切换</li>
              <li><strong>Observer Pattern</strong> - 监听用户行为的响应式系统</li>
              <li><strong>Controller</strong> - 管理状态和业务逻辑的控制器</li>
              <li><strong>shadcn/ui</strong> - 现代化的UI组件库</li>
              <li><strong>Tailwind CSS</strong> - 实用优先的CSS框架</li>
            </ul>
            
            <h3>路由结构</h3>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm">
{`/pages/
├── index.tsx     → / (首页)
├── about.tsx     → /about (关于页面)
└── reader.tsx    → /reader (阅读器页面)`}
              </pre>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button variant="default">
              返回首页
            </Button>
            <Button variant="outline">
              查看阅读器
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 