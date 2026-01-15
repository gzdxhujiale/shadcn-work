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

// 预览模式类型: initial = 当前配置, override = 覆盖, append = 追加
export type PreviewMode = 'initial' | 'override' | 'append' | null

// 变更摘要类型
export interface ChangeSummary {
    addedNavItems: number
    modifiedNavItems: number
    deletedNavItems: number
    addedPageConfigs: number
    modifiedPageConfigs: number
}

export const useAIStore = defineStore('ai', () => {
    // State
    const messages = ref<AIMessage[]>([])
    const isOpen = ref(false)
    const isLoading = ref(false)
    const pendingConfig = ref<any>(null)
    const streamingContent = ref('')

    // Preview State - 预览模式状态
    const previewMode = ref<PreviewMode>(null)           // 当前预览模式
    const previewOverrideConfig = ref<any>(null)         // 覆盖模式预览配置
    const previewAppendConfig = ref<any>(null)           // 追加模式预览配置
    const isMinimized = ref(false)                       // 窗口是否最小化
    const changeSummary = ref<ChangeSummary | null>(null) // 变更摘要

    // Getters
    const isConfigured = computed(() => isCozeConfigured())

    const hasMessages = computed(() => messages.value.length > 0)

    const hasPendingConfig = computed(() => pendingConfig.value !== null)

    // 是否有预览配置
    const hasPreviewConfig = computed(() =>
        previewOverrideConfig.value !== null || previewAppendConfig.value !== null
    )

    // 当前选中的预览配置
    const currentPreviewConfig = computed(() => {
        if (previewMode.value === 'override') return previewOverrideConfig.value
        if (previewMode.value === 'append') return previewAppendConfig.value
        return null
    })

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
                            // Generate preview configurations for both modes
                            generatePreviewConfigs(configJson)
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
        clearPreview()
    }

    // ============================================
    // Preview Mode Actions
    // ============================================

    /**
     * Set the preview mode
     */
    function setPreviewMode(mode: PreviewMode) {
        previewMode.value = mode

        // Trigger configStore update
        const configStore = useConfigStore()

        let configToUse = null
        if (mode === 'override') {
            configToUse = previewOverrideConfig.value
        } else if (mode === 'append') {
            configToUse = previewAppendConfig.value
        }

        if (mode === 'initial') {
            configStore.clearPreviewConfig()
            return
        }

        // Extract component config logic (shared with processResponse)
        const firstPageConfig = Object.values(configToUse?.pageConfigs || {})[0]
        let componentConfig = firstPageConfig

        if (!componentConfig && configToUse?.navGroups) {
            const navGroups = configToUse.navGroups
            const firstItem = navGroups[0]?.items?.[0]
            const subItem = firstItem?.items?.[0]
            if (subItem?.component) {
                componentConfig = subItem.component
            }
        }

        if (componentConfig) {
            configStore.setPreviewConfig(componentConfig as any, mode as 'append' | 'override')
        }
    }

    /**
     * Minimize/restore window
     */
    function minimizeWindow() {
        isMinimized.value = !isMinimized.value
    }

    /**
     * Generate preview configurations for both modes
     * @param config - The raw config from AI
     */
    function generatePreviewConfigs(config: any) {
        const configStore = useConfigStore()

        // Store the original pending config
        pendingConfig.value = config

        // Generate override preview (full replacement)
        previewOverrideConfig.value = config

        // Generate append preview (merge with existing)
        const currentExport = configStore.exportFullConfig()
        const appendedConfig = mergeConfigs(currentExport, config)
        previewAppendConfig.value = appendedConfig

        // Calculate change summary
        changeSummary.value = calculateChangeSummary(currentExport, config)

        // Default to override mode and set in configStore for live preview
        previewMode.value = 'override'

        // Trigger live preview in the app
        // Note: AI returns 'pageConfigs' which maps to 'page1Configs' in the store
        const firstPageConfig = Object.values(previewOverrideConfig.value?.pageConfigs || {})[0]
        // 也尝试从 navItems 内嵌的 component 中获取
        let componentConfig = firstPageConfig

        if (!componentConfig && previewOverrideConfig.value?.navGroups) {
            const navGroups = previewOverrideConfig.value.navGroups
            const firstItem = navGroups[0]?.items?.[0]
            const subItem = firstItem?.items?.[0]
            if (subItem?.component) {
                componentConfig = subItem.component
            }
        }

        if (componentConfig) {
            configStore.setPreviewConfig(componentConfig as any, 'override')
        }
    }

    /**
     * Helper: Merge configs for append mode
     */
    function mergeConfigs(current: any, newConfig: any): any {
        const merged = JSON.parse(JSON.stringify(current))

        // Merge navGroups
        if (newConfig.navGroups && Array.isArray(newConfig.navGroups)) {
            newConfig.navGroups.forEach((newGroup: any) => {
                const existingGroup = merged.navGroups?.find((g: any) => g.label === newGroup.label)
                if (existingGroup) {
                    // Merge items into existing group
                    newGroup.items?.forEach((newItem: any) => {
                        const existingItem = existingGroup.items?.find((i: any) => i.id === newItem.id)
                        if (existingItem) {
                            // Update existing item
                            Object.assign(existingItem, newItem)
                        } else {
                            // Add new item
                            existingGroup.items = existingGroup.items || []
                            existingGroup.items.push(newItem)
                        }
                    })
                } else {
                    // Add new group
                    merged.navGroups = merged.navGroups || []
                    merged.navGroups.push(newGroup)
                }
            })
        }

        // Merge pageConfigs
        if (newConfig.pageConfigs) {
            merged.pageConfigs = merged.pageConfigs || {}
            Object.entries(newConfig.pageConfigs).forEach(([key, value]) => {
                merged.pageConfigs[key] = value
            })
        }

        return merged
    }

    /**
     * Helper: Calculate change summary
     */
    function calculateChangeSummary(current: any, newConfig: any): ChangeSummary {
        let addedNavItems = 0
        let modifiedNavItems = 0
        let deletedNavItems = 0
        let addedPageConfigs = 0
        let modifiedPageConfigs = 0

        // Analyze nav changes
        const currentNavIds = new Set<string>()
        current.navGroups?.forEach((g: any) => {
            g.items?.forEach((item: any) => {
                currentNavIds.add(item.id)
                item.items?.forEach((sub: any) => currentNavIds.add(sub.id))
            })
        })

        newConfig.navGroups?.forEach((g: any) => {
            g.items?.forEach((item: any) => {
                if (currentNavIds.has(item.id)) {
                    modifiedNavItems++
                } else {
                    addedNavItems++
                }
                item.items?.forEach((sub: any) => {
                    if (currentNavIds.has(sub.id)) {
                        modifiedNavItems++
                    } else {
                        addedNavItems++
                    }
                })
            })
        })

        // Analyze page config changes
        const currentPageIds = new Set(Object.keys(current.pageConfigs || {}))
        Object.keys(newConfig.pageConfigs || {}).forEach(key => {
            if (currentPageIds.has(key)) {
                modifiedPageConfigs++
            } else {
                addedPageConfigs++
            }
        })

        return {
            addedNavItems,
            modifiedNavItems,
            deletedNavItems,
            addedPageConfigs,
            modifiedPageConfigs
        }
    }

    /**
     * Confirm and apply the current preview configuration
     */
    async function confirmPreview() {
        const configToApply = currentPreviewConfig.value
        if (!configToApply) {
            toast.error('没有可应用的配置')
            return
        }

        const configStore = useConfigStore()

        try {
            // Import the config
            const result = configStore.importFullConfig(configToApply)

            if (result.success) {
                // Sync to cloud
                await configStore.saveToSupabase()

                // Add confirmation message
                const modeLabel = previewMode.value === 'override' ? '覆盖' : '追加'
                const confirmMessage: AIMessage = {
                    id: generateId(),
                    role: 'assistant',
                    content: `✅ 配置已成功以${modeLabel}模式更新并同步到云端！`,
                    timestamp: new Date(),
                    status: 'complete'
                }
                messages.value.push(confirmMessage)

                toast.success(`配置已${modeLabel}更新`)

                // Clear preview state
                clearPreview()
            } else {
                toast.error('配置导入失败', { description: result.message })
            }
        } catch (error) {
            toast.error('配置更新失败', {
                description: error instanceof Error ? error.message : String(error)
            })
        }
    }

    /**
     * Cancel and clear preview
     */
    function cancelPreview() {
        clearPreview()

        // Add message to continue conversation
        const cancelMessage: AIMessage = {
            id: generateId(),
            role: 'assistant',
            content: '已取消预览。请告诉我您希望如何修改配置，我会继续为您提供帮助。',
            timestamp: new Date(),
            status: 'complete'
        }
        messages.value.push(cancelMessage)
    }

    /**
     * Clear all preview state
     */
    function clearPreview() {
        pendingConfig.value = null
        previewMode.value = null
        previewOverrideConfig.value = null
        previewAppendConfig.value = null
        changeSummary.value = null

        // Also clear configStore preview
        const configStore = useConfigStore()
        configStore.clearPreviewConfig()
    }

    return {
        // State
        messages,
        isOpen,
        isLoading,
        pendingConfig,
        streamingContent,
        // Preview State
        previewMode,
        previewOverrideConfig,
        previewAppendConfig,
        isMinimized,
        changeSummary,
        // Getters
        isConfigured,
        hasMessages,
        hasPendingConfig,
        hasPreviewConfig,
        currentPreviewConfig,
        // Actions
        toggleWindow,
        openWindow,
        closeWindow,
        sendMessage,
        approveChanges,
        rejectChanges,
        clearMessages,
        // Preview Actions
        setPreviewMode,
        minimizeWindow,
        generatePreviewConfigs,
        confirmPreview,
        cancelPreview,
        clearPreview
    }
})
