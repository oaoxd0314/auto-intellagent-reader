import { AbstractController, createActionMap } from './AbstractController'
import type { Post, PostInteraction, TextPosition } from '../types/post'
import { PostService } from '../services/PostService'

/**
 * 搜索篩選器類型
 */
interface SearchFilters {
    tag?: string
    tags?: string[]
    author?: string
    dateRange?: { start: Date; end: Date }
    sortBy?: 'date' | 'title' | 'relevance'
}

/**
 * PostController - 純 Action Handler 實現
 * 專注於業務邏輯協調和事件發送
 */
export class PostController extends AbstractController {
    private static instance: PostController | null = null

    // Action 映射表
    private actionMap = createActionMap([
        { type: 'LOAD_POSTS', handler: this.loadPosts.bind(this), description: '載入所有文章' },
        { type: 'LOAD_POST', handler: this.loadPost.bind(this), description: '載入單個文章' },
        { type: 'LOAD_TAGS', handler: this.loadTags.bind(this), description: '載入所有標籤' },
        { type: 'SEARCH_POSTS', handler: this.searchPosts.bind(this), description: '搜索文章' },
        { type: 'GET_RECOMMENDATIONS', handler: this.getRecommendations.bind(this), description: '獲取推薦文章' },
        { type: 'ADD_COMMENT', handler: this.addComment.bind(this), description: '添加評論' },
        { type: 'ADD_MARK', handler: this.addMark.bind(this), description: '添加標記' },
        { type: 'ADD_REPLY', handler: this.addReply.bind(this), description: '添加回覆' },
        { type: 'REMOVE_INTERACTION', handler: this.removeInteraction.bind(this), description: '刪除互動記錄' },
        { type: 'CLEAR_INTERACTIONS', handler: this.clearInteractions.bind(this), description: '清除文章所有互動記錄' },
        { type: 'ADD_TO_READING_HISTORY', handler: this.addToReadingHistory.bind(this), description: '添加到閱讀歷史' }
    ])

    constructor() {
        super('PostController')
    }

    /**
     * 單例模式
     */
    static getInstance(): PostController {
        if (!PostController.instance) {
            PostController.instance = new PostController()
        }
        return PostController.instance
    }

    protected onInitialize(): void {
        this.log('PostController initialized')
    }

