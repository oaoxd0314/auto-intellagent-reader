import { MarkdownFactory } from '../lib/MarkdownFactory'
import type { Post, PostInteraction, TextPosition } from '../types/post'

/**
 * 搜索過濾器
 */
interface SearchFilters {
    tag?: string
    tags?: string[]
    author?: string
    dateRange?: { start: Date; end: Date }
    sortBy?: 'date' | 'title' | 'relevance'
}

/**
 * 閱讀歷史項目
 */
interface ReadingHistoryItem {
    postId: string
    title: string
    readAt: string
    readCount: number
}

/**
 * PostService - 承擔所有數據、緩存、持久化邏輯
 * 從 Controller 搬移過來的完整數據管理層
 */
export class PostService {
    // ===== 緩存管理 =====
    private static cache = new Map<string, Post>()
    private static allPostsCache: Post[] | null = null
    private static tagsCache: string[] | null = null
    private static cacheTimeout = 5 * 60 * 1000 // 5分鐘緩存
    private static postsLastFetched: number | null = null
    private static tagsLastFetched: number | null = null

    // ===== 核心數據獲取 (包含緩存邏輯) =====

    /**
     * 獲取所有文章 - 包含完整緩存邏輯
     */
    static async getAllPosts(forceRefresh = false): Promise<Post[]> {
        // 檢查緩存有效性
        if (!forceRefresh && this.allPostsCache && this.isCacheValid(this.postsLastFetched)) {
            return this.allPostsCache
        }

        try {
            // 從 MarkdownFactory 獲取原始數據
            const posts = await MarkdownFactory.loadAllPosts()
            
            // 更新緩存
            this.allPostsCache = posts
            this.postsLastFetched = Date.now()
            
            // 同時更新單個文章緩存
            posts.forEach(post => this.cache.set(post.id, post))
            
            return posts
        } catch (error) {
            console.error('Failed to load all posts:', error)
            throw error
        }
    }

    /**
     * 獲取單個文章 - 包含緩存邏輯
     */
    static async getPostById(id: string, forceRefresh = false): Promise<Post | null> {
        // 檢查緩存
        if (!forceRefresh && this.cache.has(id)) {
            return this.cache.get(id)!
        }

        try {
            const post = await MarkdownFactory.loadPostById(id)
            if (post) {
                // 更新緩存
                this.cache.set(id, post)
                return post
            }
            return null
        } catch (error) {
            console.error(`Failed to load post ${id}:`, error)
            throw error
        }
    }

    /**
     * 獲取緩存的文章 - 無網路請求
     */
    static getCachedPost(id: string): Post | null {
        return this.cache.get(id) || null
    }

    /**
     * 獲取緩存的所有文章 - 無網路請求
     */
    static getCachedPosts(): Post[] {
        return this.allPostsCache ? [...this.allPostsCache] : []
    }

    /**
     * 獲取所有標籤 - 包含緩存邏輯
     */
    static async getAllTags(forceRefresh = false): Promise<string[]> {
        // 檢查緩存
        if (!forceRefresh && this.tagsCache && this.isCacheValid(this.tagsLastFetched)) {
            return this.tagsCache
        }

        try {
            const posts = await this.getAllPosts(forceRefresh)
            const tagSet = new Set<string>()

            posts.forEach(post => {
                if (post.tags) {
                    post.tags.forEach(tag => tagSet.add(tag))
                }
            })

            const tags = Array.from(tagSet).sort()
            
            // 更新緩存
            this.tagsCache = tags
            this.tagsLastFetched = Date.now()
            
            return tags
        } catch (error) {
            console.error('Failed to get all tags:', error)
            throw error
        }
    }

    /**
     * 獲取可用文章 ID
     */
    static getAvailablePostIds(): string[] {
        try {
            return MarkdownFactory.getAvailablePostIds()
        } catch (error) {
            console.error('Failed to get available post IDs:', error)
            return []
        }
    }

    // ===== 搜索和過濾業務邏輯 =====

