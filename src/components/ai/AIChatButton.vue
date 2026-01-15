<script setup lang="ts">
import { computed } from 'vue'
import { Sparkles, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useAIStore } from '@/stores/aiStore'

const aiStore = useAIStore()

const isOpen = computed(() => aiStore.isOpen)
const isLoading = computed(() => aiStore.isLoading)
const hasMessages = computed(() => aiStore.hasMessages)
const hasPreviewConfig = computed(() => aiStore.hasPreviewConfig)

function handleClick() {
    aiStore.toggleWindow()
}
</script>

<template>
    <Button
        class="ai-chat-button"
        :class="{ 
            'is-open': isOpen,
            'is-loading': isLoading,
            'has-pending': hasPreviewConfig && !isOpen
        }"
        size="icon"
        @click="handleClick"
    >
        <Loader2 v-if="isLoading && !isOpen" class="ai-icon loading" :size="24" />
        <Sparkles v-else class="ai-icon" :size="24" />
        
        <!-- Notification dot for pending config or new messages when closed -->
        <span 
            v-if="(hasPreviewConfig || hasMessages) && !isOpen" 
            class="notification-dot"
            :class="{ 'pending': hasPreviewConfig }"
        />
    </Button>
</template>

<style scoped>
.ai-chat-button {
    position: fixed;
    right: 24px;
    bottom: 80px;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    /* Glassmorphism Orb Base */
    background: rgba(139, 92, 246, 0.4);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 
        0 8px 32px rgba(31, 38, 135, 0.15),
        inset 0 0 20px rgba(255, 255, 255, 0.2);
    z-index: 1000;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
    overflow: hidden;
}

/* Inner Orb Gradient */
.ai-chat-button::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #a78bfa 0%, #6366f1 100%);
    opacity: 0.8;
    z-index: -1;
    transition: opacity 0.3s ease;
}

/* Idle Breathing Animation */
.ai-chat-button:not(.is-loading):not(.is-open) {
    animation: float 6s ease-in-out infinite;
}

/* Hover Effect */
.ai-chat-button:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 
        0 12px 40px rgba(139, 92, 246, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.4),
        inset 0 0 30px rgba(255, 255, 255, 0.3);
}

.ai-chat-button:hover::after {
    opacity: 1;
}

/* Active State */
.ai-chat-button:active {
    transform: scale(0.95);
}

/* Open State - Morphed into close button */
.ai-chat-button.is-open {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(255, 255, 255, 0.1);
    transform: rotate(90deg);
}

.ai-chat-button.is-open::after {
    opacity: 0;
}

.ai-chat-button.is-open:hover {
    background: rgba(15, 23, 42, 0.8);
    transform: rotate(90deg) scale(1.05);
}

/* Icons */
.ai-icon {
    color: white;
    transition: all 0.4s ease;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.ai-chat-button.is-open .ai-icon {
    color: rgba(255, 255, 255, 0.9);
    transform: rotate(-90deg); /* Counter-rotate icon */
}

/* Loading State */
.ai-icon.loading {
    animation: spin 1.5s cubic-bezier(0.17, 0.67, 0.83, 0.67) infinite;
}

.ai-chat-button.is-loading:not(.is-open) {
    box-shadow: 
        0 4px 20px rgba(139, 92, 246, 0.5),
        0 0 0 2px rgba(139, 92, 246, 0.3);
}

/* Notification Dot */
.notification-dot {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 10px;
    height: 10px;
    background: #ef4444;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
    z-index: 10;
}

.notification-dot.pending {
    background: #f59e0b;
    box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
}

/* Animations */
@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

@keyframes sparkle {
    0%, 100% { transform: scale(1); filter: brightness(1); }
    50% { transform: scale(1.2); filter: brightness(1.3); }
}

/* Ripple effect container */
.ai-chat-button::before {
    content: '';
    position: absolute;
    inset: -20px;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%);
    opacity: 0;
    z-index: -2;
    transition: opacity 0.3s;
    pointer-events: none;
}

.ai-chat-button:not(.is-open):hover::before {
    opacity: 1;
    animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
    0% { transform: scale(0.8); opacity: 0.5; }
    100% { transform: scale(1.5); opacity: 0; }
}
</style>
