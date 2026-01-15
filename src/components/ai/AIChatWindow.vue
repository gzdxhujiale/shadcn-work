<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { Send, Trash2, Sparkles, Loader2, Check, XIcon, Minus, Replace, Plus, Eye } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAIStore, type PreviewMode } from '@/stores/aiStore'
import { useConfigStore } from '@/stores/configStore'

const aiStore = useAIStore()
const configStore = useConfigStore()

const inputValue = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

const isOpen = computed(() => aiStore.isOpen)
const isMinimized = computed(() => aiStore.isMinimized)
const messages = computed(() => aiStore.messages)
const isLoading = computed(() => aiStore.isLoading)
const isConfigured = computed(() => aiStore.isConfigured)
const hasPreviewConfig = computed(() => aiStore.hasPreviewConfig)
const previewMode = computed(() => aiStore.previewMode)
const changeSummary = computed(() => aiStore.changeSummary)
// previewOverrideConfig and previewAppendConfig removed (handled in store)

// Auto-scroll to bottom when new messages arrive
watch(messages, async () => {
    await nextTick()
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
}, { deep: true })

function handleMinimize() {
    aiStore.minimizeWindow()
}

function handleSend() {
    if (!inputValue.value.trim() || isLoading.value) return
    aiStore.sendMessage(inputValue.value)
    inputValue.value = ''
}

function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
    }
}

function handleClear() {
    aiStore.clearMessages()
    configStore.clearPreviewConfig()
}

function handleSetPreviewMode(mode: PreviewMode) {
    aiStore.setPreviewMode(mode)
}

function handleConfirmPreview() {
    // 先应用预览配置到实际配置
    configStore.applyPreviewConfig()
    aiStore.confirmPreview()
}

