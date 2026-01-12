<script setup lang="ts">
import { Input } from '@/components/ui/input'

defineProps<{
  label: string
  modelValue: string | number
  placeholder?: string
}>()

defineEmits<{
  'update:modelValue': [value: string | number]
}>()
</script>

<template>
  <div class="flex items-center gap-2">
    <label class="text-xs font-medium text-muted-foreground whitespace-nowrap">{{ label }}</label>
    <Input
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :placeholder="placeholder"
      class="h-9 text-sm flex-1"
    />
  </div>
</template>
