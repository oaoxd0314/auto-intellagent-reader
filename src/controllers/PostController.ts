import { AbstractController } from './AbstractController'
import type { Post, PostInteraction, TextPosition } from '../types/post'

/**
 * 文章控制器狀態
 */
interface PostControllerState {
    currentPost: Post | null
    searchFilters: {
        tag?: string
        searchTerm?: string
    }
    viewMode: 'list' | 'grid' | 'detail'
    interactions: PostInteraction[]
}

/**
 * 文章控制器 - 處理複雜業務邏輯
 * 負責協調文章相關的複雜業務流程和狀態管理
 * 簡單的 CRUD 操作由 TanStack Query 處理
 */
export class PostController extends AbstractController<PostControllerState> {
    private static instance: PostController | null = null

    constructor() {
        super('PostController', {
            currentPost: null,
            searchFilters: {},
            viewMode: 'list',
            interactions: []
        }, {
            enableLogging: true,
            debugMode: false
        })
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

    /**
     * 設置當前文章 - 業務邏輯：導航狀態管理
     */
    setCurrentPost(post: Post | null): void {
        if (this.state.isDestroyed) {
            // 組件卸載時的正常情況，不需要顯示錯誤
            return
        }

        this.setState({ currentPost: post })
        this.emit('currentPostChanged', post)

        // 業務邏輯：記錄閱讀歷史
        if (post) {
            this.recordReadingHistory(post)
        }
    }

    /**
     * 複雜業務邏輯：智能文章推薦
     */
    getRecommendedPosts(currentPost: Post, allPosts: Post[], limit: number = 3): Post[] {
        if (this.state.isDestroyed) {
            // 組件卸載時的正常情況，返回空數組
            return []
        }

        if (!currentPost.tags || currentPost.tags.length === 0) {
            return allPosts.slice(0, limit)
        }

        // 計算文章相似度
        const scoredPosts = allPosts
            .filter(post => post.id !== currentPost.id)
            .map(post => ({
                post,
                score: this.calculateSimilarityScore(currentPost, post)
            }))
            .sort((a, b) => b.score - a.score)

        return scoredPosts.slice(0, limit).map(item => item.post)
    }

    /**
     * 複雜業務邏輯：文章相似度計算
     */
    private calculateSimilarityScore(post1: Post, post2: Post): number {
        if (!post1.tags || !post2.tags) return 0

        const tags1 = new Set(post1.tags)
        const tags2 = new Set(post2.tags)
        const intersection = new Set([...tags1].filter(tag => tags2.has(tag)))

        // Jaccard 相似度
        const union = new Set([...tags1, ...tags2])
        return intersection.size / union.size
    }

    /**
     * 複雜業務邏輯：高級搜索和篩選
     */
    advancedSearch(posts: Post[], filters: {
        searchTerm?: string
        tags?: string[]
        dateRange?: { start: Date; end: Date }
        sortBy?: 'date' | 'title' | 'relevance'
    }): Post[] {
        if (this.state.isDestroyed) {
            // 組件卸載時的正常情況，返回空數組
            return []
        }

        let filteredPosts = [...posts]

        // 文字搜索
        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase()
            filteredPosts = filteredPosts.filter(post =>
                post.title.toLowerCase().includes(term) ||
                post.author.toLowerCase().includes(term) ||
                post.tags?.some(tag => tag.toLowerCase().includes(term))
            )
        }

        // 標籤篩選
        if (filters.tags && filters.tags.length > 0) {
            filteredPosts = filteredPosts.filter(post =>
                post.tags && filters.tags!.some(tag => post.tags!.includes(tag))
            )
        }

        // 日期範圍篩選
        if (filters.dateRange) {
            filteredPosts = filteredPosts.filter(post => {
                const postDate = new Date(post.date)
                return postDate >= filters.dateRange!.start && postDate <= filters.dateRange!.end
            })
        }

        // 排序
        if (filters.sortBy) {
            filteredPosts = this.sortPosts(filteredPosts, filters.sortBy)
        }

        return filteredPosts
    }

