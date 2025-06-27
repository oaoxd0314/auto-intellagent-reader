import { useEffect, useState } from 'react'
import type { Post, PostInteraction, TextPosition } from '../../../../../types/post'
import { PostController } from '../../../../../controllers/PostController'

export interface UsePostInteractionsReturn {
    interactions: PostInteraction[]

    // 標記相關
    addMark: (postId: string, text: string, position: TextPosition) => void

    // 評論相關
    addComment: (postId: string, text: string, comment: string, position: TextPosition) => void

    // 回覆相關
    replies: PostInteraction[]
    addReply: (postId: string, content: string) => void
    removeReply: (replyId: string) => void

    // 通用
    removeInteraction: (interactionId: string) => void
}

export function usePostInteractions(post: Post | undefined): UsePostInteractionsReturn {
    const [interactions, setInteractions] = useState<PostInteraction[]>([])
    const postController = PostController.getInstance()

    /**
     * 加載互動記錄
     */
    useEffect(() => {
        if (!post) return

        postController.loadInteractions()
        setInteractions(postController.getInteractions(post.id))
    }, [post?.id, postController])

    // 計算回覆列表
    const replies = interactions.filter(i => i.type === 'reply')

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
     * 刪除回覆 (專門的方法)
     */
    const removeReply = (replyId: string) => {
        if (!post) return

        postController.removeInteraction(replyId)
        setInteractions(postController.getInteractions(post.id))
    }

    /**
     * 刪除互動記錄 (通用方法)
     */
    const removeInteraction = (interactionId: string) => {
        if (!post) return

        postController.removeInteraction(interactionId)
        setInteractions(postController.getInteractions(post.id))
    }

    return {
        interactions,
        replies,
        addMark,
        addComment,
        addReply,
        removeReply,
        removeInteraction
    }
} 