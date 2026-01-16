<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { Sparkles, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useAIStore } from '@/stores/aiStore'

const aiStore = useAIStore()

const isOpen = computed(() => aiStore.isOpen)
const isLoading = computed(() => aiStore.isLoading)
const hasMessages = computed(() => aiStore.hasMessages)
const hasPreviewConfig = computed(() => aiStore.hasPreviewConfig)
const position = computed(() => aiStore.buttonPosition)

// Drag State
const isDragging = ref(false)
const dragStartTime = ref(0)
const offset = ref({ x: 0, y: 0 })
const isDocked = ref(false)

// Window dimensions (track for reactivity)
const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

const updateDimensions = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
    // Ensure button stays on screen on resize
    snapToEdge()
}

onMounted(() => {
    window.addEventListener('resize', updateDimensions)
    // Initial snap check
    snapToEdge()
})

onUnmounted(() => {
    window.removeEventListener('resize', updateDimensions)
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    window.removeEventListener('touchmove', handleTouchMove)
    window.removeEventListener('touchend', handleTouchEnd)
})

// Interaction Handlers
function handleMouseDown(e: MouseEvent) {
    if (isOpen.value) return // Disable drag when chatting
    
    startDrag(e.clientX, e.clientY)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
}

function handleTouchStart(e: TouchEvent) {
    if (isOpen.value) return
    
    const touch = e.touches[0]
    startDrag(touch.clientX, touch.clientY)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleTouchEnd)
}

function startDrag(clientX: number, clientY: number) {
    isDragging.value = false // Will be set to true on move
    dragStartTime.value = Date.now()
    offset.value = {
        x: clientX - position.value.x,
        y: clientY - position.value.y
    }
}

function handleMouseMove(e: MouseEvent) {
    e.preventDefault()
    moveDrag(e.clientX, e.clientY)
}

function handleTouchMove(e: TouchEvent) {
    // e.preventDefault() // Might block scrolling, be careful
    const touch = e.touches[0]
    moveDrag(touch.clientX, touch.clientY)
}

function moveDrag(clientX: number, clientY: number) {
    if (!isDragging.value) {
        // Threshold check to prevent accidental drags
        const dx = clientX - (position.value.x + offset.value.x)
        const dy = clientY - (position.value.y + offset.value.y)
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            isDragging.value = true
            isDocked.value = false
        }
    }
    
    if (isDragging.value) {
        let newX = clientX - offset.value.x
        let newY = clientY - offset.value.y
        
        // Clamp to screen
        newY = Math.max(10, Math.min(windowHeight.value - 74, newY))
        newX = Math.max(0, Math.min(windowWidth.value - 64, newX))
        
        aiStore.setButtonPosition(newX, newY)
    }
}

function handleMouseUp() {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    endDrag()
}

function handleTouchEnd() {
    window.removeEventListener('touchmove', handleTouchMove)
    window.removeEventListener('touchend', handleTouchEnd)
    endDrag()
}

function endDrag() {
    if (isDragging.value) {
        // Snap logic
        snapToEdge()
        
        // Short delay to allow click event to be blocked if needed
        setTimeout(() => {
            isDragging.value = false
        }, 50)
    }
}

function snapToEdge() {
    const currentX = position.value.x
    const currentY = position.value.y
    const buttonWidth = 64
    const threshold = 100
    
    let newX = currentX
    let docked = false
    
    // Check distance to Left Edge
    if (currentX < threshold) {
        newX = -32
        docked = true
    } 
    // Check distance to Right Edge
    else if (windowWidth.value - (currentX + buttonWidth) < threshold) {
        newX = windowWidth.value - 32
        docked = true
    } 
    // Free float (clamp to screen)
    else {
        newX = Math.max(0, Math.min(windowWidth.value - buttonWidth, currentX))
        docked = false
    }
    
    // Clamp Y
    let newY = Math.max(20, Math.min(windowHeight.value - 84, currentY))
    
    aiStore.setButtonPosition(newX, newY)
    isDocked.value = docked
}

function handleClick() {
    if (isDragging.value) return
    
    // If open, just toggle (close), as dragging is disabled when open
    if (isOpen.value) {
        aiStore.toggleWindow()
        return
    }
    
    // Check if it was a very short drag/click
    if (Date.now() - dragStartTime.value < 200) {
        // If docked, undock first
        if (isDocked.value) {
            // Move fully on screen
            if (position.value.x < 0) {
                aiStore.setButtonPosition(24, position.value.y)
            } else {
                aiStore.setButtonPosition(windowWidth.value - 88, position.value.y) // 24px from right
            }
            isDocked.value = false
        } else {
            aiStore.toggleWindow()
        }
    }
}

// Docked Hover/Hover End logic
const buttonStyle = computed(() => ({
    left: `${position.value.x}px`,
    top: `${position.value.y}px`
}))

</script>

<template>
    <Button
        class="ai-chat-button"
        :class="{ 
            'is-open': isOpen,
            'is-loading': isLoading,
            'is-dragging': isDragging,
            'is-docked': isDocked && !isOpen,
            'has-pending': hasPreviewConfig && !isOpen
        }"
        :style="buttonStyle"
        size="icon"
        @click="handleClick"
        @mousedown="handleMouseDown"
        @touchstart="handleTouchStart"
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
    /* Remove fixed positioning values */
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
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s, border 0.3s; /* Optimized transition */
    cursor: grab;
    overflow: hidden;
    touch-action: none; /* Prevent scroll on mobile drag */
}

/* Specific transition for position when NOT dragging */
.ai-chat-button:not(.is-dragging) {
    transition: left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), 
                top 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), 
                background 0.3s, border 0.3s;
}

.ai-chat-button:active {
    cursor: grabbing;
}

/* Docked State - Semi transparent, different look */
.ai-chat-button.is-docked {
    opacity: 0.6;
    border-radius: 40px; /* Sido pill shape */
}

.ai-chat-button.is-docked:hover {
    opacity: 1;
    /* Should pop out slightly? Handled by js logic but visual aid */
    transform: scale(1.05); /* Just scale for now */
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
.ai-chat-button:not(.is-loading):not(.is-open):not(.is-dragging):not(.is-docked) {
    animation: float 6s ease-in-out infinite;
}

/* Hover Effect */
.ai-chat-button:hover:not(.is-dragging) {
    transform: scale(1.05);
    box-shadow: 
        0 12px 40px rgba(139, 92, 246, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.4),
        inset 0 0 30px rgba(255, 255, 255, 0.3);
}

.ai-chat-button:hover::after {
    opacity: 1;
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
