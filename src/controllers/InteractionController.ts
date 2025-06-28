import { AbstractController } from './AbstractController'
import { InteractionService } from '../services/InteractionService'
import type { PostInteraction, InteractionType } from '../types/post'

/**
 * 互動控制器 - 作為 Facade 協調所有互動相關的業務邏輯
 * 遵循 Controller-Facade Pattern，封裝複雜的業務操作
 */
export class InteractionController extends AbstractController {
    private static instance: InteractionController | null = null

    // 單例模式
    static getInstance(): InteractionController {
        if (!InteractionController.instance) {
            InteractionController.instance = new InteractionController()
        }
        return InteractionController.instance
    }

    private constructor() {
        super('InteractionController', {})
    }

    // 實現抽象方法
    protected onInitialize(): void {
        // 預載入數據或進行初始化設置
        console.log('InteractionController initialized')
    }

    protected onDestroy(): void {
        // 清理資源
        console.log('InteractionController destroyed')
    }

    // ==================== Reply 相關業務邏輯 ====================

    /**
     * 添加文章回覆
     */
    async addReply(postId: string, content: string): Promise<PostInteraction> {
        try {
            // 業務驗證
            if (!postId.trim()) {
                throw new Error('Post ID is required')
            }

            if (!content.trim()) {
                throw new Error('Reply content cannot be empty')
            }

            if (content.length > 1000) {
                throw new Error('Reply content is too long (max 1000 characters)')
            }

            // 創建回覆
            const reply = await InteractionService.createInteraction({
                postId,
                type: 'reply',
                content: content.trim()
            })

            // 發射事件通知其他組件
            this.emit('interactionAdded', reply)
            this.emit('replyAdded', reply)

            return reply
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to add reply'
            this.emit('error', errorMessage)
            throw error
        }
    }

    /**
     * 刪除回覆
     */
    async deleteReply(replyId: string): Promise<void> {
        try {
            // 驗證回覆是否存在且為 reply 類型
            const reply = await InteractionService.getInteractionById(replyId)
            if (!reply) {
                throw new Error('Reply not found')
            }

            if (reply.type !== 'reply') {
                throw new Error('Interaction is not a reply')
            }

            await InteractionService.deleteInteraction(replyId)

            // 發射事件
            this.emit('interactionRemoved', replyId)
            this.emit('replyRemoved', replyId)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete reply'
            this.emit('error', errorMessage)
            throw error
        }
    }

    /**
     * 編輯回覆
     */
    async editReply(replyId: string, content: string): Promise<PostInteraction> {
        try {
            // 業務驗證
            if (!content.trim()) {
                throw new Error('Reply content cannot be empty')
            }

            if (content.length > 1000) {
                throw new Error('Reply content is too long (max 1000 characters)')
            }

            const reply = await InteractionService.getInteractionById(replyId)
            if (!reply) {
                throw new Error('Reply not found')
            }

            if (reply.type !== 'reply') {
                throw new Error('Interaction is not a reply')
            }

            const updatedReply = await InteractionService.updateInteraction(replyId, {
                content: content.trim()
            })

            // 發射事件
            this.emit('interactionUpdated', updatedReply)
            this.emit('replyUpdated', updatedReply)

            return updatedReply
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to edit reply'
            this.emit('error', errorMessage)
            throw error
        }
    }

    // ==================== Comment 相關業務邏輯 ====================

    /**
     * 添加段落評論
     */
    async addComment(
        postId: string,
        sectionId: string,
        selectedText: string,
        content: string
    ): Promise<PostInteraction> {
        try {
            // 業務驗證
            if (!postId.trim() || !sectionId.trim()) {
                throw new Error('Post ID and section ID are required')
            }

            if (!content.trim()) {
                throw new Error('Comment content cannot be empty')
            }

            if (content.length > 500) {
                throw new Error('Comment content is too long (max 500 characters)')
            }

            const comment = await InteractionService.createInteraction({
                postId,
                type: 'comment',
                content: content.trim(),
                selectedText: selectedText.trim(),
                position: { start: 0, end: 0, sectionId }
            })

            this.emit('interactionAdded', comment)
            this.emit('commentAdded', comment)

            return comment
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to add comment'
            this.emit('error', errorMessage)
            throw error
        }
    }

    /**
     * 刪除評論
     */
    async deleteComment(commentId: string): Promise<void> {
        try {
            const comment = await InteractionService.getInteractionById(commentId)
            if (!comment) {
                throw new Error('Comment not found')
            }

            if (comment.type !== 'comment') {
                throw new Error('Interaction is not a comment')
            }

            await InteractionService.deleteInteraction(commentId)

            this.emit('interactionRemoved', commentId)
            this.emit('commentRemoved', commentId)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete comment'
            this.emit('error', errorMessage)
            throw error
        }
    }

