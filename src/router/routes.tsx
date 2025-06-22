import { lazy } from 'react'
import { RouteObject } from 'react-router-dom'

// 页面组件懒加载
const HomePage = lazy(() => import('@/pages/index'))
const AboutPage = lazy(() => import('@/pages/about'))
const ReaderPage = lazy(() => import('@/pages/reader'))

// 路由配置
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/about',
    element: <AboutPage />,
  },
  {
    path: '/reader',
    element: <ReaderPage />,
  },
]

// 路由映射表（用于导航）
export const routeMap = {
  '/': '首页',
  '/about': '关于',
  '/reader': '阅读器',
} 