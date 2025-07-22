/**
 * AIAgent Service - 純 OpenRouter API 調用層
 * 職責：數據獲取、API 調用、無商業邏輯
 */
export class AIAgentService {
    private static readonly API_BASE_URL = 'https://openrouter.ai/api/v1'
    private static readonly DEFAULT_MODEL = 'openai/gpt-4o-mini'

    /**
     * 檢查 API 配置是否完整
     * 目前強制返回 false，使用 mock 模式
     */
    static isConfigured(): boolean {
        // 強制使用 mock 模式，避免真實 API 調用
        return false
        // return !!(import.meta as any).env.VITE_OPENROUTER_API_KEY
    }

    /**
     * 發送聊天消息 (非串流)
     */
    static async sendMessage(messages: Array<{ role: string; content: string }>, options?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
    }): Promise<string> {
        if (!this.isConfigured()) {
            throw new Error('請在 .env.local 中設定 VITE_OPENROUTER_API_KEY')
        }

        const model = options?.model || (import.meta as any).env.VITE_OPENROUTER_MODEL || this.DEFAULT_MODEL

        const response = await fetch(`${this.API_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${(import.meta as any).env.VITE_OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Auto Intellagent Reader'
            },
            body: JSON.stringify({
                model,
                messages,
                stream: false,
                temperature: options?.temperature || 0.7,
                max_tokens: options?.maxTokens || 1000
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`API 調用失敗: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        return data.choices?.[0]?.message?.content || '無回應內容'
    }

} 