    protected onDestroy(): void {
        this.log('PostController destroyed')
        PostController.instance = null
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
     * 載入所有文章 Action
     */
    private async loadPosts(payload?: { forceRefresh?: boolean }): Promise<void> {
        this.emit('loadingStarted', { type: 'posts' })
        
        try {
            const posts = await PostService.getAllPosts(payload?.forceRefresh)
            this.emit('postsLoaded', posts)
            this.log(`Loaded ${posts.length} posts`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '載入文章失敗'
            this.emit('postsError', errorMessage)
            throw error
        }
    }

    /**
     * 載入單個文章 Action
     */
    private async loadPost(payload: { id: string; forceRefresh?: boolean }): Promise<void> {
        this.emit('loadingStarted', { type: 'post', id: payload.id })
        
        try {
            const post = await PostService.getPostById(payload.id, payload.forceRefresh)
            
            if (post) {
                this.emit('postLoaded', post)
                // 業務邏輯：自動添加到閱讀歷史
                PostService.addToReadingHistory(post)
                this.emit('readingHistoryUpdated', post)
                this.log(`Loaded post: ${post.title}`)
            } else {
                this.emit('postError', '文章不存在')
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '載入文章失敗'
            this.emit('postError', errorMessage)
            throw error
        }
    }

    /**
     * 載入所有標籤 Action
     */
    private async loadTags(payload?: { forceRefresh?: boolean }): Promise<void> {
        this.emit('loadingStarted', { type: 'tags' })
        
        try {
            const tags = await PostService.getAllTags(payload?.forceRefresh)
            this.emit('tagsLoaded', tags)
            this.log(`Loaded ${tags.length} tags`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '載入標籤失敗'
            this.emit('tagsError', errorMessage)
            throw error
        }
    }

    /**
     * 搜索文章 Action
     */
    private async searchPosts(payload: { query: string; filters?: SearchFilters }): Promise<void> {
        this.emit('searchStarted', { query: payload.query, filters: payload.filters })
        
        try {
            const allPosts = await PostService.getAllPosts()
            const results = PostService.searchPosts(allPosts, payload.query, payload.filters)
            this.emit('searchCompleted', { query: payload.query, results, total: results.length })
            this.log(`Search completed: "${payload.query}" found ${results.length} results`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '搜索失敗'
            this.emit('searchError', errorMessage)
            throw error
        }
    }

    /**
     * 獲取推薦文章 Action
     */
    private async getRecommendations(payload: { currentPost: Post; limit?: number }): Promise<void> {
        try {
            const allPosts = await PostService.getAllPosts()
            const recommendations = PostService.getRecommendedPosts(
                payload.currentPost, 
                allPosts, 
                payload.limit || 3
            )
            this.emit('recommendationsLoaded', {
                currentPost: payload.currentPost,
                recommendations
            })
            this.log(`Generated ${recommendations.length} recommendations for post: ${payload.currentPost.title}`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '推薦文章載入失敗'
            this.emit('recommendationsError', errorMessage)
            throw error
        }
    }

    /**
     * 添加評論 Action
     */
    private async addComment(payload: { postId: string; selectedText: string; comment: string; position: TextPosition }): Promise<void> {
        try {
            // 業務驗證
            if (!payload.comment.trim() || payload.comment.trim().length < 3) {
                throw new Error('評論內容太短，至少需要3個字符')
            }

            const interaction = PostService.addComment(
                payload.postId, 
                payload.selectedText, 
                payload.comment, 
                payload.position
            )
            
            this.emit('commentAdded', interaction)
            this.log(`Comment added to post ${payload.postId}`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '添加評論失敗'
            this.emit('commentError', errorMessage)
            throw error
        }
    }

    /**
     * 添加標記 Action
     */
    private async addMark(payload: { postId: string; selectedText: string; position: TextPosition }): Promise<void> {
        try {
            const interaction = PostService.addMark(
                payload.postId, 
                payload.selectedText, 
                payload.position
            )
            
            this.emit('markAdded', interaction)
            this.log(`Mark added to post ${payload.postId}`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '添加標記失敗'
            this.emit('markError', errorMessage)
            throw error
        }
    }

    /**
     * 添加回覆 Action
     */
    private async addReply(payload: { postId: string; content: string }): Promise<void> {
        try {
            // 業務驗證
            if (!payload.content.trim() || payload.content.trim().length < 3) {
                throw new Error('回覆內容太短，至少需要3個字符')
            }

            const interaction = PostService.addReply(payload.postId, payload.content)
            
            this.emit('replyAdded', interaction)
            this.log(`Reply added to post ${payload.postId}`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '添加回覆失敗'
            this.emit('replyError', errorMessage)
            throw error
        }
    }

    /**
     * 刪除互動記錄 Action
     */
    private async removeInteraction(payload: { interactionId: string }): Promise<void> {
        try {
            PostService.removeInteraction(payload.interactionId)
            this.emit('interactionRemoved', payload.interactionId)
            this.log(`Interaction removed: ${payload.interactionId}`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '刪除互動記錄失敗'
            this.emit('interactionError', errorMessage)
            throw error
        }
    }

    /**
     * 清除文章所有互動記錄 Action
     */
    private async clearInteractions(payload: { postId: string }): Promise<void> {
        try {
            PostService.clearInteractions(payload.postId)
            this.emit('interactionsCleared', payload.postId)
            this.log(`All interactions cleared for post: ${payload.postId}`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '清除互動記錄失敗'
            this.emit('interactionError', errorMessage)
            throw error
        }
    }

    /**
     * 添加到閱讀歷史 Action
     */
    private async addToReadingHistory(payload: { post: Post }): Promise<void> {
        try {
            PostService.addToReadingHistory(payload.post)
            this.emit('readingHistoryUpdated', payload.post)
            this.log(`Added to reading history: ${payload.post.title}`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '添加閱讀歷史失敗'
            this.emit('historyError', errorMessage)
            throw error
        }
    }

    // ===== 輔助方法 (不是 Action Handlers) =====

    /**
     * 獲取互動統計 - 通過 PostService
     */
    getInteractionStats(postId?: string) {
        return PostService.getInteractionStats(postId)
    }

    /**
     * 獲取閱讀歷史 - 通過 PostService
     */
    getReadingHistory() {
        return PostService.getReadingHistory()
    }

    /**
     * 獲取緩存的文章 - 通過 PostService
     */
    getCachedPosts(): Post[] {
        return PostService.getCachedPosts()
    }

    /**
     * 獲取緩存的單個文章 - 通過 PostService
     */
    getCachedPost(id: string): Post | null {
        return PostService.getCachedPost(id)
    }

    /**
     * 獲取互動記錄 - 通過 PostService
     */
    getInteractions(postId: string): PostInteraction[] {
        return PostService.getInteractions(postId)
    }

    /**
     * 獲取所有互動記錄 - 通過 PostService
     */
    getAllInteractions(): PostInteraction[] {
        return PostService.getAllInteractions()
    }
} 