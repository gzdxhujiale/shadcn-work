<script setup lang="ts">
defineProps<{
  title: string
  data: string | number
  height?: string
  width?: string
}>()
</script>

<template>
  <div 
    class="bg-background rounded-lg border shadow-sm p-4 flex flex-col"
    :style="{ height, width }"
  >
    <div class="text-xs font-medium text-muted-foreground mb-2">{{ title }}</div>
    <div class="flex-1 flex items-center">
      <span class="text-2xl font-semibold text-foreground">{{ data }}</span>
    </div>
  </div>
</template>
