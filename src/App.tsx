import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, useEffect, useState } from 'react'
import { routes } from './router/routes'
import { PostProvider } from './contexts/PostContext'
import { InteractionProvider } from './contexts/InteractionContext'
import { ProviderComposer } from './components/ProviderComposer'
import Navigation from './components/Navigation'
import { AppInitializer } from './lib/AppInitializer'
import { Toaster } from '@/components/ui/toaster'
import './index.css'

// Provider 配置 - 按依賴順序排列
const providers = [
  PostProvider,           // 基礎數據層
  InteractionProvider,    // 互動功能管理
  // BehaviorProvider 已遷移到 Zustand store (useBehaviorStore)
]

function App() {
  const [isAppInitialized, setIsAppInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  // 統一初始化所有 Controller
  useEffect(() => {
    let isMounted = true

    const initializeApp = async () => {
      try {
        await AppInitializer.initialize()
        if (isMounted) {
          setIsAppInitialized(true)
        }
      } catch (error) {
        console.error('App initialization failed:', error)
        if (isMounted) {
          setInitError(error instanceof Error ? error.message : 'Unknown error')
        }
      }
    }

    initializeApp()

    // 清理函數
    return () => {
      isMounted = false
      AppInitializer.cleanup()
    }
  }, [])

  // 初始化失敗時的錯誤畫面
  if (initError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">應用程式初始化失敗</h1>
          <p className="text-red-500 mb-4">{initError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            重新載入
          </button>
        </div>
      </div>
    )
  }

  // 初始化進行中的載入畫面
  if (!isAppInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-blue-600">正在初始化應用程式...</p>
          <p className="text-sm text-blue-500 mt-2">載入 Controller 系統</p>
        </div>
      </div>
    )
  }
  return (
    <BrowserRouter>
      <ProviderComposer providers={providers}>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main>
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">載入中...</div>
              </div>
            }>
              <Routes>
                {routes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={route.element}
                  />
                ))}
              </Routes>
            </Suspense>
          </main>
        </div>
        <Toaster />
      </ProviderComposer>
    </BrowserRouter>
  )
}

export default App 