    /**
     * 高級搜索 - 完整業務邏輯
     */
    static searchPosts(posts: Post[], query: string, filters: SearchFilters = {}): Post[] {
        let results = [...posts]

        // 文字搜索
        if (query.trim()) {
            const searchTerm = query.toLowerCase()
            results = results.filter(post =>
                post.title.toLowerCase().includes(searchTerm) ||
                post.author.toLowerCase().includes(searchTerm) ||
                post.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
            )
        }

        // 標籤篩選
        if (filters.tags && filters.tags.length > 0) {
            results = results.filter(post =>
                post.tags && filters.tags!.some(tag => post.tags!.includes(tag))
            )
        }

        // 單一標籤篩選
        if (filters.tag) {
            results = results.filter(post =>
                post.tags && post.tags.includes(filters.tag!)
            )
        }

        // 作者篩選
        if (filters.author) {
            results = results.filter(post => post.author === filters.author)
        }

        // 日期範圍篩選
        if (filters.dateRange) {
            results = results.filter(post => {
                const postDate = new Date(post.date)
                return postDate >= filters.dateRange!.start && postDate <= filters.dateRange!.end
            })
        }

        // 排序
        if (filters.sortBy) {
            results = this.sortPosts(results, filters.sortBy, query)
        }

        return results
    }

