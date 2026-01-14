import { ref, onMounted, onUnmounted } from 'vue'
import { toast } from 'vue-sonner'

/**
 * Network status composable
 * Monitors online/offline status and shows toast notifications
 */
export function useNetworkStatus() {
    const isOnline = ref(navigator.onLine)

    const handleOnline = () => {
        isOnline.value = true
        toast.success('网络已恢复', {
            description: '您现在可以继续使用所有功能'
        })
    }

    const handleOffline = () => {
        isOnline.value = false
        toast.warning('网络连接已断开', {
            description: '部分功能可能无法使用',
            duration: Infinity // 持续显示直到网络恢复
        })
    }

    onMounted(() => {
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
    })

    onUnmounted(() => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
    })

    return {
        isOnline
    }
}
