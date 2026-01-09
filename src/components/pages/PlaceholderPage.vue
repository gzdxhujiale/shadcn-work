<script setup lang="ts">
import { Construction } from 'lucide-vue-next'
import { useNavigation } from '@/config/sidebar'

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
  }>(),
  {
    title: '页面开发中',
    description: '此功能正在开发中，敬请期待...'
  }
)

const { currentSubNav } = useNavigation()

</script>

<template>
  <div class="h-full flex items-center justify-center bg-muted/20">
    <div class="text-center max-w-md mx-auto p-8">
      <!-- 图标 -->
      <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        <Construction class="w-10 h-10 text-primary" />
      </div>
      
      <!-- 标题 -->
      <h2 class="text-2xl font-bold mb-3 text-foreground">
        {{ currentSubNav || props.title }}
      </h2>
      
      <!-- 描述 -->
      <p class="text-muted-foreground mb-6 leading-relaxed">
        {{ props.description }}
      </p>
      
      <!-- 进度提示 -->
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium mb-6">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        开发进行中
      </div>
    </div>
  </div>
</template>