function handleCancelPreview() {
    configStore.clearPreviewConfig()
    aiStore.cancelPreview()
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
    <Transition name="slide-up">
        <div v-if="isOpen" class="ai-chat-window" :class="{ 'is-minimized': isMinimized }">
            <!-- Header -->
            <div class="chat-header">
                <div class="header-title">
                    <Sparkles :size="20" class="header-icon" />
                    <span>AI 配置助手</span>
                    <!-- Processing indicator -->
                    <span v-if="isLoading" class="processing-dot" />
                </div>
                <div class="header-actions">
                    <Button variant="ghost" size="icon" @click="handleClear" :disabled="messages.length === 0" title="清空消息">
                        <Trash2 :size="18" />
                    </Button>
                    <Button variant="ghost" size="icon" @click="handleMinimize" title="最小化">
                        <Minus :size="18" />
                    </Button>
                </div>
            </div>

            <!-- Minimized state -->
            <div v-if="isMinimized" class="minimized-content">
                <p v-if="isLoading">AI 正在处理中...</p>
                <p v-else-if="hasPreviewConfig">有待审核的配置</p>
                <p v-else>点击展开查看对话</p>
            </div>

            <!-- Main content (hidden when minimized) -->
            <template v-else>
                <!-- Scrollable Content Area (messages + preview) -->
                <div ref="messagesContainer" class="content-area">
                    <!-- Messages -->
                    <div class="chat-messages">
                        <!-- Empty state -->
                        <div v-if="messages.length === 0" class="empty-state">
                            <Sparkles :size="48" class="empty-icon" />
                            <h3>您好！我是 AI 配置助手</h3>
                            <p>告诉我您想要如何修改配置，我会为您生成修改方案供您审批。</p>
                            <div class="suggestion-chips">
                                <button 
                                    class="suggestion-chip" 
                                    @click="inputValue = '添加一个新的筛选项'"
                                >
                                    添加新筛选项
                                </button>
                                <button 
                                    class="suggestion-chip"
                                    @click="inputValue = '修改表格列配置'"
                                >
                                    修改表格列
                                </button>
                                <button 
                                    class="suggestion-chip"
                                    @click="inputValue = '新增一个导航菜单'"
                                >
                                    新增导航菜单
                                </button>
                            </div>
                        </div>

                        <!-- Not configured warning -->
                        <div v-if="!isConfigured && messages.length === 0" class="config-warning">
                            <p>⚠️ Coze API 未配置。请在 .env 文件中设置 VITE_COZE_API_KEY 和 VITE_COZE_BOT_ID。</p>
                        </div>

                        <!-- Message list -->
                        <div 
                            v-for="message in messages" 
                            :key="message.id"
                            class="message"
                            :class="[
                                message.role === 'user' ? 'user-message' : 'assistant-message',
                                message.status
                            ]"
                        >
                            <div class="message-content">
                                <div class="message-text">{{ message.content }}</div>
                            </div>
                            <div class="message-meta">
                                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                                <Loader2 v-if="message.status === 'streaming'" :size="14" class="loading-icon" />
                            </div>
                        </div>
                    </div>

                    <!-- Preview Panel (shown when there's pending config) -->
                    <div v-if="hasPreviewConfig" class="preview-panel">
                        <div class="preview-header">
                            <Sparkles :size="16" />
                            <span>配置预览</span>
                            <span class="preview-hint">← 在左侧实时查看效果</span>
                        </div>

                        <!-- Preview Mode Tabs -->
                        <div class="preview-tabs">
                            <button 
                                class="preview-tab"
                                :class="{ active: previewMode === 'initial' }"
                                @click="handleSetPreviewMode('initial')"
                            >
                                <Eye :size="16" />
                                <span>当前</span>
                            </button>
                            <button 
                                class="preview-tab"
                                :class="{ active: previewMode === 'override' }"
                                @click="handleSetPreviewMode('override')"
                            >
                                <Replace :size="16" />
                                <span>覆盖</span>
                            </button>
                            <button 
                                class="preview-tab"
                                :class="{ active: previewMode === 'append' }"
                                @click="handleSetPreviewMode('append')"
                            >
                                <Plus :size="16" />
                                <span>追加</span>
                            </button>
                        </div>

                        <!-- Mode Description -->
                        <div class="mode-description">
                            <p v-if="previewMode === 'initial'">
                                👁️ 当前配置 - 查看现有配置作为对比
                            </p>
                            <p v-else-if="previewMode === 'override'">
                                ⚠️ 覆盖模式 - 完全替换现有配置
                            </p>
                            <p v-else-if="previewMode === 'append'">
                                ➕ 追加模式 - 合并到现有配置
                            </p>
                        </div>

                        <!-- Change Summary -->
                        <div v-if="changeSummary && previewMode !== 'initial'" class="change-summary">
                            <div class="summary-title">变更摘要</div>
                            <div class="summary-items">
                                <div v-if="changeSummary.addedNavItems > 0" class="summary-item added">
                                    <span class="icon">+</span>
                                    <span>新增导航项: {{ changeSummary.addedNavItems }} 个</span>
                                </div>
                                <div v-if="changeSummary.modifiedNavItems > 0" class="summary-item modified">
                                    <span class="icon">~</span>
                                    <span>修改导航项: {{ changeSummary.modifiedNavItems }} 个</span>
                                </div>
                                <div v-if="changeSummary.addedPageConfigs > 0" class="summary-item added">
                                    <span class="icon">+</span>
                                    <span>新增页面配置: {{ changeSummary.addedPageConfigs }} 个</span>
                                </div>
                                <div v-if="changeSummary.modifiedPageConfigs > 0" class="summary-item modified">
                                    <span class="icon">~</span>
                                    <span>修改页面配置: {{ changeSummary.modifiedPageConfigs }} 个</span>
                                </div>
                            </div>
                        </div>

                        <!-- Confirmation Actions -->
                        <div v-if="previewMode !== 'initial'" class="preview-actions">
                            <Button 
                                variant="default" 
                                size="sm" 
                                class="confirm-btn"
                                @click="handleConfirmPreview"
                            >
                                <Check :size="16" />
                                确认{{ previewMode === 'override' ? '覆盖' : '追加' }}
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                class="cancel-btn"
                                @click="handleCancelPreview"
                            >
                                <XIcon :size="16" />
                                取消
                            </Button>
                        </div>
                    </div>
                </div>

                <!-- Input (fixed at bottom) -->
                <div class="chat-input">
                    <div class="input-wrapper">
                        <Input
                            v-model="inputValue"
                            type="text"
                            placeholder="描述您想要的配置修改..."
                            class="input-field"
                            :disabled="isLoading"
                            @keydown="handleKeydown"
                        />
                        <Button 
                            class="send-btn" 
                            size="icon"
                            :disabled="!inputValue.trim() || isLoading"
                            @click="handleSend"
                        >
                            <Loader2 v-if="isLoading" :size="18" class="loading-icon" />
                            <Send v-else :size="18" />
                        </Button>
                    </div>
                </div>
            </template>
        </div>
    </Transition>
</template>

<style scoped>
/* Main Window Container */
.ai-chat-window {
    position: fixed;
    right: 24px;
    bottom: 160px;
    width: 420px;
    max-width: calc(100vw - 48px);
    height: 650px;
    max-height: calc(100vh - 180px);
    display: flex;
    flex-direction: column;
    z-index: 999;
    overflow: hidden;
    
    /* Glassmorphism Effect */
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 24px;
    box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.1),
        0 0 0 1px rgba(255, 255, 255, 0.2);
        
    /* Non-blocking interactions */
    pointer-events: auto;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Dark Mode Adaptation */
:root.dark .ai-chat-window,
.dark .ai-chat-window {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* Minimized State */
.ai-chat-window.is-minimized {
    height: auto;
    max-height: 80px;
    bottom: 160px;
    transform-origin: bottom right;
    background: rgba(255, 255, 255, 0.9);
}

.dark .ai-chat-window.is-minimized {
    background: rgba(30, 41, 59, 0.9);
}

.minimized-content {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 60px;
    font-size: 0.9rem;
    font-weight: 500;
    color: hsl(var(--foreground));
}

/* Header */
.chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    /* Transparent header for seamless look */
    background: transparent; 
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.dark .chat-header {
    border-bottom-color: rgba(255, 255, 255, 0.05);
}

.header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 1rem;
    color: hsl(var(--foreground));
}

.header-icon {
    color: #8B5CF6;
    filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.4));
}