    // ==================== Highlight 相關業務邏輯 ====================

    /**
     * 添加段落高亮
     */
    async addHighlight(
        postId: string,
        sectionId: string,
        selectedText: string
    ): Promise<PostInteraction> {
        try {
            if (!postId.trim() || !sectionId.trim()) {
                throw new Error('Post ID and section ID are required')
            }

            if (!selectedText.trim()) {
                throw new Error('Selected text cannot be empty')
            }

            const highlight = await InteractionService.createInteraction({
                postId,
                type: 'mark',
                content: '', // 高亮不需要額外內容
                selectedText: selectedText.trim(),
                position: { start: 0, end: 0, sectionId }
            })

            this.emit('interactionAdded', highlight)
            this.emit('highlightAdded', highlight)

            return highlight
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to add highlight'
            this.emit('error', errorMessage)
            throw error
        }
    }

    /**
     * 移除高亮
     */
    async removeHighlight(highlightId: string): Promise<void> {
        try {
            const highlight = await InteractionService.getInteractionById(highlightId)
            if (!highlight) {
                throw new Error('Highlight not found')
            }

            if (highlight.type !== 'mark') {
                throw new Error('Interaction is not a highlight')
            }

            await InteractionService.deleteInteraction(highlightId)

            this.emit('interactionRemoved', highlightId)
            this.emit('highlightRemoved', highlightId)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to remove highlight'
            this.emit('error', errorMessage)
            throw error
        }
    }

    // ==================== 查詢方法 ====================

    /**
     * 獲取文章的所有互動
     */
    async getInteractionsByPostId(postId: string): Promise<PostInteraction[]> {
        try {
            return await InteractionService.getInteractionsByPostId(postId)
        } catch (error) {
            this.emit('error', 'Failed to load interactions')
            return []
        }
    }

    /**
     * 獲取特定類型的互動
     */
    async getInteractionsByType(postId: string, type: InteractionType): Promise<PostInteraction[]> {
        try {
            return await InteractionService.getInteractionsByType(postId, type)
        } catch (error) {
            this.emit('error', 'Failed to load interactions')
            return []
        }
    }

    /**
     * 獲取段落的所有互動
     */
    async getInteractionsBySectionId(postId: string, sectionId: string): Promise<PostInteraction[]> {
        try {
            return await InteractionService.getInteractionsBySectionId(postId, sectionId)
        } catch (error) {
            this.emit('error', 'Failed to load section interactions')
            return []
        }
    }

    /**
     * 獲取文章的回覆列表
     */
    async getRepliesByPostId(postId: string): Promise<PostInteraction[]> {
        return this.getInteractionsByType(postId, 'reply')
    }

    /**
     * 獲取文章的評論列表
     */
    async getCommentsByPostId(postId: string): Promise<PostInteraction[]> {
        return this.getInteractionsByType(postId, 'comment')
    }

    /**
     * 獲取文章的高亮列表
     */
    async getHighlightsByPostId(postId: string): Promise<PostInteraction[]> {
        return this.getInteractionsByType(postId, 'mark')
    }

    // ==================== 統計方法 ====================

    /**
     * 獲取文章的互動統計
     */
    async getInteractionStats(postId: string): Promise<{
        replies: number
        comments: number
        highlights: number
        total: number
    }> {
        try {
            const interactions = await this.getInteractionsByPostId(postId)

            const stats = {
                replies: interactions.filter(i => i.type === 'reply').length,
                comments: interactions.filter(i => i.type === 'comment').length,
                highlights: interactions.filter(i => i.type === 'mark').length,
                total: interactions.length
            }

            return stats
        } catch (error) {
            this.emit('error', 'Failed to calculate interaction stats')
            return { replies: 0, comments: 0, highlights: 0, total: 0 }
        }
    }

    // ==================== 批量操作 ====================

    /**
     * 清空文章的所有互動
     */
    async clearPostInteractions(postId: string): Promise<void> {
        try {
            await InteractionService.deleteInteractionsByPostId(postId)
            this.emit('postInteractionsCleared', postId)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to clear interactions'
            this.emit('error', errorMessage)
            throw error
        }
    }

    // ==================== 初始化和清理 ====================

    // 移除重複的 initialize 方法，使用父類的 initialize

    async cleanup(): Promise<void> {
        // 清理資源，使用父類的 destroy 方法
        this.destroy()
    }
} 