<script setup lang="ts">
import type { LucideIcon } from "lucide-vue-next"
import {
  Folder,
  Forward,
  MoreHorizontal,
  Trash2,
} from "lucide-vue-next"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useNavigation } from '@/config/sidebar'

const props = withDefaults(
  defineProps<{
    label?: string
    showMoreButton?: boolean
    projects: {
      name: string
      url: string
      icon: LucideIcon
    }[]
    showLabel?: boolean
  }>(),
  {
    label: 'Projects',
    showMoreButton: true,
    showLabel: true,
  }
)

const { isMobile } = useSidebar()
const { currentSubNav, setNavigation, setDetailTitle } = useNavigation()

// 处理项目点击
const handleProjectClick = (projectName: string) => {
  setNavigation(props.label, projectName)
  setDetailTitle(null)
}

// 检查项目是否激活
const isProjectActive = (projectName: string) => {
  return currentSubNav.value === projectName
}
</script>

<template>
  <SidebarGroup class="group-data-[collapsible=icon]:hidden">
    <SidebarGroupLabel v-if="props.showLabel">{{ props.label }}</SidebarGroupLabel>
    <SidebarMenu>
      <SidebarMenuItem v-for="item in projects" :key="item.name">
        <SidebarMenuButton 
          as-child
          @click="handleProjectClick(item.name)"
          :class="{ 'bg-primary/10 text-primary font-medium': isProjectActive(item.name) }"
        >
          <a :href="item.url">
            <component :is="item.icon" />
            <span>{{ item.name }}</span>
          </a>
        </SidebarMenuButton>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <SidebarMenuAction show-on-hover>
              <MoreHorizontal />
              <span class="sr-only">More</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            class="w-48 rounded-lg"
            :side="isMobile ? 'bottom' : 'right'"
            :align="isMobile ? 'end' : 'start'"
          >
            <DropdownMenuItem>
              <Folder class="text-muted-foreground" />
              <span>View Project</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Forward class="text-muted-foreground" />
              <span>Share Project</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Trash2 class="text-muted-foreground" />
              <span>Delete Project</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <SidebarMenuItem v-if="props.showMoreButton">
        <SidebarMenuButton class="text-sidebar-foreground/70">
          <MoreHorizontal class="text-sidebar-foreground/70" />
          <span>More</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroup>
</template>