    /**
     * 智能文章推薦 - 業務邏輯
     */
    static getRecommendedPosts(currentPost: Post, allPosts: Post[], limit = 3): Post[] {
        if (!currentPost.tags || currentPost.tags.length === 0) {
            // 如果沒有標籤，返回最新文章
            return allPosts
                .filter(post => post.id !== currentPost.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, limit)
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

    // ===== 閱讀歷史管理 (持久化) =====

    /**
     * 添加到閱讀歷史
     */
    static addToReadingHistory(post: Post): void {
        try {
            const history = this.getReadingHistory()
            const existingIndex = history.findIndex(item => item.postId === post.id)

            const historyItem: ReadingHistoryItem = {
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
        } catch (error) {
            console.error('Failed to save reading history:', error)
        }
    }

    /**
     * 獲取閱讀歷史
     */
    static getReadingHistory(): ReadingHistoryItem[] {
        try {
            const history = localStorage.getItem('reading-history')
            return history ? JSON.parse(history) : []
        } catch (error) {
            console.error('Failed to load reading history:', error)
            return []
        }
    }

    // ===== 互動記錄管理 (持久化) =====

    /**
     * 添加評論
     */
    static addComment(postId: string, selectedText: string, comment: string, position: TextPosition): PostInteraction {
        const interaction: PostInteraction = {
            id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            postId,
            type: 'comment',
            content: comment,
            selectedText,
            position,
            timestamp: new Date().toISOString()
        }

        this.saveInteraction(interaction)
        return interaction
    }

    /**
     * 添加標記
     */
    static addMark(postId: string, selectedText: string, position: TextPosition): PostInteraction {
        const interaction: PostInteraction = {
            id: `mark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            postId,
            type: 'mark',
            content: '標記',
            selectedText,
            position,
            timestamp: new Date().toISOString()
        }

        this.saveInteraction(interaction)
        return interaction
    }

    /**
     * 添加回覆
     */
    static addReply(postId: string, content: string): PostInteraction {
        const interaction: PostInteraction = {
            id: `reply-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            postId,
            type: 'reply',
            content,
            timestamp: new Date().toISOString()
        }

        this.saveInteraction(interaction)
        return interaction
    }

    /**
     * 獲取指定文章的互動記錄
     */
    static getInteractions(postId: string): PostInteraction[] {
        const allInteractions = this.loadInteractions()
        return allInteractions.filter(interaction => interaction.postId === postId)
    }

    /**
     * 獲取所有互動記錄
     */
    static getAllInteractions(): PostInteraction[] {
        return this.loadInteractions()
    }

    /**
     * 刪除互動記錄
     */
    static removeInteraction(interactionId: string): void {
        try {
            const interactions = this.loadInteractions()
            const filteredInteractions = interactions.filter(i => i.id !== interactionId)
            this.saveInteractions(filteredInteractions)
        } catch (error) {
            console.error('Failed to remove interaction:', error)
        }
    }

    /**
     * 清除指定文章的所有互動記錄
     */
    static clearInteractions(postId: string): void {
        try {
            const interactions = this.loadInteractions()
            const filteredInteractions = interactions.filter(i => i.postId !== postId)
            this.saveInteractions(filteredInteractions)
        } catch (error) {
            console.error('Failed to clear interactions:', error)
        }
    }

    // ===== 私有方法 =====

    /**
     * 檢查緩存是否有效
     */
    private static isCacheValid(lastFetched: number | null): boolean {
        if (!lastFetched) return false
        return Date.now() - lastFetched < this.cacheTimeout
    }

    /**
     * 文章排序
     */
    private static sortPosts(posts: Post[], sortBy: 'date' | 'title' | 'relevance', query?: string): Post[] {
        switch (sortBy) {
            case 'date':
                return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            case 'title':
                return posts.sort((a, b) => a.title.localeCompare(b.title))
            case 'relevance':
                if (query) {
                    return this.sortByRelevance(posts, query)
                }
                return posts
            default:
                return posts
        }
    }

    /**
     * 相關性排序
     */
    private static sortByRelevance(posts: Post[], query: string): Post[] {
        return posts.map(post => ({
            post,
            score: this.calculateRelevanceScore(post, query)
        }))
        .sort((a, b) => b.score - a.score)
        .map(item => item.post)
    }

    /**
     * 計算文章相似度分數
     */
    private static calculateSimilarityScore(post1: Post, post2: Post): number {
        if (!post1.tags || !post2.tags) return 0

        const tags1 = new Set(post1.tags)
        const tags2 = new Set(post2.tags)
        const intersection = new Set([...tags1].filter(tag => tags2.has(tag)))

        // Jaccard 相似度
        const union = new Set([...tags1, ...tags2])
        return intersection.size / union.size
    }

    /**
     * 計算搜索相關性分數
     */
    private static calculateRelevanceScore(post: Post, query: string): number {
        const searchTerm = query.toLowerCase()
        let score = 0

        // 標題匹配權重更高
        if (post.title.toLowerCase().includes(searchTerm)) {
            score += 3
        }

        // 作者匹配
        if (post.author.toLowerCase().includes(searchTerm)) {
            score += 2
        }

        // 標籤匹配
        if (post.tags?.some(tag => tag.toLowerCase().includes(searchTerm))) {
            score += 1
        }

        return score
    }

    /**
     * 保存單個互動記錄
     */
    private static saveInteraction(interaction: PostInteraction): void {
        try {
            const interactions = this.loadInteractions()
            interactions.push(interaction)
            this.saveInteractions(interactions)
        } catch (error) {
            console.error('Failed to save interaction:', error)
        }
    }

    /**
     * 從 localStorage 載入互動記錄
     */
    private static loadInteractions(): PostInteraction[] {
        try {
            const saved = localStorage.getItem('post-interactions')
            if (!saved) return []

            const interactions = JSON.parse(saved) as PostInteraction[]

            // 開發模式下清理過時記錄
            if (process.env.NODE_ENV === 'development') {
                const now = Date.now()
                const filteredInteractions = interactions.filter(interaction => {
                    const interactionTime = new Date(interaction.timestamp).getTime()
                    // 只保留最近 1 小時內的互動記錄，避免 hot reload 導致的位置錯亂
                    return now - interactionTime < 60 * 60 * 1000
                })

                if (filteredInteractions.length !== interactions.length) {
                    this.saveInteractions(filteredInteractions)
                    return filteredInteractions
                }
            }

            return interactions
        } catch (error) {
            console.error('Failed to load interactions:', error)
            return []
        }
    }

    /**
     * 保存互動記錄到 localStorage
     */
    private static saveInteractions(interactions: PostInteraction[]): void {
        try {
            localStorage.setItem('post-interactions', JSON.stringify(interactions))
        } catch (error) {
            console.error('Failed to save interactions to localStorage:', error)
        }
    }

    /**
     * 清除所有緩存
     */
    static clearCache(): void {
        this.cache.clear()
        this.allPostsCache = null
        this.tagsCache = null
        this.postsLastFetched = null
        this.tagsLastFetched = null
    }

    /**
     * 獲取互動統計
     */
    static getInteractionStats(postId?: string): {
        totalInteractions: number
        replies: number
        marks: number
        comments: number
        byPost?: Record<string, number>
    } {
        const interactions = postId 
            ? this.getInteractions(postId)
            : this.getAllInteractions()

        const stats = {
            totalInteractions: interactions.length,
            replies: interactions.filter(i => i.type === 'reply').length,
            marks: interactions.filter(i => i.type === 'mark').length,
            comments: interactions.filter(i => i.type === 'comment').length
        }

        if (!postId) {
            // 按文章統計
            const byPost: Record<string, number> = {}
            this.getAllInteractions().forEach(interaction => {
                byPost[interaction.postId] = (byPost[interaction.postId] || 0) + 1
            })
            return { ...stats, byPost }
        }

        return stats
    }
} 