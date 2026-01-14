<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { X, Send, Trash2, Sparkles, Loader2, Check, XIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAIStore } from '@/stores/aiStore'

const aiStore = useAIStore()

const inputValue = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

const isOpen = computed(() => aiStore.isOpen)
const messages = computed(() => aiStore.messages)
const isLoading = computed(() => aiStore.isLoading)
const isConfigured = computed(() => aiStore.isConfigured)
const hasPendingConfig = computed(() => aiStore.hasPendingConfig)
const pendingConfig = computed(() => aiStore.pendingConfig)

// Auto-scroll to bottom when new messages arrive
watch(messages, async () => {
    await nextTick()
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
}, { deep: true })

function handleClose() {
    aiStore.closeWindow()
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
}

function handleApprove() {
    aiStore.approveChanges()
}

function handleReject() {
    aiStore.rejectChanges()
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
    <Transition name="slide-up">
        <div v-if="isOpen" class="ai-chat-window">
            <!-- Header -->
            <div class="chat-header">
                <div class="header-title">
                    <Sparkles :size="20" class="header-icon" />
                    <span>AI 配置助手</span>
                </div>
                <div class="header-actions">
                    <Button variant="ghost" size="icon" @click="handleClear" :disabled="messages.length === 0">
                        <Trash2 :size="18" />
                    </Button>
                    <Button variant="ghost" size="icon" @click="handleClose">
                        <X :size="18" />
                    </Button>
                </div>
            </div>

            <!-- Messages -->
            <div ref="messagesContainer" class="chat-messages">
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
                        
                        <!-- Config Preview -->
                        <div v-if="message.type === 'config_preview' && message.configData" class="config-preview">
                            <div class="preview-header">
                                <Sparkles :size="16" />
                                <span>配置修改预览</span>
                            </div>
                            <pre class="preview-code">{{ JSON.stringify(message.configData, null, 2).slice(0, 500) }}{{ JSON.stringify(message.configData, null, 2).length > 500 ? '...' : '' }}</pre>
                            
                            <!-- Approval buttons (only show for pending config) -->
                            <div v-if="hasPendingConfig && pendingConfig === message.configData" class="approval-actions">
                                <Button 
                                    variant="default" 
                                    size="sm" 
                                    class="approve-btn"
                                    @click="handleApprove"
                                >
                                    <Check :size="16" />
                                    同意修改
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    class="reject-btn"
                                    @click="handleReject"
                                >
                                    <XIcon :size="16" />
                                    拒绝
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div class="message-meta">
                        <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                        <Loader2 v-if="message.status === 'streaming'" :size="14" class="loading-icon" />
                    </div>
                </div>
            </div>

            <!-- Input -->
            <div class="chat-input">
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
    </Transition>
</template>

<style scoped>
.ai-chat-window {
    position: fixed;
    right: 24px;
    bottom: 156px;
    width: 420px;
    max-width: calc(100vw - 48px);
    height: 600px;
    max-height: calc(100vh - 120px);
    /* Solid background with backdrop blur for contrast */
    background: hsl(var(--background));
    border: 1px solid hsl(var(--border));
    border-radius: 20px;
    box-shadow: 
        0 25px 60px -12px rgba(0, 0, 0, 0.35),
        0 16px 40px -8px rgba(0, 0, 0, 0.2),
        0 0 0 1px rgba(139, 92, 246, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    z-index: 999;
    overflow: hidden;
    /* Ensure solid appearance */
    backdrop-filter: blur(20px);
}

/* Dark mode solid background */
:root.dark .ai-chat-window,
.dark .ai-chat-window {
    background: hsl(var(--background));
    box-shadow: 
        0 25px 60px -12px rgba(0, 0, 0, 0.6),
        0 16px 40px -8px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(139, 92, 246, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* Slide up animation */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
}

/* Header with gradient accent */
.chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid hsl(var(--border));
    /* Purple gradient header for brand consistency */
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%);
}

.header-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    font-size: 1rem;
}

.header-icon {
    color: #8B5CF6;
}

.header-actions {
    display: flex;
    gap: 4px;
}

/* Messages */
.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* Empty state */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px 20px;
    color: hsl(var(--muted-foreground));
}

.empty-icon {
    color: #8B5CF6;
    margin-bottom: 16px;
    filter: drop-shadow(0 4px 8px rgba(139, 92, 246, 0.3));
}

.empty-state h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: hsl(var(--foreground));
    margin-bottom: 8px;
}

.empty-state p {
    font-size: 0.875rem;
    margin-bottom: 24px;
}

.suggestion-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
}

.suggestion-chip {
    padding: 8px 16px;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 20px;
    font-size: 0.75rem;
    color: hsl(var(--foreground));
    cursor: pointer;
    transition: all 0.2s ease;
}

.suggestion-chip:hover {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.15) 100%);
    border-color: rgba(139, 92, 246, 0.5);
    transform: translateY(-1px);
}

/* Config warning */
.config-warning {
    background: hsl(var(--destructive) / 0.1);
    border: 1px solid hsl(var(--destructive) / 0.3);
    border-radius: 8px;
    padding: 12px 16px;
    margin-top: 16px;
    font-size: 0.8rem;
    color: hsl(var(--destructive));
}

/* Messages */
.message {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 90%;
}

.user-message {
    align-self: flex-end;
}

.assistant-message {
    align-self: flex-start;
}

.message-content {
    padding: 12px 16px;
    border-radius: 16px;
    font-size: 0.9rem;
    line-height: 1.5;
}

.user-message .message-content {
    background: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    border-bottom-right-radius: 4px;
}

.assistant-message .message-content {
    background: hsl(var(--muted));
    color: hsl(var(--foreground));
    border-bottom-left-radius: 4px;
}

.message-text {
    white-space: pre-wrap;
    word-break: break-word;
}

.message-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.75rem;
    color: hsl(var(--muted-foreground));
    padding: 0 4px;
}

.user-message .message-meta {
    justify-content: flex-end;
}

.loading-icon {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* Config Preview */
.config-preview {
    margin-top: 12px;
    background: hsl(var(--background));
    border: 1px solid hsl(var(--border));
    border-radius: 8px;
    overflow: hidden;
}

.preview-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: hsl(var(--muted) / 0.5);
    border-bottom: 1px solid hsl(var(--border));
    font-size: 0.8rem;
    font-weight: 500;
    color: hsl(var(--primary));
}

.preview-code {
    padding: 12px;
    font-size: 0.7rem;
    font-family: 'Monaco', 'Menlo', monospace;
    overflow-x: auto;
    max-height: 200px;
    overflow-y: auto;
    margin: 0;
    background: hsl(var(--muted) / 0.2);
}

.approval-actions {
    display: flex;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid hsl(var(--border));
}

.approve-btn {
    flex: 1;
    gap: 6px;
}

.reject-btn {
    gap: 6px;
}

/* Input */
.chat-input {
    display: flex;
    gap: 8px;
    padding: 16px 20px;
    border-top: 1px solid hsl(var(--border));
    background: hsl(var(--muted) / 0.2);
}

.input-field {
    flex: 1;
}

.send-btn {
    flex-shrink: 0;
}

/* Scrollbar styling */
.chat-messages::-webkit-scrollbar {
    width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
    background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground) / 0.3);
    border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--muted-foreground) / 0.5);
}
</style>