    /**
     * 複雜業務邏輯：文章排序
     */
    private sortPosts(posts: Post[], sortBy: 'date' | 'title' | 'relevance'): Post[] {
        switch (sortBy) {
            case 'date':
                return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            case 'title':
                return posts.sort((a, b) => a.title.localeCompare(b.title))
            case 'relevance':
                // 基於當前文章的相關性排序
                if (this.state.currentPost) {
                    return posts.sort((a, b) =>
                        this.calculateSimilarityScore(this.state.currentPost!, b) -
                        this.calculateSimilarityScore(this.state.currentPost!, a)
                    )
                }
                return posts
            default:
                return posts
        }
    }

    /**
     * 複雜業務邏輯：閱讀進度追蹤
     */
    private recordReadingHistory(post: Post): void {
        const history = this.getReadingHistory()
        const existingIndex = history.findIndex(item => item.postId === post.id)

        const historyItem = {
            postId: post.id,
            title: post.title,
            readAt: new Date().toISOString(),
            readCount: existingIndex >= 0 ? history[existingIndex].readCount + 1 : 1
        }

        if (existingIndex >= 0) {
            history[existingIndex] = historyItem
        } else {
            history.unshift(historyItem)
        }

        // 只保留最近 50 條記錄
        const trimmedHistory = history.slice(0, 50)
        localStorage.setItem('reading-history', JSON.stringify(trimmedHistory))

        this.emit('readingHistoryUpdated', historyItem)
    }

    /**
     * 業務邏輯：獲取閱讀歷史
     */
    getReadingHistory(): Array<{
        postId: string
        title: string
        readAt: string
        readCount: number
    }> {
        try {
            const history = localStorage.getItem('reading-history')
            return history ? JSON.parse(history) : []
        } catch {
            return []
        }
    }

    /**
     * 設置搜索篩選器
     */
    setSearchFilters(filters: Partial<PostControllerState['searchFilters']>): void {
        if (this.state.isDestroyed) {
            // 組件卸載時的正常情況，靜默返回
            return
        }

        this.setState({
            searchFilters: { ...this.state.searchFilters, ...filters }
        })
        this.emit('searchFiltersChanged', this.state.searchFilters)
    }

    /**
     * 設置視圖模式
     */
    setViewMode(mode: PostControllerState['viewMode']): void {
        if (this.state.isDestroyed) {
            // 組件卸載時的正常情況，靜默返回
            return
        }

        this.setState({ viewMode: mode })
        this.emit('viewModeChanged', mode)
    }

    /**
     * 添加文章回覆
     */
    addReply(postId: string, content: string): void {
        if (this.state.isDestroyed) return

        const interaction: PostInteraction = {
            id: `reply-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            postId,
            type: 'reply',
            content,
            timestamp: new Date().toISOString()
        }

        this.setState({
            interactions: [...this.state.interactions, interaction]
        })

        // 持久化到 localStorage
        this.saveInteractions()
        this.emit('interactionAdded', interaction)
    }

    /**
     * 添加文字標記
     */
    addMark(postId: string, selectedText: string, position: TextPosition): void {
        if (this.state.isDestroyed) return

        const interaction: PostInteraction = {
            id: `mark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            postId,
            type: 'mark',
            content: '標記',
            selectedText,
            position,
            timestamp: new Date().toISOString()
        }

        this.setState({
            interactions: [...this.state.interactions, interaction]
        })

        this.saveInteractions()
        this.emit('interactionAdded', interaction)
    }

    /**
     * 添加文字評論
     */
    addComment(postId: string, selectedText: string, comment: string, position: TextPosition): void {
        if (this.state.isDestroyed) return

        const interaction: PostInteraction = {
            id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            postId,
            type: 'comment',
            content: comment,
            selectedText,
            position,
            timestamp: new Date().toISOString()
        }

        this.setState({
            interactions: [...this.state.interactions, interaction]
        })

        this.saveInteractions()
        this.emit('interactionAdded', interaction)
    }

