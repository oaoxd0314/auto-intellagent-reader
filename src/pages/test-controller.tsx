import { useEffect, useRef, useState } from 'react'
import { BehaviorController, type SuggestionStrategy } from '../controllers'
import type { Suggestion } from '../types/suggestion'

const TestControllerPage = () => {
  const [controller] = useState(() => new BehaviorController())
  const [isTracking, setIsTracking] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [currentData, setCurrentData] = useState<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    // 初始化控制器
    controller.initialize()

    // 監聽建議生成事件
    controller.on('suggestionsGenerated', (suggestions: Suggestion[]) => {
      setSuggestions(suggestions)
    })

    // 監聽追蹤開始事件
    controller.on('trackingStarted', (postId: string) => {
      console.log('Tracking started for:', postId)
      setIsTracking(true)
    })

    // 監聽追蹤停止事件
    controller.on('trackingStopped', () => {
      console.log('Tracking stopped')
      setIsTracking(false)
    })

    return () => {
      controller.destroy()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [controller])

  const startTracking = async () => {
    await controller.startTracking('test-post-1')
    
    // 模擬用戶行為
    simulateUserBehavior()
  }

  const stopTracking = async () => {
    await controller.stopTracking()
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  const simulateUserBehavior = () => {
    let scrollPosition = 0
    
    intervalRef.current = setInterval(() => {
      // 模擬滾動
      if (Math.random() > 0.7) {
        scrollPosition += Math.random() * 10
        controller.addEvent({
          type: 'scroll',
          context: {
            postId: 'test-post-1',
            position: scrollPosition
          }
        })
      }
      
      // 模擬停留
      if (Math.random() > 0.8) {
        controller.addEvent({
          type: 'pause',
          context: {
            postId: 'test-post-1',
            duration: Math.random() * 2000 + 1000,
            position: scrollPosition
          }
        })
      }
      
      // 模擬文本選擇
      if (Math.random() > 0.9) {
        controller.addEvent({
          type: 'select',
          context: {
            postId: 'test-post-1',
            selectedText: 'Selected text example',
            position: scrollPosition
          }
        })
      }
      
      // 更新當前數據顯示
      setCurrentData(controller.getCurrentData())
      
    }, 1000)
  }

  const addCustomStrategy = () => {
    const customStrategy: SuggestionStrategy = {
      name: 'custom-test',
      analyze: (events, _summary) => {
        if (events.length > 5) {
          return {
            id: `custom-${Date.now()}`,
            type: 'note', // 使用有效的 SuggestionType
            title: '自定義建議',
            description: `你已經產生了 ${events.length} 個事件！`,
            confidence: 0.7,
            priority: 2,
            action: async () => {
              alert('自定義建議被執行了！')
            }
          }
        }
        return null
      }
    }
    
    controller.addStrategy(customStrategy)
  }

  const executeSuggestion = async (suggestion: Suggestion) => {
    await suggestion.action()
    // 移除已執行的建議
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">BehaviorController 測試</h1>
      
      {/* 控制面板 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">控制面板</h2>
        <div className="flex gap-4 mb-4">
          <button
            onClick={startTracking}
            disabled={isTracking}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
          >
            開始追蹤
          </button>
          <button
            onClick={stopTracking}
            disabled={!isTracking}
            className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
          >
            停止追蹤
          </button>
          <button
            onClick={addCustomStrategy}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            添加自定義策略
          </button>
        </div>
        <div className="text-sm text-gray-600">
          狀態: {isTracking ? '正在追蹤' : '未追蹤'}
        </div>
      </div>

      {/* 當前數據 */}
      {currentData && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">當前數據</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">基本信息</h3>
              <p>文章ID: {currentData.postId}</p>
              <p>事件數量: {currentData.events.length}</p>
              <p>策略數量: {currentData.strategiesCount}</p>
            </div>
            <div>
              <h3 className="font-medium">行為摘要</h3>
              <p>總時間: {Math.round(currentData.summary.totalTime / 1000)}秒</p>
              <p>滾動深度: {Math.round(currentData.summary.scrollDepth * 100)}%</p>
              <p>停留次數: {currentData.summary.pauseCount}</p>
              <p>選擇次數: {currentData.summary.selectionCount}</p>
              <p>參與度: {Math.round(currentData.summary.engagementScore * 100)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* 建議列表 */}
      {suggestions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">AI 建議 ({suggestions.length})</h2>
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{suggestion.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>優先級: {suggestion.priority}</span>
                    <span>信心度: {Math.round(suggestion.confidence * 100)}%</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-3">{suggestion.description}</p>
                <button
                  onClick={() => executeSuggestion(suggestion)}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  執行建議
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 事件日誌 */}
      {currentData?.events && currentData.events.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">事件日誌 (最近10個)</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {currentData.events.slice(-10).reverse().map((event: any, index: number) => (
              <div key={index} className="text-sm border-l-2 border-blue-200 pl-3">
                <div className="font-medium">{event.type}</div>
                <div className="text-gray-500 text-xs">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
                {event.context.duration && (
                  <div className="text-gray-600">持續: {event.context.duration}ms</div>
                )}
                {event.context.position && (
                  <div className="text-gray-600">位置: {event.context.position}</div>
                )}
                {event.context.selectedText && (
                  <div className="text-gray-600">選擇: {event.context.selectedText}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TestControllerPage 