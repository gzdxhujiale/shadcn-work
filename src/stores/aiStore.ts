import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { streamChat, isCozeConfigured, type ChatMessage } from '@/lib/coze'
import { useConfigStore } from './configStore'
import { toast } from 'vue-sonner'

export interface AIMessage extends ChatMessage {
    id: string
    timestamp: Date
    status?: 'sending' | 'streaming' | 'complete' | 'error'
}

export const useAIStore = defineStore('ai', () => {
    // State
    const messages = ref<AIMessage[]>([])
    const isOpen = ref(false)
    const isLoading = ref(false)
    const pendingConfig = ref<any>(null)
    const streamingContent = ref('')

    // Getters
    const isConfigured = computed(() => isCozeConfigured())

    const hasMessages = computed(() => messages.value.length > 0)

    const hasPendingConfig = computed(() => pendingConfig.value !== null)

    // Actions

    /**
     * Toggle the AI chat window
     */
    function toggleWindow() {
        isOpen.value = !isOpen.value
    }

    /**
     * Open the AI chat window
     */
    function openWindow() {
        isOpen.value = true
    }

    /**
     * Close the AI chat window
     */
    function closeWindow() {
        isOpen.value = false
    }

    /**
     * Generate a unique message ID
     */
    function generateId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Send a message to the AI
     */
    async function sendMessage(content: string) {
        if (!content.trim() || isLoading.value) return

        // Add user message
        const userMessage: AIMessage = {
            id: generateId(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
            status: 'complete'
        }
        messages.value.push(userMessage)

        // Create placeholder for assistant response
        const assistantMessage: AIMessage = {
            id: generateId(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            status: 'streaming'
        }
        messages.value.push(assistantMessage)

        isLoading.value = true
        streamingContent.value = ''

        // Prepare messages for API (only include completed messages)
        const apiMessages = messages.value
            .filter(m => m.status === 'complete')
            .map(m => ({
                role: m.role,
                content: m.content
            }))

        try {
            await streamChat(
                apiMessages,
                // onChunk - update streaming content
                (chunk) => {
                    streamingContent.value += chunk
                    // Update the assistant message with streaming content
                    const lastMsg = messages.value[messages.value.length - 1]
                    if (lastMsg && lastMsg.role === 'assistant') {
                        lastMsg.content = streamingContent.value
                    }
                },
                // onComplete - finalize message and check for config
                (fullResponse, configJson) => {
                    const lastMsg = messages.value[messages.value.length - 1]
                    if (lastMsg && lastMsg.role === 'assistant') {
                        lastMsg.content = fullResponse
                        lastMsg.status = 'complete'

                        if (configJson) {
                            lastMsg.type = 'config_preview'
                            lastMsg.configData = configJson
                            pendingConfig.value = configJson
                        }
                    }
                    isLoading.value = false
                    streamingContent.value = ''
                },
                // onError - handle errors
                (error) => {
                    const lastMsg = messages.value[messages.value.length - 1]
                    if (lastMsg && lastMsg.role === 'assistant') {
                        lastMsg.content = `抱歉，发生了错误：${error.message}`
                        lastMsg.status = 'error'
                    }
                    isLoading.value = false
                    streamingContent.value = ''
                    toast.error('AI 请求失败', { description: error.message })
                }
            )
        } catch (error) {
            const lastMsg = messages.value[messages.value.length - 1]
            if (lastMsg && lastMsg.role === 'assistant') {
                lastMsg.content = `抱歉，发生了错误：${error instanceof Error ? error.message : String(error)}`
                lastMsg.status = 'error'
            }
            isLoading.value = false
            streamingContent.value = ''
        }
    }

    /**
     * Approve pending config changes
     */
    async function approveChanges() {
        if (!pendingConfig.value) return

        const configStore = useConfigStore()

        try {
            // Import the config
            const result = configStore.importFullConfig(pendingConfig.value)

            if (result.success) {
                // Sync to cloud
                await configStore.saveToSupabase()

                // Add confirmation message
                const confirmMessage: AIMessage = {
                    id: generateId(),
                    role: 'assistant',
                    content: '✅ 配置已成功更新并同步到云端！',
                    timestamp: new Date(),
                    status: 'complete'
                }
                messages.value.push(confirmMessage)

                toast.success('配置更新成功')
            } else {
                toast.error('配置导入失败', { description: result.message })
            }
        } catch (error) {
            toast.error('配置更新失败', {
                description: error instanceof Error ? error.message : String(error)
            })
        } finally {
            pendingConfig.value = null
        }
    }

    /**
     * Reject pending config changes
     */
    function rejectChanges() {
        pendingConfig.value = null

        // Add message to continue conversation
        const rejectMessage: AIMessage = {
            id: generateId(),
            role: 'assistant',
            content: '好的，我不会应用这些更改。请告诉我您希望如何修改配置，我会继续为您提供帮助。',
            timestamp: new Date(),
            status: 'complete'
        }
        messages.value.push(rejectMessage)
    }

    /**
     * Clear all messages
     */
    function clearMessages() {
        messages.value = []
        pendingConfig.value = null
        streamingContent.value = ''
    }

    return {
        // State
        messages,
        isOpen,
        isLoading,
        pendingConfig,
        streamingContent,
        // Getters
        isConfigured,
        hasMessages,
        hasPendingConfig,
        // Actions
        toggleWindow,
        openWindow,
        closeWindow,
        sendMessage,
        approveChanges,
        rejectChanges,
        clearMessages
    }
})