.processing-dot {
    width: 6px;
    height: 6px;
    background: #8B5CF6;
    border-radius: 50%;
    box-shadow: 0 0 8px #8B5CF6;
    animation: pulse 1.5s infinite;
}

/* Content Area (scrollable container for messages + preview) */
.content-area {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

/* Scrollbar for content area */
.content-area::-webkit-scrollbar {
    width: 4px;
}
.content-area::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
}
.dark .content-area::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
}

/* Messages Area */
.chat-messages {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex-shrink: 0;
}

/* Empty State */
.empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: hsl(var(--muted-foreground));
    padding: 0 20px;
}

.empty-icon {
    color: rgba(139, 92, 246, 0.8);
    margin-bottom: 24px;
    filter: drop-shadow(0 8px 16px rgba(139, 92, 246, 0.2));
}

.suggestion-chips {
    margin-top: 32px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
}

.suggestion-chip {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 20px;
    font-size: 0.8rem;
    color: hsl(var(--foreground));
    cursor: pointer;
    transition: all 0.2s;
}

.dark .suggestion-chip {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
}

.suggestion-chip:hover {
    background: rgba(139, 92, 246, 0.1);
    border-color: rgba(139, 92, 246, 0.3);
    color: #8B5CF6;
    transform: translateY(-1px);
}

/* Messages */
.message {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: 85%;
    animation: message-in 0.3s cubic-bezier(0.2, 0.9, 0.3, 1);
}

@keyframes message-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.user-message {
    align-self: flex-end;
}

.assistant-message {
    align-self: flex-start;
}

.message-content {
    padding: 12px 18px;
    border-radius: 18px;
    font-size: 0.95rem;
    line-height: 1.6;
    position: relative;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.user-message .message-content {
    /* Gradient bubble for user */
    background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
    color: white;
    border-bottom-right-radius: 4px;
}

.assistant-message .message-content {
    /* Glass bubble for AI */
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(0, 0, 0, 0.05);
    color: hsl(var(--foreground));
    border-bottom-left-radius: 4px;
}

.dark .assistant-message .message-content {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
}

/* Config Preview Panel */
.preview-panel {
    margin: 0 16px;
    margin-bottom: 16px; /* spacing above input */
    padding: 16px;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 16px;
    backdrop-filter: blur(10px);
}

.dark .preview-panel {
    background: rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.1);
}

.preview-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-weight: 600;
    color: hsl(var(--foreground));
}

.preview-hint {
    margin-left: auto;
    font-size: 0.7rem;
    font-weight: 400;
    color: hsl(var(--muted-foreground));
    opacity: 0.8;
}

/* Tabs: Segmented Control Style */
.preview-tabs {
    display: flex;
    background: rgba(0, 0, 0, 0.05);
    padding: 4px;
    border-radius: 12px;
    margin-bottom: 16px;
}

.dark .preview-tabs {
    background: rgba(255, 255, 255, 0.1);
}

.preview-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 500;
    color: hsl(var(--muted-foreground));
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.preview-tab.active {
    background: white;
    color: #6366F1;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.dark .preview-tab.active {
    background: rgba(255, 255, 255, 0.15);
    color: white;
}

/* Change Summary Chips */
.summary-items {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
}

.summary-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
}

.summary-item.added {
    background: rgba(34, 197, 94, 0.15);
    color: rgb(21, 128, 61);
}
.summary-item.modified {
    background: rgba(234, 179, 8, 0.15);
    color: rgb(161, 98, 7);
}

.dark .summary-item.added { color: rgb(74, 222, 128); }
.dark .summary-item.modified { color: rgb(250, 204, 21); }

/* Confirmation Buttons */
.preview-actions {
    display: flex;
    gap: 12px;
}

.confirm-btn {
    flex: 2;
    background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
    border: none;
    height: 36px;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    transition: transform 0.2s;
}

.confirm-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.cancel-btn {
    flex: 1;
    height: 36px;
    border-color: rgba(0,0,0,0.1);
    background: transparent;
}
.dark .cancel-btn { border-color: rgba(255,255,255,0.1); }

/* Input Area: Floating Capsule */
.chat-input {
    padding: 16px;
    background: transparent;
    position: relative;
    border-top: none; /* remove legacy border */
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 30px;
    padding: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.dark .input-wrapper {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
}

.input-wrapper:focus-within {
    border-color: #8B5CF6;
    box-shadow: 0 4px 16px rgba(139, 92, 246, 0.2);
    background: white;
}
.dark .input-wrapper:focus-within {
    background: rgba(30, 41, 59, 1);
}

.input-field {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    padding-left: 16px;
    height: 48px;
    font-size: 0.95rem;
}

.send-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 4px;
    background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
    border: none;
    color: white;
    transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
}

.send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #e2e8f0;
}

/* Animations */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
    opacity: 0;
    transform: translateY(40px) scale(0.9);
}

@keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.2); }
}
</style>
