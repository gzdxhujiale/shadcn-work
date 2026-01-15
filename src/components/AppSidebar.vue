<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SidebarProps } from '@/components/ui/sidebar'
import { defaultSidebarConfig, type SidebarConfig } from '@/config/sidebar'
import { useConfigStore } from '@/stores/configStore'

import NavMain from '@/components/NavMain.vue'
import NavProjects from '@/components/NavProjects.vue'
import NavUser from '@/components/NavUser.vue'
import TeamSwitcher from '@/components/TeamSwitcher.vue'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'

// Props 定义，支持自定义配置
interface AppSidebarProps extends SidebarProps {
  config?: SidebarConfig
}

const props = withDefaults(defineProps<AppSidebarProps>(), {
  collapsible: 'icon',
})

// 使用 Pinia store
const configStore = useConfigStore()

// 使用传入的配置或默认配置（用于非 navGroups 的部分）
const sidebarConfig = props.config ?? defaultSidebarConfig

// 当前选中的团队
const activeTeam = ref(sidebarConfig.teams[0])

// 根据权限过滤导航菜单 - 从 Pinia store 读取（支持预览模式）
const filteredNavGroups = computed(() => {
  const team = activeTeam.value
  // 使用 store 的 effectiveNavGroups 以支持预览模式
  const navGroups = configStore.effectiveNavGroups
  
  if (!team || !team.permissions) return navGroups

  const { navMain, navItems } = team.permissions

  // 如果 navMain 是 'all'，显示所有，但仍需检查 navItems 的细粒度控制
  if (navMain === 'all' && !navItems) {
    return navGroups
  }

  return navGroups.map(group => {
    // 过滤组内的一级菜单
    const filteredItems = group.items.filter(item => {
      // 1. 检查一级菜单权限
      const isMainVisible = navMain === 'all' || navMain.includes(item.id)
      if (!isMainVisible) return false

      // 2. 检查二级菜单权限 (NavItems)
      if (navItems && navItems[item.id]) {
        if (!item.items) return true
        
        // 过滤子项
        const visibleSubItemIds = navItems[item.id] ?? []
        const filteredSubItems = item.items.filter(subItem => visibleSubItemIds.includes(subItem.id))
        
        return filteredSubItems.length > 0
      }
      return true
    }).map(item => {
        // 处理细粒度权限，返回新的 item 对象
        if (navItems && navItems[item.id] && item.items) {
             const visibleSubItemIds = navItems[item.id] ?? []
             const filteredSubItems = item.items.filter(subItem => visibleSubItemIds.includes(subItem.id))
             return {
                 ...item,
                 items: filteredSubItems
             }
        }
        return item
    })

    return {
      ...group,
      items: filteredItems
    }
  }).filter(group => group.items.length > 0) // 过滤掉变为空的组
})

// 根据权限过滤项目列表
const filteredProjectGroups = computed(() => {
    const team = activeTeam.value
    if (!team || !team.permissions) return sidebarConfig.projectGroups

    const { projects } = team.permissions
    if (projects === 'all') return sidebarConfig.projectGroups

    return sidebarConfig.projectGroups.map(group => {
        const filteredProjects = group.projects.filter(project => projects.includes(project.id))
        return {
            ...group,
            projects: filteredProjects
        }
    }).filter(group => group.projects.length > 0)
})

// 是否处于预览模式
const isInPreviewMode = computed(() => configStore.isInPreviewMode)
const previewMode = computed(() => configStore.previewMode)
</script>

<template>
  <Sidebar 
    :collapsible="props.collapsible"
    :side="props.side"
    :variant="props.variant"
    :class="{ 'preview-mode': isInPreviewMode }"
  >
    <SidebarHeader>
      <!-- 预览模式指示器 -->
      <div v-if="isInPreviewMode" class="preview-indicator">
        <span class="preview-badge">
          {{ previewMode === 'override' ? '覆盖预览' : '追加预览' }}
        </span>
      </div>
      <!-- 传递 v-model 绑定 activeTeam -->
      <TeamSwitcher 
        :teams="sidebarConfig.teams" 
        v-model="activeTeam"
      />
    </SidebarHeader>
    <SidebarContent>
      <!-- 渲染过滤后的导航分组 -->
      <NavMain 
        v-for="(group, index) in filteredNavGroups" 
        :key="group.id ?? `nav-${index}`"
        :label="group.label"
        :show-label="group.showLabel ?? true"
        :items="group.items" 
        :is-open="group.items.some(i => i.isOpen)" 
      />
      <!-- 渲染过滤后的项目分组 -->
      <NavProjects 
        v-for="(group, index) in filteredProjectGroups" 
        :key="group.id ?? `project-${index}`"
        :label="group.label"
        :show-label="group.showLabel ?? true"
        :projects="group.projects"
        :show-more-button="group.showMoreButton"
      />
    </SidebarContent>
    <SidebarFooter>
      <NavUser :user="sidebarConfig.user" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>

<style scoped>
.preview-mode {
  border: 2px solid rgba(139, 92, 246, 0.5);
  box-shadow: inset 0 0 20px rgba(139, 92, 246, 0.1);
}

.preview-indicator {
  padding: 8px 12px;
  text-align: center;
}

.preview-badge {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 12px;
  animation: pulse-glow 2s infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
  }
  50% {
    box-shadow: 0 0 16px rgba(139, 92, 246, 0.8);
  }
}
</style>
