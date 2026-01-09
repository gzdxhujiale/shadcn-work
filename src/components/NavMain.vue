<script setup lang="ts">
import type { LucideIcon } from "lucide-vue-next"
import { ChevronRight } from "lucide-vue-next"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { useNavigation } from '@/composables/useNavigation'

const props = withDefaults(
  defineProps<{
    label?: string
    items: {
      title: string
      url: string
      icon?: LucideIcon
      isActive?: boolean
      isOpen?: boolean
      items?: {
        title: string
        url: string
      }[]
    }[]
  }>(),
  {
    label: 'Platform',
  }
)

const { currentSubNav, setNavigation, setDetailTitle } = useNavigation()

// 处理导航点击
const handleNavClick = (mainNav: string, subNav: string) => {
  setNavigation(mainNav, subNav)
  setDetailTitle(null) // 切换页面时清除第三级面包屑
}

// 检查子项是否激活
const isSubItemActive = (subTitle: string) => {
  return currentSubNav.value === subTitle
}

// 检查主项是否有激活的子项
const hasActiveChild = (item: any) => {
  return item.items?.some((sub: any) => sub.title === currentSubNav.value)
}
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel>{{ props.label }}</SidebarGroupLabel>
    <SidebarMenu>
      <Collapsible
        v-for="item in items"
        :key="item.title"
        as-child
        :default-open="item.isOpen ?? item.isActive ?? hasActiveChild(item)"
        class="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger as-child>
            <SidebarMenuButton 
              :tooltip="item.title"
              :class="{ 'bg-sidebar-accent text-sidebar-accent-foreground': hasActiveChild(item) }"
            >
              <component :is="item.icon" v-if="item.icon" />
              <span>{{ item.title }}</span>
              <ChevronRight class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              <SidebarMenuSubItem v-for="subItem in item.items" :key="subItem.title">
                <SidebarMenuSubButton 
                  as-child 
                  @click="handleNavClick(item.title, subItem.title)"
                  :class="{ 
                    'bg-primary/10 text-primary font-medium': isSubItemActive(subItem.title)
                  }"
                >
                  <a :href="subItem.url">
                    <span>{{ subItem.title }}</span>
                  </a>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  </SidebarGroup>
</template>
