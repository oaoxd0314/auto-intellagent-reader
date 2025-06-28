import type { PostInteraction, InteractionType } from '../types/post'

/**
 * 互動服務 - 負責所有互動數據的 CRUD 操作
 * 目前使用 localStorage 作為數據存儲，未來可以輕鬆替換為 API
 */
export class InteractionService {
    private static readonly STORAGE_KEY = 'post-interactions'

    // 獲取所有互動數據
    static async getAllInteractions(): Promise<PostInteraction[]> {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY)
            return data ? JSON.parse(data) : []
        } catch (error) {
            console.error('Failed to load interactions:', error)
            return []
        }
    }

    // 根據文章 ID 獲取互動數據
    static async getInteractionsByPostId(postId: string): Promise<PostInteraction[]> {
        const allInteractions = await this.getAllInteractions()
        return allInteractions.filter(interaction => interaction.postId === postId)
    }

    // 根據類型獲取互動數據
    static async getInteractionsByType(postId: string, type: InteractionType): Promise<PostInteraction[]> {
        const postInteractions = await this.getInteractionsByPostId(postId)
        return postInteractions.filter(interaction => interaction.type === type)
    }

    // 根據段落 ID 獲取互動數據
    static async getInteractionsBySectionId(postId: string, sectionId: string): Promise<PostInteraction[]> {
        const postInteractions = await this.getInteractionsByPostId(postId)
        return postInteractions.filter(interaction =>
            interaction.position?.sectionId === sectionId
        )
    }

    // 創建新的互動記錄
    static async createInteraction(
        interactionData: Omit<PostInteraction, 'id' | 'timestamp'>
    ): Promise<PostInteraction> {
        const interaction: PostInteraction = {
            ...interactionData,
            id: this.generateId(),
            timestamp: new Date().toISOString()
        }

        const allInteractions = await this.getAllInteractions()
        allInteractions.push(interaction)

        await this.saveInteractions(allInteractions)
        return interaction
    }

    // 刪除互動記錄
    static async deleteInteraction(id: string): Promise<void> {
        const allInteractions = await this.getAllInteractions()
        const filteredInteractions = allInteractions.filter(interaction => interaction.id !== id)

        await this.saveInteractions(filteredInteractions)
    }

    // 更新互動記錄
    static async updateInteraction(
        id: string,
        updates: Partial<PostInteraction>
    ): Promise<PostInteraction> {
        const allInteractions = await this.getAllInteractions()
        const index = allInteractions.findIndex(interaction => interaction.id === id)

        if (index === -1) {
            throw new Error(`Interaction with id ${id} not found`)
        }

        const updatedInteraction = {
            ...allInteractions[index],
            ...updates,
            // 保持原有的 id 和 timestamp
            id: allInteractions[index].id,
            timestamp: allInteractions[index].timestamp
        }

        allInteractions[index] = updatedInteraction
        await this.saveInteractions(allInteractions)

        return updatedInteraction
    }

    // 根據 ID 獲取單個互動記錄
    static async getInteractionById(id: string): Promise<PostInteraction | undefined> {
        const allInteractions = await this.getAllInteractions()
        return allInteractions.find(interaction => interaction.id === id)
    }

    // 批量刪除文章的所有互動記錄
    static async deleteInteractionsByPostId(postId: string): Promise<void> {
        const allInteractions = await this.getAllInteractions()
        const filteredInteractions = allInteractions.filter(
            interaction => interaction.postId !== postId
        )

        await this.saveInteractions(filteredInteractions)
    }

    // 私有方法：保存互動數據到 localStorage
    private static async saveInteractions(interactions: PostInteraction[]): Promise<void> {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(interactions))
        } catch (error) {
            console.error('Failed to save interactions:', error)
            throw new Error('Failed to save interactions to storage')
        }
    }

    // 私有方法：生成唯一 ID
    private static generateId(): string {
        return `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    // 開發用：清空所有互動數據
    static async clearAllInteractions(): Promise<void> {
        localStorage.removeItem(this.STORAGE_KEY)
    }
} 