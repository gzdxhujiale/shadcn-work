<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import AppSidebar from '@/components/AppSidebar.vue'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useNavigation } from '@/config/sidebar'
import { Toaster } from '@/components/ui/sonner'
import "vue-sonner/style.css"

// 导入页面模板
import Page1 from '@/components/templates/Page1.vue'
import PlaceholderPage from '@/components/pages/PlaceholderPage.vue'
import Settings from '@/components/pages/Settings.vue'
import AuthPage from '@/components/pages/AuthPage.vue'
import SkeletonLoading from '@/components/shared/SkeletonLoading.vue'

// AI Components
import { AIChatButton, AIChatWindow } from '@/components/ai'

// Composables
import { useNetworkStatus } from '@/composables/useNetworkStatus'

// Auth Store
import { useAuthStore } from '@/stores/authStore'
// Config Store
import { useConfigStore } from '@/stores/configStore'

const { breadcrumbs, currentPage, setDetailTitle } = useNavigation()
const authStore = useAuthStore()
const configStore = useConfigStore()

// 页面模板映射
const pageComponents: Record<string, any> = {
  Page1,
  Settings,
  // Page2, // 后续添加更多模板时，在此注册...
}

// 当前显示的组件 - 未注册的模板显示占位组件
const CurrentPageComponent = computed(() => pageComponents[currentPage.value] || PlaceholderPage)

// 点击第二级面包屑返回列表
const handleSubNavClick = () => {
  if (breadcrumbs.value.detail) {
    setDetailTitle(null)
  }
}

// Initialize auth on mount
onMounted(async () => {
  await authStore.initialize()
  // 登录成功后加载云端配置
  if (authStore.isAuthenticated) {
    await configStore.loadFromSupabase()
  }
})

// 监听认证状态变化，登录后加载配置
watch(() => authStore.isAuthenticated, async (isAuth) => {
  if (isAuth) {
    await configStore.loadFromSupabase()
  }
})

// Cleanup on unmount
onUnmounted(() => {
  authStore.cleanup()
})

// Network status monitoring
useNetworkStatus()
</script>

<template>
  <!-- Loading state: show skeleton -->
  <SkeletonLoading v-if="authStore.isLoading" />

  <!-- Not authenticated: show login page -->
  <AuthPage v-else-if="!authStore.isAuthenticated" />

  <!-- Authenticated: show main app -->
  <SidebarProvider v-else>
    <AppSidebar />
    <SidebarInset>
      <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <Breadcrumb class="flex-1">
          <BreadcrumbList>
            <BreadcrumbItem class="hidden md:block">
              <BreadcrumbLink href="#">
                {{ breadcrumbs.main }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator class="hidden md:block">
              <ChevronRight />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <!-- 如果有详情页，第二级变为可点击的链接 -->
              <BreadcrumbLink v-if="breadcrumbs.detail" href="#" @click.prevent="handleSubNavClick">
                {{ breadcrumbs.sub }}
              </BreadcrumbLink>
              <BreadcrumbPage v-else>{{ breadcrumbs.sub }}</BreadcrumbPage>
            </BreadcrumbItem>
            
            <!-- 第三级：详情页 -->
            <template v-if="breadcrumbs.detail">
              <BreadcrumbSeparator>
                <ChevronRight />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>{{ breadcrumbs.detail }}</BreadcrumbPage>
              </BreadcrumbItem>
            </template>
          </BreadcrumbList>
        </Breadcrumb>
        
        <!-- 页面操作区域 - Teleport 目标 -->
        <div id="breadcrumb-actions" class="flex items-center gap-4">
          <!-- 各页面会通过 Teleport 在此渲染内容 -->
        </div>
      </header>
      <div class="flex flex-1 flex-col overflow-hidden">
        <Transition
          name="fade-slide"
          mode="out-in"
          appear
        >
          <component :is="CurrentPageComponent" :key="currentPage" />
        </Transition>
      </div>
    </SidebarInset>
    
    <!-- AI Chat Components -->
    <AIChatButton />
    <AIChatWindow />
  </SidebarProvider>
  
  <Toaster position="top-right" />
</template>

<style>
/* Loading state styles */
.loading-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--background));
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  color: hsl(var(--primary));
  animation: spin 1s linear infinite;
}

.loading-text {
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Page transition effects */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>


