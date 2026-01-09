<script setup lang="ts">
import { computed } from 'vue'
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

// 导入页面组件
import Withdraw from '@/components/pages/workspace/Withdraw.vue'
import PlaceholderPage from '@/components/pages/PlaceholderPage.vue'

const { breadcrumbs, currentPage, setDetailTitle } = useNavigation()

// 页面组件映射
const pageComponents: Record<string, any> = {
  Withdraw,
  // 后续添加更多页面时，在此注册...
}

// 当前显示的组件 - 未注册的页面显示占位组件
const CurrentPageComponent = computed(() => pageComponents[currentPage.value] || PlaceholderPage)

// 点击第二级面包屑返回列表
const handleSubNavClick = () => {
  if (breadcrumbs.value.detail) {
    setDetailTitle(null)
  }
}
</script>

<template>
  <SidebarProvider>
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
  </SidebarProvider>
</template>

<style>
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

