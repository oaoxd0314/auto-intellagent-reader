import { AbstractController } from './AbstractController'
import { PostService } from '../services/PostService'
import type { Post } from '../types/post'

/**
 * 文章控制器狀態
 */
interface PostControllerState {
    posts: Post[]
    currentPost: Post | null
    lastFetchTime: number
}

/**
 * 文章控制器
 * 負責協調文章相關的業務邏輯和狀態管理
 */
export class PostController extends AbstractController<PostControllerState> {
    private static instance: PostController | null = null

    constructor() {
        super('PostController', {
            posts: [],
            currentPost: null,
            lastFetchTime: 0
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
     * 獲取所有文章
     */
    async getAllPosts(): Promise<Post[]> {
        try {
            const posts = await PostService.getAllPosts()
            this.setState({
                posts,
                lastFetchTime: Date.now()
            })
            this.emit('postsLoaded', posts)
            return posts
        } catch (error) {
            const controllerError = this.createError(
                `Failed to load posts: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            this.emit('error', controllerError)
            throw controllerError
        }
    }

    /**
     * 根據 ID 獲取文章
     */
    async getPostById(id: string): Promise<Post | undefined> {
        try {
            // 先從快取中查找
            const cachedPost = this.state.posts.find(post => post.id === id)
            if (cachedPost) {
                this.setState({ currentPost: cachedPost })
                this.emit('currentPostChanged', cachedPost)
                return cachedPost
            }

            // 從服務層載入
            const post = await PostService.getPostById(id)
            if (post) {
                // 更新快取
                const updatedPosts = [...this.state.posts]
                const existingIndex = updatedPosts.findIndex(p => p.id === id)
                if (existingIndex >= 0) {
                    updatedPosts[existingIndex] = post
                } else {
                    updatedPosts.push(post)
                }

                this.setState({
                    posts: updatedPosts,
                    currentPost: post
                })
                this.emit('currentPostChanged', post)
            }
            return post
        } catch (error) {
            const controllerError = this.createError(
                `Failed to load post ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            this.emit('error', controllerError)
            throw controllerError
        }
    }

    /**
     * 設置當前文章
     */
    setCurrentPost(post: Post | null): void {
        this.setState({ currentPost: post })
        this.emit('currentPostChanged', post)
    }

    /**
     * 根據標籤篩選文章 - 業務邏輯
     */
    filterPostsByTag(posts: Post[], tag: string): Post[] {
        return posts.filter(post =>
            post.tags && post.tags.includes(tag)
        )
    }

    /**
     * 從文章列表中提取所有標籤 - 業務邏輯
     */
    extractAllTags(posts: Post[]): string[] {
        const tagSet = new Set<string>()
        posts.forEach(post => {
            if (post.tags) {
                post.tags.forEach(tag => tagSet.add(tag))
            }
        })
        return Array.from(tagSet).sort()
    }

    /**
     * 獲取可用的文章 ID
     */
    getAvailablePostIds(): string[] {
        return PostService.getAvailablePostIds()
    }

    /**
     * 獲取當前狀態的快照
     */
    getSnapshot() {
        return {
            posts: [...this.state.posts],
            currentPost: this.state.currentPost ? { ...this.state.currentPost } : null,
            lastFetchTime: this.state.lastFetchTime,
            postsCount: this.state.posts.length
        }
    }
} 