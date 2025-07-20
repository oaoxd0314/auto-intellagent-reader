import { AbstractController, createActionMap } from './AbstractController'
import type { PostInteraction, InteractionType } from '../types/post'

/**
 * InteractionController - 純 Action Handler 實現
 * 專注於用戶互動業務邏輯協調和事件發送
 */
export class InteractionController extends AbstractController {
    private static instance: InteractionController | null = null

    // Action 映射表
    private actionMap = createActionMap([
        { type: 'ADD_REPLY', handler: this.addReplyAction.bind(this), description: '添加回覆' },
        { type: 'ADD_COMMENT', handler: this.addCommentAction.bind(this), description: '添加評論' },
        { type: 'ADD_HIGHLIGHT', handler: this.addHighlightAction.bind(this), description: '添加高亮' },
        { type: 'REMOVE_INTERACTION', handler: this.removeInteractionAction.bind(this), description: '移除互動' },
        { type: 'EDIT_REPLY', handler: this.editReplyAction.bind(this), description: '編輯回覆' },
        { type: 'GET_INTERACTIONS', handler: this.getInteractionsAction.bind(this), description: '獲取互動記錄' },
        { type: 'GET_STATS', handler: this.getStatsAction.bind(this), description: '獲取互動統計' },
        { type: 'CLEAR_POST_INTERACTIONS', handler: this.clearPostInteractionsAction.bind(this), description: '清空文章互動' }
    ])

    // 單例模式
    static getInstance(): InteractionController {
        if (!InteractionController.instance) {
            InteractionController.instance = new InteractionController()
        }
        return InteractionController.instance
    }

    private constructor() {
        super('InteractionController')
    }

    protected onInitialize(): void {
        this.log('InteractionController initialized')
    }

    protected onDestroy(): void {
        this.log('InteractionController destroyed')
        InteractionController.instance = null
    }

    // ===== AbstractController 實現 =====

    /**
     * 統一 Action 處理入口
     */
    async executeAction(actionType: string, payload?: any): Promise<void> {
        const handler = this.actionMap[actionType]
        
        if (!handler) {
            this.emit('actionError', {
                actionType,
                error: `Unknown action: ${actionType}`,
                availableActions: Object.keys(this.actionMap)
            })
            return
        }

        this.log(`Executing action: ${actionType}`, payload)

        try {
            await handler(payload)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            this.emit('actionError', {
                actionType,
                payload,
                error: errorMessage
            })
            this.log(`Action failed: ${actionType}`, errorMessage)
        }
    }

    /**
     * 獲取支援的 Action 列表
     */
    getSupportedActions(): string[] {
        return Object.keys(this.actionMap)
    }

    // ===== Action Handlers =====

