import { AbstractController } from './AbstractController'
import type { Post, PostInteraction, TextPosition } from '../types/post'
import { PostService } from '../services/PostService'

/**
 * 文章控制器狀態
 */
interface PostControllerState {
    // 數據緩存
    posts: Post[]
    postsCache: Map<string, Post>
    tags: string[]

    // 載入狀態
    isLoadingPosts: boolean
    isLoadingPost: boolean
    isLoadingTags: boolean

    // 錯誤狀態
    postsError: string | null
    postError: string | null
    tagsError: string | null

    // 業務狀態
    currentPost: Post | null
    searchFilters: {
        tag?: string
        searchTerm?: string
    }
    viewMode: 'list' | 'grid' | 'detail'
    interactions: PostInteraction[]

    // 緩存控制
    postsLastFetched: number | null
    tagsLastFetched: number | null
    cacheTimeout: number
}

/**
 * 文章控制器 - 完整的數據管理和業務邏輯協調
 * 替代 TanStack Query，提供統一的數據管理接口
 */
export class PostController extends AbstractController<PostControllerState> {
    private static instance: PostController | null = null

    constructor() {
        super('PostController', {
            // 數據緩存
            posts: [],
            postsCache: new Map(),
            tags: [],

            // 載入狀態
            isLoadingPosts: false,
            isLoadingPost: false,
            isLoadingTags: false,

            // 錯誤狀態
            postsError: null,
            postError: null,
            tagsError: null,

            // 業務狀態
            currentPost: null,
            searchFilters: {},
            viewMode: 'list',
            interactions: [],

            // 緩存控制
            postsLastFetched: null,
            tagsLastFetched: null,
            cacheTimeout: 5 * 60 * 1000 // 5分鐘緩存
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
        this.loadInteractions()
    }

    protected onDestroy(): void {
        this.log('PostController destroyed')
        PostController.instance = null
    }

    /**
     * 檢查緩存是否有效
     */
    private isCacheValid(lastFetched: number | null): boolean {
        if (!lastFetched) return false
        return Date.now() - lastFetched < this.state.cacheTimeout
    }

    /**
     * 獲取所有文章
     */
    async getAllPosts(forceRefresh: boolean = false): Promise<Post[]> {
        if (this.state.isDestroyed) return []

        // 檢查緩存
        if (!forceRefresh && this.state.posts.length > 0 && this.isCacheValid(this.state.postsLastFetched)) {
            return this.state.posts
        }

        this.setState({
            isLoadingPosts: true,
            postsError: null
        })

        try {
            const posts = await PostService.getAllPosts()

            // 更新緩存
            const postsCache = new Map()
            posts.forEach(post => postsCache.set(post.id, post))

            this.setState({
                posts,
                postsCache,
                postsLastFetched: Date.now(),
                isLoadingPosts: false,
                postsError: null
            })

            this.emit('postsLoaded', posts)
            return posts
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '載入文章失敗'
            this.setState({
                isLoadingPosts: false,
                postsError: errorMessage
            })
            this.emit('postsError', errorMessage)
            throw error
        }
    }

    /**
     * 獲取單個文章
     */
    async getPostById(id: string, forceRefresh: boolean = false): Promise<Post | null> {
        if (this.state.isDestroyed) return null

        // 檢查緩存
        if (!forceRefresh && this.state.postsCache.has(id)) {
            const cachedPost = this.state.postsCache.get(id)!
            this.setCurrentPost(cachedPost)
            return cachedPost
        }

        this.setState({
            isLoadingPost: true,
            postError: null
        })

        try {
            const post = await PostService.getPostById(id)

            if (post) {
                // 更新緩存
                const newCache = new Map(this.state.postsCache)
                newCache.set(id, post)
                this.setState({
                    postsCache: newCache,
                    isLoadingPost: false,
                    postError: null
                })

                this.setCurrentPost(post)
                this.emit('postLoaded', post)
            } else {
                this.setState({
                    isLoadingPost: false,
                    postError: '文章不存在'
                })
            }

            return post ?? null
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '載入文章失敗'
            this.setState({
                isLoadingPost: false,
                postError: errorMessage
            })
            this.emit('postError', errorMessage)
            throw error
        }
    }

    /**
     * 獲取所有標籤
     */
    async getAllTags(forceRefresh: boolean = false): Promise<string[]> {
        if (this.state.isDestroyed) return []

        // 檢查緩存
        if (!forceRefresh && this.state.tags.length > 0 && this.isCacheValid(this.state.tagsLastFetched)) {
            return this.state.tags
        }

        this.setState({
            isLoadingTags: true,
            tagsError: null
        })

        try {
            const tags = await PostService.getAllTags()

            this.setState({
                tags,
                tagsLastFetched: Date.now(),
                isLoadingTags: false,
                tagsError: null
            })

            this.emit('tagsLoaded', tags)
            return tags
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '載入標籤失敗'
            this.setState({
                isLoadingTags: false,
                tagsError: errorMessage
            })
            this.emit('tagsError', errorMessage)
            throw error
        }
    }

    /**
     * 清除錯誤狀態
     */
    clearErrors(): void {
        this.setState({
            postsError: null,
            postError: null,
            tagsError: null
        })
    }

    /**
     * 清除特定錯誤
     */
    clearError(type: 'posts' | 'post' | 'tags'): void {
        this.setState({
            [`${type}Error`]: null
        } as Partial<PostControllerState>)
    }

    /**
     * 獲取載入狀態
     */
    getLoadingState(): {
        isLoadingPosts: boolean
        isLoadingPost: boolean
        isLoadingTags: boolean
        isLoadingAny: boolean
    } {
        return {
            isLoadingPosts: this.state.isLoadingPosts,
            isLoadingPost: this.state.isLoadingPost,
            isLoadingTags: this.state.isLoadingTags,
            isLoadingAny: this.state.isLoadingPosts || this.state.isLoadingPost || this.state.isLoadingTags
        }
    }

    /**
     * 獲取錯誤狀態
     */
    getErrorState(): {
        postsError: string | null
        postError: string | null
        tagsError: string | null
        hasAnyError: boolean
    } {
        return {
            postsError: this.state.postsError,
            postError: this.state.postError,
            tagsError: this.state.tagsError,
            hasAnyError: !!(this.state.postsError || this.state.postError || this.state.tagsError)
        }
    }

    /**
     * 獲取緩存的文章
     */
    getCachedPosts(): Post[] {
        return [...this.state.posts]
    }

    /**
     * 獲取緩存的標籤
     */
    getCachedTags(): string[] {
        return [...this.state.tags]
    }

    /**
     * 獲取緩存的文章
     */
    getCachedPost(id: string): Post | null {
        return this.state.postsCache.get(id) ?? null
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