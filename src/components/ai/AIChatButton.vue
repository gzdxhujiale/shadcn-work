<script setup lang="ts">
import { computed } from 'vue'
import { Sparkles } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useAIStore } from '@/stores/aiStore'

const aiStore = useAIStore()

const isOpen = computed(() => aiStore.isOpen)
const hasMessages = computed(() => aiStore.hasMessages)

function handleClick() {
    aiStore.toggleWindow()
}
</script>

<template>
    <Button
        class="ai-chat-button"
        :class="{ 'is-open': isOpen }"
        size="icon"
        @click="handleClick"
    >
        <Sparkles class="ai-icon" :size="24" />
        
        <!-- Notification dot for new messages when closed -->
        <span 
            v-if="hasMessages && !isOpen" 
            class="notification-dot"
        />
    </Button>
</template>

<style scoped>
.ai-chat-button {
    position: fixed;
    right: 24px;
    bottom: 80px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    /* Vibrant purple/blue gradient for high visibility */
    background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #4F46E5 100%);
    box-shadow: 
        0 4px 20px rgba(139, 92, 246, 0.5),
        0 8px 32px rgba(99, 102, 241, 0.3),
        0 0 0 3px rgba(139, 92, 246, 0.2);
    z-index: 1000;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    border: 2px solid rgba(255, 255, 255, 0.3);
}

.ai-chat-button:hover {
    transform: scale(1.08) translateY(-2px);
    box-shadow: 
        0 8px 30px rgba(139, 92, 246, 0.6),
        0 12px 40px rgba(99, 102, 241, 0.4),
        0 0 0 4px rgba(139, 92, 246, 0.3);
    background: linear-gradient(135deg, #A78BFA 0%, #818CF8 50%, #6366F1 100%);
}

.ai-chat-button:active {
    transform: scale(0.95);
}

.ai-chat-button.is-open {
    transform: rotate(45deg);
    background: linear-gradient(135deg, #64748B 0%, #475569 100%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.ai-chat-button.is-open:hover {
    transform: rotate(45deg) scale(1.05);
}

.ai-icon {
    color: white;
    transition: transform 0.3s ease;
}

.ai-chat-button:hover .ai-icon {
    animation: sparkle 0.6s ease-in-out;
}

.ai-chat-button.is-open .ai-icon {
    color: hsl(var(--muted-foreground));
}

.notification-dot {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 12px;
    height: 12px;
    background: hsl(var(--destructive));
    border-radius: 50%;
    border: 2px solid white;
    animation: pulse 2s infinite;
}

@keyframes sparkle {
    0%, 100% {
        transform: scale(1) rotate(0deg);
    }
    25% {
        transform: scale(1.1) rotate(-5deg);
    }
    50% {
        transform: scale(1.15) rotate(5deg);
    }
    75% {
        transform: scale(1.1) rotate(-5deg);
    }
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.7;
        transform: scale(1.1);
    }
}

/* Ripple effect on hover */
.ai-chat-button::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: hsl(var(--primary) / 0.2);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.ai-chat-button:hover::before {
    opacity: 1;
    animation: ripple 1.5s ease-out infinite;
}

@keyframes ripple {
    0% {
        transform: scale(1);
        opacity: 0.4;
    }
    100% {
        transform: scale(1.5);
        opacity: 0;
    }
}
</style>
