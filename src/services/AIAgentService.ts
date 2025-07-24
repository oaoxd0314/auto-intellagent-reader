/**
 * AIAgent Service - 純 OpenRouter API 調用層
 * 職責：數據獲取、API 調用、無商業邏輯
 */
export class AIAgentService {
    private static readonly API_BASE_URL = 'https://openrouter.ai/api/v1'
    private static readonly DEFAULT_MODEL = 'openai/gpt-4o-mini'

    /**
     * 檢查 API 配置是否完整
     */
    static isConfigured(): boolean {
        const apiKey = (import.meta as any).env.VITE_OPENROUTER_API_KEY
        return !!(apiKey && apiKey.trim().length > 0)
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
            console.warn('[AIAgentService] API not configured, using fallback')
            throw new Error('VITE_OPENROUTER_API_KEY 未設定或為空')
        }

        const model = options?.model || (import.meta as any).env.VITE_OPENROUTER_MODEL || this.DEFAULT_MODEL
        const apiKey = (import.meta as any).env.VITE_OPENROUTER_API_KEY

        console.log('[AIAgentService] Calling OpenRouter API', {
            model,
            messagesCount: messages.length,
            temperature: options?.temperature || 0.7
        })

        try {
            const response = await fetch(`${this.API_BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
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
                console.error('[AIAgentService] API call failed', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                })
                throw new Error(`OpenRouter API 調用失敗: ${response.status} - ${errorText}`)
            }

            const data = await response.json()
            const content = data.choices?.[0]?.message?.content

            if (!content) {
                console.warn('[AIAgentService] Empty response from API', data)
                throw new Error('AI 回應內容為空')
            }

            console.log('[AIAgentService] API call successful', {
                responseLength: content.length,
                usage: data.usage
            })

            return content

        } catch (error) {
            console.error('[AIAgentService] Error during API call', error)

            // 重新拋出錯誤，讓調用方決定如何處理（fallback 或顯示錯誤）
            throw error
        }
    }

    /**
     * 獲取當前 API 配置狀態信息
     */
    static getConfigStatus() {
        const apiKey = (import.meta as any).env.VITE_OPENROUTER_API_KEY
        const model = (import.meta as any).env.VITE_OPENROUTER_MODEL || this.DEFAULT_MODEL

        return {
            isConfigured: this.isConfigured(),
            hasApiKey: !!(apiKey && apiKey.trim().length > 0),
            apiKeyLength: apiKey ? apiKey.length : 0,
            model,
            defaultModel: this.DEFAULT_MODEL
        }
    }
} 