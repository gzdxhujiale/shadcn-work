/**
 * Coze API Client
 * 
 * This module provides a client for interacting with the Coze API.
 * It supports streaming chat responses using the /v3/chat endpoint.
 * Uses proxy in development to avoid CORS issues.
 */

// Use proxy in development, direct URL in production
const COZE_API_BASE = import.meta.env.DEV ? '/api/coze' : 'https://api.coze.cn'

// Get API credentials from environment
const getCozeConfig = () => {
    const apiKey = import.meta.env.VITE_COZE_API_KEY
    const botId = import.meta.env.VITE_COZE_BOT_ID

    if (!apiKey || apiKey === 'your_coze_personal_access_token') {
        console.warn('⚠️ Coze API key not configured. Please set VITE_COZE_API_KEY in .env file.')
        return null
    }

    if (!botId || botId === 'your_coze_bot_id') {
        console.warn('⚠️ Coze Bot ID not configured. Please set VITE_COZE_BOT_ID in .env file.')
        return null
    }

    return { apiKey, botId }
}

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    type?: 'text' | 'config_preview'
    configData?: any // For config_json responses
}

export interface CozeStreamEvent {
    event: string
    data: string
}

/**
 * Send a chat message to Coze API with streaming response
 * 
 * @param messages - The conversation history
 * @param onChunk - Callback for each response chunk
 * @param onComplete - Callback when stream is complete
 * @param onError - Callback for errors
 */
export async function streamChat(
    messages: ChatMessage[],
    onChunk: (text: string) => void,
    onComplete: (fullResponse: string, configJson?: any) => void,
    onError: (error: Error) => void
): Promise<void> {
    const config = getCozeConfig()

    if (!config) {
        onError(new Error('Coze API 未配置。请在 .env 文件中设置 VITE_COZE_API_KEY 和 VITE_COZE_BOT_ID。'))
        return
    }

    const { apiKey, botId } = config

    // Convert messages to Coze format
    const cozeMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        content_type: 'text'
    }))

    try {
        const response = await fetch(`${COZE_API_BASE}/v3/chat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bot_id: botId,
                user_id: 'user_' + Date.now(), // Generate a unique user ID
                stream: true,
                auto_save_history: false,
                additional_messages: cozeMessages
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Coze API 请求失败: ${response.status} - ${errorText}`)
        }

        if (!response.body) {
            throw new Error('响应体为空')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullResponse = ''
        let buffer = ''
        let configJson: any = null

        while (true) {
            const { done, value } = await reader.read()

            if (done) break

            buffer += decoder.decode(value, { stream: true })

            // Process complete lines
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // Keep incomplete line in buffer

            for (const line of lines) {
                if (!line.trim()) continue

                // Parse SSE event
                if (line.startsWith('data:')) {
                    try {
                        const data = JSON.parse(line.slice(5).trim())

                        // Handle different event types
                        if (data.type === 'answer') {
                            const content = data.content || ''
                            fullResponse += content
                            onChunk(content)
                        } else if (data.type === 'tool_response') {
                            // Tool responses might contain config_json
                            try {
                                const toolOutput = JSON.parse(data.content || '{}')
                                if (toolOutput.config_json) {
                                    configJson = toolOutput.config_json
                                }
                            } catch {
                                // Not JSON, ignore
                            }
                        } else if (data.type === 'follow_up') {
                            // Follow up suggestions, can be displayed later
                        }
                    } catch {
                        // Not JSON data line, might be event name
                    }
                }
            }
        }

        // Try to extract config_json from the full response if not found in tool_response
        if (!configJson) {
            configJson = extractConfigJson(fullResponse)
        }

        onComplete(fullResponse, configJson)

    } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)))
    }
}

/**
 * Extract config_json from message content
 * Detects config in the following formats:
 * 1. JSON code blocks marked with ```json ... ```
 * 2. JSON objects containing config-related keys
 * 
 * Config indicators:
 * - navGroups / pageConfigs / version (full export format)
 * - filterArea / tableArea / cardArea / actionsArea (page config)
 * - filters / columns / buttons (partial config updates)
 */
function extractConfigJson(content: string): any {
    // Config indicator keys - presence of any of these suggests a config object
    const configIndicators = [
        'navGroups', 'pageConfigs', 'version',  // Full config
        'filterArea', 'tableArea', 'cardArea', 'actionsArea',  // Page sections
        'filters', 'columns', 'buttons', 'cards',  // Section contents
        'navId', 'template', 'subItems'  // Navigation
    ]

    // Try to find JSON code blocks first (most reliable)
    const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)```/i)
    if (jsonBlockMatch) {
        try {
            const parsed = JSON.parse(jsonBlockMatch[1].trim())
            // Check if it looks like a config object
            if (typeof parsed === 'object' && parsed !== null) {
                const hasConfigKey = configIndicators.some(key =>
                    key in parsed || JSON.stringify(parsed).includes(`"${key}"`)
                )
                if (hasConfigKey) {
                    return parsed
                }
            }
        } catch {
            // Invalid JSON in code block
        }
    }

    // Try to find any JSON code block (less strict)
    const anyJsonBlock = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i)
    if (anyJsonBlock) {
        try {
            const parsed = JSON.parse(anyJsonBlock[1].trim())
            if (typeof parsed === 'object' && parsed !== null) {
                return parsed
            }
        } catch {
            // Invalid JSON
        }
    }

    // Try to find raw JSON object that looks like config
    const configPatterns = [
        /\{[\s\S]*"navGroups"[\s\S]*\}/,
        /\{[\s\S]*"pageConfigs"[\s\S]*\}/,
        /\{[\s\S]*"filterArea"[\s\S]*\}/,
        /\{[\s\S]*"tableArea"[\s\S]*\}/,
        /\{[\s\S]*"filters"\s*:\s*\[[\s\S]*\]/,
        /\{[\s\S]*"columns"\s*:\s*\[[\s\S]*\]/
    ]

    for (const pattern of configPatterns) {
        const match = content.match(pattern)
        if (match) {
            try {
                return JSON.parse(match[0])
            } catch {
                // Not valid JSON - try to balance brackets
                const extracted = extractBalancedJson(match[0])
                if (extracted) {
                    try {
                        return JSON.parse(extracted)
                    } catch {
                        // Still not valid
                    }
                }
            }
        }
    }

    return null
}

/**
 * Try to extract a balanced JSON object from a string
 */
function extractBalancedJson(str: string): string | null {
    let depth = 0
    let start = -1

    for (let i = 0; i < str.length; i++) {
        if (str[i] === '{') {
            if (depth === 0) start = i
            depth++
        } else if (str[i] === '}') {
            depth--
            if (depth === 0 && start !== -1) {
                return str.substring(start, i + 1)
            }
        }
    }

    return null
}

/**
 * Check if Coze API is configured
 */
export function isCozeConfigured(): boolean {
    return getCozeConfig() !== null
}
