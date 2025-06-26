import { useEffect, useState } from 'react'
import type { Post, PostInteraction, TextPosition } from '../types/post'
import { PostController } from '../controllers/PostController'

export interface UsePostInteractionsReturn {
    interactions: PostInteraction[]
    addMark: (postId: string, text: string, position: TextPosition) => void
    addComment: (postId: string, text: string, comment: string, position: TextPosition) => void
    addReply: (postId: string, content: string) => void
    getMarkStyles: () => string
}

export function usePostInteractions(post: Post): UsePostInteractionsReturn {
    const [interactions, setInteractions] = useState<PostInteraction[]>([])
    const postController = PostController.getInstance()

    /**
     * 加載互動記錄
     */
    useEffect(() => {
        postController.loadInteractions()
        setInteractions(postController.getInteractions(post.id))
    }, [post.id, postController])

    /**
     * 添加標記
     */
    const addMark = (postId: string, text: string, position: TextPosition) => {
        postController.addMark(postId, text, position)
        setInteractions(postController.getInteractions(postId))
    }

    /**
     * 添加評論
     */
    const addComment = (postId: string, text: string, comment: string, position: TextPosition) => {
        postController.addComment(postId, text, comment, position)
        setInteractions(postController.getInteractions(postId))
    }

    /**
     * 添加回覆
     */
    const addReply = (postId: string, content: string) => {
        postController.addReply(postId, content)
        setInteractions(postController.getInteractions(postId))
    }

    /**
     * 獲取標記樣式
     */
    const getMarkStyles = (): string => {
        const markInteractions = interactions.filter((i: PostInteraction) => i.type === 'mark' && i.selectedText)

        if (markInteractions.length === 0) return ''

        return markInteractions.map((mark: PostInteraction) => `
      .prose [data-text*="${mark.selectedText}"] {
        background-color: #fef08a;
        padding: 0 0.25rem;
        border-radius: 0.25rem;
        cursor: pointer;
      }
      .prose [data-text*="${mark.selectedText}"]:hover::after {
        content: "標記於 ${new Date(mark.timestamp).toLocaleDateString()}";
        position: absolute;
        background: #374151;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        margin-top: 1.5rem;
        margin-left: -2rem;
        z-index: 10;
      }
    `).join('\n')
    }

    return {
        interactions,
        addMark,
        addComment,
        addReply,
        getMarkStyles
    }
} 