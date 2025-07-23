import React, { useEffect, useRef } from 'react'
import { behaviorEventCollector } from '../lib/BehaviorEventCollector'

/**
 * 上下文工廠
 */
export const BehaviorContext = {
  post: (postId: string) => `post:${postId}`,
  postList: (category?: string) => category ? `post-list:${category}` : 'post-list',
  search: (query: string) => `search:${encodeURIComponent(query)}`,
  custom: (context: string) => `custom:${context}`
}

interface BehaviorTrackerProps {
  children: React.ReactNode
  context?: string | null
  trackScroll?: boolean
  trackClick?: boolean
  trackTextSelection?: boolean
  trackHover?: boolean
  className?: string
  as?: keyof JSX.IntrinsicElements
}

/**
 * 行為追蹤 Wrapper Component
 * 
 * 使用方式：
 * ```tsx
 * // 自動追蹤所有事件
 * <BehaviorTracker context={BehaviorContext.post(postId)}>
 *   <PostContent />
 * </BehaviorTracker>
 * 
 * // 只追蹤特定事件
 * <BehaviorTracker 
 *   context={BehaviorContext.postList()} 
 *   trackScroll={true}
 *   trackClick={false}
 * >
 *   <PostList />
 * </BehaviorTracker>
 * ```
 */
export function BehaviorTracker({
  children,
  context,
  trackScroll = true,
  trackClick = true,
  trackTextSelection = true,
  trackHover = false, // hover 事件太頻繁，默認關閉
  className,
  as: Component = 'div'
}: BehaviorTrackerProps) {
  const containerRef = useRef<HTMLElement>(null)

  // 自動管理上下文
  useEffect(() => {
    if (context) {
      behaviorEventCollector.setCurrentContext(context)
      return () => behaviorEventCollector.setCurrentContext(null)
    }
  }, [context])

  // 事件處理函數
  const handleScroll = (event: React.UIEvent) => {
    if (!trackScroll) return
    
    const target = event.target as HTMLElement
    behaviorEventCollector.collectControllerEvent('UI', 'scroll', {
      scrollTop: target.scrollTop,
      scrollPercentage: target.scrollHeight > target.clientHeight ? 
        Math.round((target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100) : 0
    }, { level: 'debug', category: 'ui-interaction' })
  }

  const handleClick = (event: React.MouseEvent) => {
    if (!trackClick) return
    
    const target = event.target as HTMLElement
    behaviorEventCollector.collectControllerEvent('UI', 'click', {
      elementType: target.tagName.toLowerCase(),
      className: target.className,
      textContent: target.textContent?.substring(0, 50)
    }, { level: 'info', category: 'ui-interaction' })
  }

  const handleMouseUp = () => {
    if (!trackTextSelection) return
    
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      behaviorEventCollector.collectControllerEvent('UI', 'text_selection', {
        selectedText: selection.toString().substring(0, 100),
        selectionLength: selection.toString().length
      }, { level: 'info', category: 'ui-interaction' })
    }
  }

  const handleMouseEnter = (event: React.MouseEvent) => {
    if (!trackHover) return
    
    const target = event.target as HTMLElement
    behaviorEventCollector.collectControllerEvent('UI', 'hover_enter', {
      elementType: target.tagName.toLowerCase(),
      className: target.className
    }, { level: 'debug', category: 'ui-interaction' })
  }

  return React.createElement(
    Component,
    {
      ref: containerRef,
      className,
      onScroll: handleScroll,
      onClick: handleClick,
      onMouseUp: handleMouseUp,
      onMouseEnter: trackHover ? handleMouseEnter : undefined,
    },
    children
  )
}

/**
 * 預設的頁面級 BehaviorTracker
 */
export function PageBehaviorTracker({ 
  children, 
  context, 
  className 
}: { 
  children: React.ReactNode
  context?: string | null
  className?: string 
}) {
  return (
    <BehaviorTracker
      context={context}
      trackScroll={true}
      trackClick={true}
      trackTextSelection={true}
      trackHover={false}
      className={className}
      as="main"
    >
      {children}
    </BehaviorTracker>
  )
}

/**
 * 內容區域專用的 BehaviorTracker
 */
export function ContentBehaviorTracker({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <BehaviorTracker
      trackScroll={true}
      trackClick={true}
      trackTextSelection={true}
      trackHover={false}
      className={className}
      as="article"
    >
      {children}
    </BehaviorTracker>
  )
}