    /**
     * 獲取指定文章的互動記錄
     */
    getInteractions(postId: string): PostInteraction[] {
        return this.state.interactions.filter(interaction => interaction.postId === postId)
    }

    /**
     * 獲取所有互動記錄
     */
    getAllInteractions(): PostInteraction[] {
        return [...this.state.interactions]
    }

    /**
     * 刪除互動記錄
     */
    removeInteraction(interactionId: string): void {
        if (this.state.isDestroyed) return

        this.setState({
            interactions: this.state.interactions.filter(i => i.id !== interactionId)
        })

        this.saveInteractions()
        this.emit('interactionRemoved', interactionId)
    }

    /**
     * 清除指定文章的所有互動記錄
     */
    clearInteractions(postId: string): void {
        if (this.state.isDestroyed) return

        this.setState({
            interactions: this.state.interactions.filter(i => i.postId !== postId)
        })

        this.saveInteractions()
        this.emit('interactionsCleared', postId)
    }

    /**
     * 保存互動記錄到 localStorage
     */
    private saveInteractions(): void {
        try {
            localStorage.setItem('post-interactions', JSON.stringify(this.state.interactions))
        } catch (error) {
            this.log('Failed to save interactions to localStorage', error)
        }
    }

    /**
     * 從 localStorage 載入互動記錄
     */
    loadInteractions(): void {
        if (this.state.isDestroyed) return

        try {
            const saved = localStorage.getItem('post-interactions')
            if (saved) {
                const interactions = JSON.parse(saved) as PostInteraction[]

                // 開發模式下，清理可能過時的互動記錄
                if (process.env.NODE_ENV === 'development') {
                    const now = Date.now()
                    const filteredInteractions = interactions.filter(interaction => {
                        const interactionTime = new Date(interaction.timestamp).getTime()
                        // 只保留最近 1 小時內的互動記錄，避免 hot reload 導致的位置錯亂
                        return now - interactionTime < 60 * 60 * 1000
                    })

                    if (filteredInteractions.length !== interactions.length) {
                        this.setState({ interactions: filteredInteractions })
                        this.saveInteractions()
                        this.log('Cleaned up outdated interactions in dev mode')
                        return
                    }
                }

                this.setState({ interactions })
                this.emit('interactionsLoaded', interactions)
            }
        } catch (error) {
            this.log('Failed to load interactions from localStorage', error)
        }
    }

    /**
     * 獲取互動統計
     */
    getInteractionStats(postId?: string): {
        totalInteractions: number
        replies: number
        marks: number
        comments: number
        byPost?: Record<string, number>
    } {
        const interactions = postId
            ? this.getInteractions(postId)
            : this.state.interactions

        const stats = {
            totalInteractions: interactions.length,
            replies: interactions.filter(i => i.type === 'reply').length,
            marks: interactions.filter(i => i.type === 'mark').length,
            comments: interactions.filter(i => i.type === 'comment').length
        }

        if (!postId) {
            // 按文章統計
            const byPost: Record<string, number> = {}
            this.state.interactions.forEach(interaction => {
                byPost[interaction.postId] = (byPost[interaction.postId] || 0) + 1
            })
            return { ...stats, byPost }
        }

        return stats
    }

    /**
     * 清理所有 localStorage 中的互動記錄（開發用）
     */
    clearAllStoredInteractions(): void {
        try {
            localStorage.removeItem('post-interactions')
            this.setState({ interactions: [] })
            this.log('Cleared all stored interactions')
        } catch (error) {
            this.log('Failed to clear stored interactions', error)
        }
    }

    /**
     * 獲取當前狀態的快照
     */
    getSnapshot() {
        return {
            currentPost: this.state.currentPost ? { ...this.state.currentPost } : null,
            searchFilters: { ...this.state.searchFilters },
            viewMode: this.state.viewMode,
            interactions: [...this.state.interactions],
            readingHistory: this.getReadingHistory(),
            interactionStats: this.getInteractionStats()
        }
    }
} 