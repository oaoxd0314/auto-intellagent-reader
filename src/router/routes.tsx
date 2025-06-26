import { lazy } from 'react'
import { RouteObject } from 'react-router-dom'

const HomePage = lazy(() => import('@/pages/index'))
const AboutPage = lazy(() => import('@/pages/about'))
const PostsIndex = lazy(() => import('@/pages/posts/index'))
const PostDetail = lazy(() => import('@/pages/posts/[id]/index'))
const NotFoundPage = lazy(() => import('@/pages/404'))

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
    path: '/posts',
    element: <PostsIndex />,
  },
  {
    path: '/posts/:id',
    element: <PostDetail />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]

export const routeMap = {
  '/': '首頁',
  '/about': '關於',
  '/posts': '文章',
} 