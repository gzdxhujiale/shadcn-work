<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Settings,
  Loader2,
} from "lucide-vue-next"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useNavigation } from '@/config/sidebar'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'vue-sonner'

const props = defineProps<{
  user: {
    name: string
    email: string
    avatar: string
  }
}>()

const { isMobile } = useSidebar()
const { setNavigation, setDetailTitle } = useNavigation()
const authStore = useAuthStore()

// Account dialog state
const accountDialogOpen = ref(false)
const isLoggingOut = ref(false)

// Computed user info (prefer auth store, fallback to props)
const displayName = computed(() => authStore.userDisplayName || props.user.name || 'User')
const displayEmail = computed(() => authStore.userEmail || props.user.email || '')
const displayAvatar = computed(() => authStore.userAvatar || props.user.avatar || '')

// Get initials for avatar fallback
const initials = computed(() => {
  const name = displayName.value
  if (!name) return 'U'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

// 点击设置按钮
const handleSettingsClick = () => {
  setNavigation('系统', '配置设置', 'settings')
  setDetailTitle(null)
}

// 点击账户按钮
const handleAccountClick = () => {
  accountDialogOpen.value = true
}

// 登出
const handleLogout = async () => {
  isLoggingOut.value = true
  try {
    const result = await authStore.signOut()
    if (result.success) {
      toast.success('已退出登录', { description: '期待您的再次使用' })
    } else {
      toast.error('退出失败', { description: result.error || '请重试' })
    }
  } finally {
    isLoggingOut.value = false
  }
}
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarImage :src="displayAvatar" :alt="displayName" />
              <AvatarFallback class="rounded-lg">
                {{ initials }}
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{{ displayName }}</span>
              <span class="truncate text-xs">{{ displayEmail }}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          :side="isMobile ? 'bottom' : 'right'"
          align="end"
          :side-offset="4"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar class="h-8 w-8 rounded-lg">
                <AvatarImage :src="displayAvatar" :alt="displayName" />
                <AvatarFallback class="rounded-lg">
                  {{ initials }}
                </AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">{{ displayName }}</span>
                <span class="truncate text-xs">{{ displayEmail }}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem @click="handleSettingsClick">
              <Settings />
              Upgrade for Setting
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem @click="handleAccountClick">
              <BadgeCheck />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CreditCard />
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bell />
              Notifications
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="handleLogout" :disabled="isLoggingOut">
            <Loader2 v-if="isLoggingOut" class="animate-spin" />
            <LogOut v-else />
            {{ isLoggingOut ? '正在退出...' : 'Log out' }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>

  <!-- Account Info Dialog -->
  <Dialog v-model:open="accountDialogOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>账户信息</DialogTitle>
        <DialogDescription>
          您的 Supabase 账户信息
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <div class="flex items-center gap-4">
          <Avatar class="h-16 w-16">
            <AvatarImage :src="displayAvatar" :alt="displayName" />
            <AvatarFallback class="text-lg">{{ initials }}</AvatarFallback>
          </Avatar>
          <div class="flex-1">
            <h3 class="font-semibold text-lg">{{ displayName }}</h3>
            <p class="text-sm text-muted-foreground">{{ displayEmail }}</p>
          </div>
        </div>
        <div class="rounded-lg border p-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">用户ID</span>
            <span class="font-mono text-xs">{{ authStore.user?.id?.slice(0, 8) }}...</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">邮箱验证</span>
            <span :class="authStore.user?.email_confirmed_at ? 'text-green-500' : 'text-yellow-500'">
              {{ authStore.user?.email_confirmed_at ? '已验证' : '未验证' }}
            </span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">创建时间</span>
            <span>{{ authStore.user?.created_at ? new Date(authStore.user.created_at).toLocaleDateString('zh-CN') : '-' }}</span>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
