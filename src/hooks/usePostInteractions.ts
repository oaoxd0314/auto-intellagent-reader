import { useEffect, useState } from 'react'
import type { Post, PostInteraction, TextPosition } from '../types/post'
import { PostController } from '../controllers/PostController'

export interface UsePostInteractionsReturn {
    interactions: PostInteraction[]
    addMark: (postId: string, text: string, position: TextPosition) => void
    addComment: (postId: string, text: string, comment: string, position: TextPosition) => void
    addReply: (postId: string, content: string) => void
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

    return {
        interactions,
        addMark,
        addComment,
        addReply
    }
} 