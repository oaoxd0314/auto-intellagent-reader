/**
 * AIAgent Service - 簡單的 OpenRouter API 調用層
 */
export class AIAgentService {
    private static readonly API_BASE_URL = 'https://openrouter.ai/api/v1'
    private static readonly DEFAULT_MODEL = 'openai/gpt-4o-mini'

    /**
     * 檢查 API 配置是否完整
     */
    static isConfigured(): boolean {
        return !!(import.meta as any).env.VITE_OPENROUTER_API_KEY
    }

    /**
     * 發送聊天消息 (非串流)
     */
    static async sendMessage(messages: Array<{ role: string; content: string }>): Promise<string> {
        if (!this.isConfigured()) {
            throw new Error('請在 .env.local 中設定 VITE_OPENROUTER_API_KEY')
        }

        const model = (import.meta as any).env.VITE_OPENROUTER_MODEL || this.DEFAULT_MODEL

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
                stream: false
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