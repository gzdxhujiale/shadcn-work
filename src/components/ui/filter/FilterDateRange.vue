<script setup lang="ts">
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { RangeCalendar } from '@/components/ui/range-calendar'
import { DateFormatter, getLocalTimeZone } from '@internationalized/date'
import type { DateRange } from 'radix-vue'

defineProps<{
  label: string
  modelValue: DateRange | undefined
}>()

defineEmits<{
  'update:modelValue': [value: DateRange | undefined]
}>()

const df = new DateFormatter('zh-CN', {
  dateStyle: 'medium',
})
</script>

<template>
  <div class="flex items-center gap-2">
    <label class="text-xs font-medium text-muted-foreground whitespace-nowrap">{{ label }}</label>
    <Popover>
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          class="h-9 flex-1 justify-start text-left font-normal px-3"
          :class="!modelValue && 'text-muted-foreground'"
        >
          <CalendarIcon class="mr-2 h-4 w-4" />
          <template v-if="modelValue?.start">
            <template v-if="modelValue?.end">
              {{ df.format(modelValue.start.toDate(getLocalTimeZone())) }} - {{ df.format(modelValue.end.toDate(getLocalTimeZone())) }}
            </template>
            <template v-else>
              {{ df.format(modelValue.start.toDate(getLocalTimeZone())) }}
            </template>
          </template>
          <template v-else>
            <span>选择日期</span>
          </template>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0" align="start">
        <RangeCalendar
          :model-value="modelValue"
          initial-focus
          :number-of-months="2"
          @update:model-value="$emit('update:modelValue', $event)"
        />
      </PopoverContent>
    </Popover>
  </div>
</template>
