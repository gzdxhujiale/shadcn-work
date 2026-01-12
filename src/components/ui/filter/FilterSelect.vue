<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

defineProps<{
  label: string
  modelValue: string
  options: string[]
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="flex items-center gap-2">
    <label class="text-xs font-medium text-muted-foreground whitespace-nowrap">{{ label }}</label>
    <Select 
      :model-value="modelValue"
      @update:model-value="(v) => $emit('update:modelValue', v as string)"
    >
      <SelectTrigger class="h-9 text-sm flex-1">
        <SelectValue :placeholder="`选择${label}`" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem 
          v-for="opt in options" 
          :key="opt" 
          :value="opt"
        >
          {{ opt }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