    /**
     * 添加回覆 Action
     */
    private async addReplyAction(payload: { postId: string; content: string }): Promise<void> {
        try {
            // 業務驗證
            if (!payload.postId?.trim()) {
                throw new Error('Post ID is required')
            }

            if (!payload.content?.trim()) {
                throw new Error('Reply content cannot be empty')
            }

            if (payload.content.length > 1000) {
                throw new Error('Reply content is too long (max 1000 characters)')
            }

            // 模擬創建回覆（這裡應該調用 InteractionService）
            const reply: PostInteraction = {
                id: `reply-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                postId: payload.postId,
                type: 'reply',
                content: payload.content.trim(),
                timestamp: new Date().toISOString()
            }

            this.emit('replyAdded', reply)
            this.emit('interactionAdded', reply)
            this.log(`Reply added to post ${payload.postId}`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to add reply'
            this.emit('replyError', errorMessage)
            throw error
        }
    }

    /**
     * 添加評論 Action
     */
    private async addCommentAction(payload: {
        postId: string
        sectionId: string
        selectedText: string
        content: string
    }): Promise<void> {
        try {
            // 業務驗證
            if (!payload.postId?.trim() || !payload.sectionId?.trim()) {
                throw new Error('Post ID and section ID are required')
            }

            if (!payload.content?.trim()) {
                throw new Error('Comment content cannot be empty')
            }

            if (payload.content.length > 500) {
                throw new Error('Comment content is too long (max 500 characters)')
            }

            const comment: PostInteraction = {
                id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                postId: payload.postId,
                type: 'comment',
                content: payload.content.trim(),
                selectedText: payload.selectedText?.trim(),
                position: { start: 0, end: 0, sectionId: payload.sectionId },
                timestamp: new Date().toISOString()
            }

            this.emit('commentAdded', comment)
            this.emit('interactionAdded', comment)
            this.log(`Comment added to post ${payload.postId}, section ${payload.sectionId}`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to add comment'
            this.emit('commentError', errorMessage)
            throw error
        }
    }

    /**
     * 編輯回覆 Action
     */
    private async editReplyAction(payload: { replyId: string; content: string }): Promise<void> {
        try {
            // 業務驗證
            if (!payload.content?.trim()) {
                throw new Error('Reply content cannot be empty')
            }

            if (payload.content.length > 1000) {
                throw new Error('Reply content is too long (max 1000 characters)')
            }

            // 模擬更新回覆
            const updatedReply: PostInteraction = {
                id: payload.replyId,
                postId: '', // 這裡應該從 service 獲取
                type: 'reply',
                content: payload.content.trim(),
                timestamp: new Date().toISOString()
            }

            this.emit('replyUpdated', updatedReply)
            this.emit('interactionUpdated', updatedReply)
            this.log(`Reply updated: ${payload.replyId}`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to edit reply'
            this.emit('replyError', errorMessage)
            throw error
        }
    }

    /**
     * 添加高亮 Action
     */
    private async addHighlightAction(payload: {
        postId: string
        sectionId: string
        selectedText: string
    }): Promise<void> {
        try {
            if (!payload.postId?.trim() || !payload.sectionId?.trim()) {
                throw new Error('Post ID and section ID are required')
            }

            if (!payload.selectedText?.trim()) {
                throw new Error('Selected text cannot be empty')
            }

            const highlight: PostInteraction = {
                id: `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                postId: payload.postId,
                type: 'mark',
                content: '', // 高亮不需要額外內容
                selectedText: payload.selectedText.trim(),
                position: { start: 0, end: 0, sectionId: payload.sectionId },
                timestamp: new Date().toISOString()
            }

            this.emit('highlightAdded', highlight)
            this.emit('interactionAdded', highlight)
            this.log(`Highlight added to post ${payload.postId}, section ${payload.sectionId}`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to add highlight'
            this.emit('highlightError', errorMessage)
            throw error
        }
    }

    /**
     * 移除互動 Action
     */
    private async removeInteractionAction(payload: { interactionId: string }): Promise<void> {
        try {
            if (!payload.interactionId?.trim()) {
                throw new Error('Interaction ID is required')
            }

            // 模擬刪除操作
            this.emit('interactionRemoved', payload.interactionId)
            this.log(`Interaction removed: ${payload.interactionId}`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to remove interaction'
            this.emit('interactionError', errorMessage)
            throw error
        }
    }

    /**
     * 獲取互動記錄 Action
     */
    private async getInteractionsAction(payload: {
        postId: string
        type?: InteractionType
        sectionId?: string
    }): Promise<void> {
        try {
            if (!payload.postId?.trim()) {
                throw new Error('Post ID is required')
            }

            // 模擬獲取互動記錄
            const mockInteractions: PostInteraction[] = []

            this.emit('interactionsLoaded', {
                postId: payload.postId,
                type: payload.type,
                sectionId: payload.sectionId,
                interactions: mockInteractions
            })
            
            this.log(`Interactions loaded for post ${payload.postId}${payload.type ? `, type: ${payload.type}` : ''}${payload.sectionId ? `, section: ${payload.sectionId}` : ''}`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load interactions'
            this.emit('interactionError', errorMessage)
            throw error
        }
    }

    /**
     * 獲取統計 Action
     */
    private async getStatsAction(payload: { postId: string }): Promise<void> {
        try {
            if (!payload.postId?.trim()) {
                throw new Error('Post ID is required')
            }

            // 模擬統計計算
            const stats = {
                replies: 0,
                comments: 0,
                highlights: 0,
                total: 0
            }

            this.emit('statsLoaded', {
                postId: payload.postId,
                stats
            })
            
            this.log(`Stats calculated for post ${payload.postId}`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to calculate stats'
            this.emit('statsError', errorMessage)
            throw error
        }
    }

    /**
     * 清空文章互動 Action
     */
    private async clearPostInteractionsAction(payload: { postId: string }): Promise<void> {
        try {
            if (!payload.postId?.trim()) {
                throw new Error('Post ID is required')
            }

            // 模擬清空操作
            this.emit('postInteractionsCleared', payload.postId)
            this.log(`All interactions cleared for post ${payload.postId}`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to clear interactions'
            this.emit('interactionError', errorMessage)
            throw error
        }
    }
} 