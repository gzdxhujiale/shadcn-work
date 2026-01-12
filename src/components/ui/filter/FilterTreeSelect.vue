<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronRight, ChevronDown, Check } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// 树节点类型
export interface TreeNode {
  value: string
  label: string
  children?: TreeNode[]
}

const props = defineProps<{
  label: string
  modelValue: string
  options: TreeNode[]
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const expandedNodes = ref<Set<string>>(new Set())

// 获取选中节点的显示标签
const selectedLabel = computed(() => {
  const findLabel = (nodes: TreeNode[]): string | null => {
    for (const node of nodes) {
      if (node.value === props.modelValue) {
        return node.label
      }
      if (node.children) {
        const found = findLabel(node.children)
        if (found) return found
      }
    }
    return null
  }
  return findLabel(props.options) || props.placeholder || `选择${props.label}`
})

// 切换节点展开/折叠
const toggleExpand = (nodeValue: string, event: Event) => {
  event.stopPropagation()
  if (expandedNodes.value.has(nodeValue)) {
    expandedNodes.value.delete(nodeValue)
  } else {
    expandedNodes.value.add(nodeValue)
  }
}

// 选择节点
const selectNode = (node: TreeNode) => {
  emit('update:modelValue', node.value)
  open.value = false
}

// 检查节点是否有子节点
const hasChildren = (node: TreeNode) => {
  return node.children && node.children.length > 0
}

// 检查节点是否展开
const isExpanded = (nodeValue: string) => {
  return expandedNodes.value.has(nodeValue)
}

// 检查节点是否选中
const isSelected = (nodeValue: string) => {
  return props.modelValue === nodeValue
}
</script>

<template>
  <div class="flex items-center gap-2">
    <label class="text-xs font-medium text-muted-foreground whitespace-nowrap">{{ label }}</label>
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          :aria-expanded="open"
          class="h-9 flex-1 justify-between text-sm font-normal"
        >
          <span :class="{ 'text-muted-foreground': !modelValue }">
            {{ selectedLabel }}
          </span>
          <ChevronDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-[280px] p-0" align="start">
        <div class="max-h-[300px] overflow-auto p-1">
          <!-- 递归渲染树节点 -->
          <template v-for="node in options" :key="node.value">
            <div class="tree-node">
              <div
                :class="cn(
                  'flex items-center gap-1 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-muted transition-colors text-sm',
                  isSelected(node.value) && 'bg-primary/10 text-primary'
                )"
                @click="selectNode(node)"
              >
                <!-- 展开/折叠按钮 -->
                <button
                  v-if="hasChildren(node)"
                  class="p-0.5 hover:bg-muted-foreground/10 rounded"
                  @click="toggleExpand(node.value, $event)"
                >
                  <ChevronRight 
                    v-if="!isExpanded(node.value)" 
                    class="h-3.5 w-3.5 text-muted-foreground" 
                  />
                  <ChevronDown 
                    v-else 
                    class="h-3.5 w-3.5 text-muted-foreground" 
                  />
                </button>
                <span v-else class="w-4" />
                
                <!-- 节点标签 -->
                <span class="flex-1">{{ node.label }}</span>
                
                <!-- 选中标记 -->
                <Check 
                  v-if="isSelected(node.value)" 
                  class="h-4 w-4 text-primary" 
                />
              </div>
              
              <!-- 子节点 -->
              <div 
                v-if="hasChildren(node) && isExpanded(node.value)" 
                class="ml-4 border-l border-muted pl-1"
              >
                <template v-for="child in node.children" :key="child.value">
                  <div class="tree-node">
                    <div
                      :class="cn(
                        'flex items-center gap-1 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-muted transition-colors text-sm',
                        isSelected(child.value) && 'bg-primary/10 text-primary'
                      )"
                      @click="selectNode(child)"
                    >
                      <!-- 二级展开按钮 -->
                      <button
                        v-if="hasChildren(child)"
                        class="p-0.5 hover:bg-muted-foreground/10 rounded"
                        @click="toggleExpand(child.value, $event)"
                      >
                        <ChevronRight 
                          v-if="!isExpanded(child.value)" 
                          class="h-3.5 w-3.5 text-muted-foreground" 
                        />
                        <ChevronDown 
                          v-else 
                          class="h-3.5 w-3.5 text-muted-foreground" 
                        />
                      </button>
                      <span v-else class="w-4" />
                      
                      <span class="flex-1">{{ child.label }}</span>
                      <Check 
                        v-if="isSelected(child.value)" 
                        class="h-4 w-4 text-primary" 
                      />
                    </div>
                    
                    <!-- 三级节点 -->
                    <div 
                      v-if="hasChildren(child) && isExpanded(child.value)" 
                      class="ml-4 border-l border-muted pl-1"
                    >
                      <div
                        v-for="grandchild in child.children"
                        :key="grandchild.value"
                        :class="cn(
                          'flex items-center gap-1 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-muted transition-colors text-sm',
                          isSelected(grandchild.value) && 'bg-primary/10 text-primary'
                        )"
                        @click="selectNode(grandchild)"
                      >
                        <span class="w-4" />
                        <span class="flex-1">{{ grandchild.label }}</span>
                        <Check 
                          v-if="isSelected(grandchild.value)" 
                          class="h-4 w-4 text-primary" 
                        />
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>
