import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense } from 'react'
import { routes } from './router/routes'
import { PostProvider } from './contexts/PostContext'
import { InteractionProvider } from './contexts/InteractionContext'
import { BehaviorProvider } from './contexts/BehaviorContext'
import { PostActionsProvider } from './contexts/PostActionsContext'
import { ProviderComposer } from './components/ProviderComposer'
import Navigation from './components/Navigation'
import './index.css'

// Provider 配置 - 按依賴順序排列
const providers = [
  PostProvider,           // 基礎數據層
  InteractionProvider,    // 互動功能層
  BehaviorProvider,       // 行為分析層
  PostActionsProvider     // 操作協調層
]

function App() {
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
      </ProviderComposer>
    </BrowserRouter>
  )
}

export default App 