import { MarkdownFactory } from '../lib/MarkdownFactory'
import type { Post } from '../types/post'

export class PostService {
    // 獲取所有文章
    static async getAllPosts(): Promise<Post[]> {
        try {
            return await MarkdownFactory.loadAllPosts()
        } catch (error) {
            console.error('Failed to load all posts:', error)
            return []
        }
    }

    // 根據 ID 獲取單個文章
    static async getPostById(id: string): Promise<Post | undefined> {
        try {
            return await MarkdownFactory.loadPostById(id)
        } catch (error) {
            console.error(`Failed to load post ${id}:`, error)
            return undefined
        }
    }

    // 獲取所有可用的文章 ID
    static getAvailablePostIds(): string[] {
        try {
            return MarkdownFactory.getAvailablePostIds()
        } catch (error) {
            console.error('Failed to get available post IDs:', error)
            return []
        }
    }

    // 獲取所有標籤
    static async getAllTags(): Promise<string[]> {
        try {
            const posts = await this.getAllPosts()
            const tagSet = new Set<string>()

            posts.forEach(post => {
                if (post.tags) {
                    post.tags.forEach(tag => tagSet.add(tag))
                }
            })

            return Array.from(tagSet).sort()
        } catch (error) {
            console.error('Failed to get all tags:', error)
            return []
        }
    }
} 