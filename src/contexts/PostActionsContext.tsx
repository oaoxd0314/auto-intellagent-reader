import React, { createContext, useContext, ReactNode } from 'react'
import { PostController } from '../controllers/PostController'
import type { Post, PostInteraction, TextPosition } from '../types/post'

/**
 * PostActions Context 類型定義
 * 專注於 CUD 操作和複雜業務邏輯
 */
interface PostActionsContextType {
  // 閱讀記錄
  recordReading: (post: Post) => void
  
  // 推薦系統
  getRecommendedPosts: (currentPost: Post, limit?: number) => Post[]
  
  // 互動管理
  addInteraction: (postId: string, interaction: Omit<PostInteraction, 'id' | 'postId' | 'timestamp'>) => void
  removeInteraction: (interactionId: string) => void
  getInteractions: (postId: string) => PostInteraction[]
  
  // 統計資訊
  getInteractionStats: (postId?: string) => {
    totalInteractions: number
    replies: number
    marks: number
    comments: number
    byPost?: Record<string, number>
  }
}

/**
 * Context
 */
const PostActionsContext = createContext<PostActionsContextType | undefined>(undefined)

/**
 * Provider
 */
export function PostActionsProvider({ children }: { children: ReactNode }) {
  const controller = PostController.getInstance()

  const recordReading = (post: Post) => {
    controller.setCurrentPost(post)
  }

  const getRecommendedPosts = (currentPost: Post, limit: number = 3) => {
    const allPosts = controller.getCachedPosts()
    return controller.getRecommendedPosts(currentPost, allPosts, limit)
  }

  const addInteraction = (postId: string, interaction: Omit<PostInteraction, 'id' | 'postId' | 'timestamp'>) => {
    switch (interaction.type) {
      case 'reply':
        controller.addReply(postId, interaction.content)
        break
      case 'mark':
        if (interaction.selectedText && interaction.position) {
          controller.addMark(postId, interaction.selectedText, interaction.position)
        }
        break
      case 'comment':
        if (interaction.selectedText && interaction.position) {
          controller.addComment(postId, interaction.selectedText, interaction.content, interaction.position)
        }
        break
    }
  }

  const removeInteraction = (interactionId: string) => {
    controller.removeInteraction(interactionId)
  }

  const getInteractions = (postId: string) => {
    return controller.getInteractions(postId)
  }

  const getInteractionStats = (postId?: string) => {
    return controller.getInteractionStats(postId)
  }

  const value: PostActionsContextType = {
    recordReading,
    getRecommendedPosts,
    addInteraction,
    removeInteraction,
    getInteractions,
    getInteractionStats,
  }

  return (
    <PostActionsContext.Provider value={value}>
      {children}
    </PostActionsContext.Provider>
  )
}

/**
 * Hook
 */
export function usePostActions() {
  const context = useContext(PostActionsContext)
  if (context === undefined) {
    throw new Error('usePostActions must be used within a PostActionsProvider')
  }
  return context
} 