import { useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { AIAgentController } from '../controllers/AIAgentController'
import { AIAgentService } from '../services/AIAgentService'

/**
 * 簡單的聊天界面 - 直接測試 AI API
 */
export function SimpleChat() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [controller] = useState(() => new AIAgentController())

  // 檢查 API 配置
  const isConfigured = AIAgentService.isConfigured()
  const apiKey = (import.meta as any).env.VITE_OPENROUTER_API_KEY

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !isConfigured) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    // 添加用戶消息到 UI
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      // 調用 Controller
      const response = await controller.sendMessage(userMessage)
      
      // 添加 AI 回應到 UI
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      console.error('聊天錯誤:', error)
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: `錯誤: ${error instanceof Error ? error.message : '未知錯誤'}` 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    controller.clearConversation()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">💬 簡單聊天測試</h2>
          <div className="flex gap-2">
            <Button
              onClick={clearChat}
              variant="outline"
              size="sm"
              disabled={messages.length === 0}
            >
              清空對話
            </Button>
          </div>
        </div>

        {/* API 狀態 */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">API 狀態:</span>
            <span className={`${isConfigured ? 'text-green-600' : 'text-red-600'}`}>
              {isConfigured ? '✅ 已配置' : '❌ 未配置'}
            </span>
          </div>
          {apiKey && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="font-medium">API Key:</span>
              <span className="text-gray-600 font-mono text-xs">
                {apiKey.substring(0, 10)}...
              </span>
            </div>
          )}
          {!isConfigured && (
            <div className="text-xs text-red-600 mt-2">
              請在專案根目錄建立 .env.local 檔案，並加入：<br/>
              <code className="bg-red-100 px-1 rounded">VITE_OPENROUTER_API_KEY=your_api_key_here</code>
            </div>
          )}
        </div>

        {/* 聊天區域 */}
        <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              開始對話吧！輸入訊息並按 Enter 發送
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' 
                      ? 'justify-end' 
                      : message.role === 'system'
                      ? 'justify-center'
                      : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.role === 'system'
                        ? 'bg-red-100 text-red-800 text-sm'
                        : 'bg-white text-gray-800 border'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.role !== 'system' && (
                      <div className="text-xs opacity-70 mt-1">
                        {message.role === 'user' ? '你' : 'AI'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 border p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      <span>AI 思考中...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 輸入區域 */}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isConfigured ? "輸入訊息..." : "請先設定 API Key"}
            disabled={!isConfigured || isLoading}
            className="flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || !isConfigured}
            className="px-6"
          >
            {isLoading ? '發送中...' : '發送'}
          </Button>
        </div>

        {/* 使用說明 */}
        <div className="mt-4 text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
          <strong>使用說明:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>支援 Enter 鍵快速發送（Shift+Enter 換行）</li>
            <li>對話會自動保存在記憶中，最多保留 20 輪對話</li>
            <li>使用 OpenRouter API，支援 gpt-4o-mini 模型</li>
          </ul>
        </div>
      </div>
    </Card>
  )
} 