<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Layers, Plus, Pencil, Trash2, Settings2, Save, FileCode, GripVertical, Info } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'vue-sonner'
import draggable from 'vuedraggable'
import { useConfigStore, type NavSubItem, type FilterConfig, type TableColumn } from '@/stores/configStore'

// Store
const configStore = useConfigStore()

// UI State - 当前选中的导航项
const selectedNavId = ref<string | null>(null)

// Dialog State
const editNavDialogOpen = ref(false)
const filterDialogOpen = ref(false)
const columnDialogOpen = ref(false)
const editingFilterIndex = ref<number | null>(null)  // null = 添加模式, number = 编辑模式
const editingColumnIndex = ref<number | null>(null)  // null = 添加模式, number = 编辑模式

// AlertDialog State (替代 confirm())
const confirmDialogOpen = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogDescription = ref('')
const pendingConfirmAction = ref<(() => void) | null>(null)

// Form State
const navForm = ref({
  title: '',
  template: 'none' as 'Page1' | 'Page2' | 'none'
})

const filterForm = ref({
  key: '',
  type: 'input' as 'input' | 'select' | 'date-range' | 'tree-select',
  label: '',
  placeholder: '',
  options: '', // 逗号分隔的选项列表
  treeOptions: '' // JSON 字符串用于 tree-select
})

const columnForm = ref({
  key: '',
  label: '',
  width: '100px',
  type: 'text' as 'text' | 'badge' | 'status-badge',
})

// 获取所有子导航项（扁平化）
const allSubNavItems = computed(() => {
  const items: { groupIndex: number; mainItemId: string; subItem: NavSubItem }[] = []
  configStore.navGroups.forEach((group, groupIndex) => {
    group.items.forEach(mainItem => {
      mainItem.items?.forEach(subItem => {
        items.push({ groupIndex, mainItemId: mainItem.id, subItem })
      })
    })
  })
  return items
})

// 当前选中的导航项信息
const selectedNavInfo = computed(() => {
  if (!selectedNavId.value) return null
  return allSubNavItems.value.find(item => item.subItem.id === selectedNavId.value)
})

// 当前导航的页面配置 (Issue 2: 使用 getter 确保响应性)
const currentPageConfig = computed(() => {
  if (!selectedNavId.value) return null
  return configStore.getPage1Config(selectedNavId.value) || null
})

// 默认选中第一个导航项
onMounted(() => {
  if (allSubNavItems.value.length > 0 && !selectedNavId.value) {
    selectedNavId.value = allSubNavItems.value[0].subItem.id
  }
})

// ============================================
// Navigation Item Actions
// ============================================

const handleSelectNav = (navId: string) => {
  selectedNavId.value = navId
}

const openEditNavDialog = () => {
  if (selectedNavInfo.value) {
    navForm.value = {
      title: selectedNavInfo.value.subItem.title,
      template: selectedNavInfo.value.subItem.template || 'none'
    }
    editNavDialogOpen.value = true
  }
}

const closeEditNavDialog = () => {
  editNavDialogOpen.value = false
}

const handleEditNav = () => {
  if (selectedNavInfo.value && navForm.value.title) {
    configStore.updateSubNavItem(
      selectedNavInfo.value.groupIndex,
      selectedNavInfo.value.mainItemId,
      selectedNavId.value!,
      {
        title: navForm.value.title,
        // Issue 1: 使用空字符串而不是 undefined，保持与 sidebar.ts 一致
        template: navForm.value.template === 'none' ? '' : navForm.value.template
      }
    )
    closeEditNavDialog()
  }
}

// ============================================
// Page Config Actions
// ============================================

const handleCreatePageConfig = () => {
  if (selectedNavId.value && !currentPageConfig.value) {
    configStore.addPage1Config(selectedNavId.value, {
      filterArea: {
        columns: 4,
        gap: '16px',
        filters: []
      },
      tableArea: {
        height: '500px',
        scrollX: true,
        scrollY: true,
        showCheckbox: true,
        columns: []
      }
    })
  }
}

const handleDeletePageConfig = () => {
  if (!selectedNavId.value) return
  
  showConfirm(
    '确定要重置该页面吗？',
    '这将会：\n1. 删除当前的页面配置\n2. 将页面恢复到“开发中”状态\n\n操作后请点击顶部“写入源码”以永久生效。',
    () => configStore.deletePage1Config(selectedNavId.value!)
  )
}

// ============================================
// Filter Config Actions
// ============================================

const openAddFilterDialog = () => {
  editingFilterIndex.value = null
  filterForm.value = { 
    key: '', 
    type: 'input', 
    label: '', 
    placeholder: '', 
    options: '',
    treeOptions: ''
  }
  filterDialogOpen.value = true
}

const openEditFilterDialog = (index: number) => {
  const config = configStore.page1Configs[selectedNavId.value!]
  if (config) {
    const filter = config.filterArea.filters[index]
    editingFilterIndex.value = index
    filterForm.value = {
      key: filter.key,
      type: filter.type,
      label: filter.label,
      placeholder: filter.placeholder || '',
      options: filter.options?.join(', ') || '',
      treeOptions: filter.treeOptions ? JSON.stringify(filter.treeOptions, null, 2) : ''
    }
    filterDialogOpen.value = true
  }
}

const closeFilterDialog = () => {
  filterDialogOpen.value = false
  editingFilterIndex.value = null
}

const handleSaveFilter = () => {
  if (selectedNavId.value && filterForm.value.key && filterForm.value.label) {
    const config = configStore.page1Configs[selectedNavId.value]
    if (config) {
      // 准备新的过滤器配置
      const newFilter: FilterConfig = {
        key: filterForm.value.key,
        type: filterForm.value.type,
        label: filterForm.value.label,
        placeholder: filterForm.value.placeholder || undefined
      }

      // 根据类型设置特定属性
      if (filterForm.value.type === 'select') {
        newFilter.defaultValue = '全部'
        newFilter.options = filterForm.value.options
          ? filterForm.value.options.split(/[，,]/).map(s => s.trim()).filter(s => s)
          : []
      } else if (filterForm.value.type === 'tree-select') {
        newFilter.defaultValue = ''
        try {
          newFilter.treeOptions = JSON.parse(filterForm.value.treeOptions || '[]')
        } catch (e) {
          alert('Tree Options JSON 格式错误')
          return
        }
      } else if (filterForm.value.type === 'date-range') {
        newFilter.defaultValue = undefined
      } else {
        newFilter.defaultValue = ''
      }
      
      if (editingFilterIndex.value !== null) {
        // 编辑模式
        config.filterArea.filters[editingFilterIndex.value] = newFilter
      } else {
        // 添加模式
        config.filterArea.filters.push(newFilter)
      }
    }
    closeFilterDialog()
  }
}

const handleDeleteFilter = (index: number) => {
  if (!selectedNavId.value) return
  showConfirm(
    '确定删除？',
    '确定要删除这个筛选项吗？',
    () => {
      const config = configStore.page1Configs[selectedNavId.value!]
      if (config) {
        config.filterArea.filters.splice(index, 1)
      }
    }
  )
}

// ============================================
// Column Config Actions
// ============================================

const openAddColumnDialog = () => {
  editingColumnIndex.value = null
  columnForm.value = { key: '', label: '', width: '100px', type: 'text' }
  columnDialogOpen.value = true
}

const openEditColumnDialog = (index: number) => {
  const config = configStore.page1Configs[selectedNavId.value!]
  if (config) {
    const col = config.tableArea.columns[index]
    editingColumnIndex.value = index
    columnForm.value = {
      key: col.key,
      label: col.label,
      width: col.width || '100px',
      type: col.type || 'text'
    }
    columnDialogOpen.value = true
  }
}

const closeColumnDialog = () => {
  columnDialogOpen.value = false
  editingColumnIndex.value = null
}

const handleSaveColumn = () => {
  if (selectedNavId.value && columnForm.value.key && columnForm.value.label) {
    const config = configStore.page1Configs[selectedNavId.value]
    if (config) {
      const newColumn: TableColumn = {
        key: columnForm.value.key,
        label: columnForm.value.label,
        width: columnForm.value.width || undefined,
        type: columnForm.value.type === 'text' ? undefined : columnForm.value.type
      }
      
      if (editingColumnIndex.value !== null) {
        // 编辑模式
        config.tableArea.columns[editingColumnIndex.value] = newColumn
      } else {
        // 添加模式
        config.tableArea.columns.push(newColumn)
      }
    }
    closeColumnDialog()
  }
}

const handleDeleteColumn = (index: number) => {
  if (!selectedNavId.value) return
  showConfirm(
    '确定删除？',
    '确定要删除这个列吗？',
    () => {
      const config = configStore.page1Configs[selectedNavId.value!]
      if (config) {
        config.tableArea.columns.splice(index, 1)
      }
    }
  )
}

// 配置编辑
const handleUpdateFilterArea = (key: 'columns' | 'gap', value: number | string) => {
  if (selectedNavId.value) {
    configStore.updateFilterAreaConfig(selectedNavId.value, { [key]: value })
  }
}

const handleUpdateTableArea = (key: string, value: any) => {
  if (selectedNavId.value) {
    configStore.updateTableAreaConfig(selectedNavId.value, { [key]: value })
  }
}

// ============================================
// 确认对话框辅助函数 (Issue 7: 替代 confirm())
// ============================================

const showConfirm = (title: string, description: string, action: () => void) => {
  confirmDialogTitle.value = title
  confirmDialogDescription.value = description
  pendingConfirmAction.value = action
  confirmDialogOpen.value = true
}

const handleConfirmAction = () => {
  if (pendingConfirmAction.value) {
    pendingConfirmAction.value()
  }
  confirmDialogOpen.value = false
  pendingConfirmAction.value = null
}

const handleCancelConfirm = () => {
  confirmDialogOpen.value = false
  pendingConfirmAction.value = null
}

// ============================================
// 拖拽排序功能 (Issue 9)
// ============================================

// 筛选项列表的本地副本用于拖拽
const filterList = computed({
  get: () => currentPageConfig.value?.filterArea.filters || [],
  set: (val) => {
    if (currentPageConfig.value) {
      currentPageConfig.value.filterArea.filters = val
    }
  }
})

// 列配置列表的本地副本用于拖拽
const columnList = computed({
  get: () => currentPageConfig.value?.tableArea.columns || [],
  set: (val) => {
    if (currentPageConfig.value) {
      currentPageConfig.value.tableArea.columns = val
    }
  }
})

// ============================================
// 保存配置功能 (Issue 10: 添加 toast 通知)
// ============================================

const isSaving = ref(false)
const handleSaveToSource = async () => {
  showConfirm(
    '确定写入源码？',
    '这将更新 src/config/page1.ts 和 src/config/sidebar.ts 文件。\nVite 会自动热更新。',
    async () => {
      isSaving.value = true
      try {
        const success = await configStore.saveToSourceFile()
        if (success) {
          toast.success('保存成功', {
            description: 'page1.ts 已更新，Vite 正在热更新...'
          })
        } else {
          toast.error('保存失败', {
            description: '请确认插件已配置且运行在开发环境。'
          })
        }
      } finally {
        isSaving.value = false
      }
    }
  )
}
</script>

<template>
  <div class="settings-root">
    <!-- Teleport 到面包屑操作区 -->
    <Teleport to="#breadcrumb-actions" defer>
      <div class="flex items-center gap-2">
        <Button 
          v-if="currentPageConfig"
          variant="destructive" 
          size="sm" 
          @click="handleDeletePageConfig"
          :disabled="isSaving"
        >
          <Trash2 class="w-4 h-4 mr-2" />
          重置页面
        </Button>
        <Button variant="default" size="sm" @click="handleSaveToSource" :disabled="isSaving">
          <Save class="w-4 h-4 mr-2" />
          <span v-if="isSaving">保存中...</span>
          <span v-else>写入源码</span>
        </Button>
      </div>
    </Teleport>
    
    <div class="h-full flex overflow-hidden">
      <!-- Left Sidebar: Navigation List -->
    <div class="w-72 border-r bg-muted/30 flex flex-col">
      <div class="p-4 border-b flex items-center justify-between">
        <h3 class="font-semibold flex items-center gap-2">
          <Layers class="w-4 h-4" />
          导航列表
        </h3>
        <span class="text-xs text-muted-foreground">点击配置页面</span>
      </div>
      <div class="flex-1 overflow-auto">
        <div class="p-2 space-y-1">
          <div
            v-for="item in allSubNavItems"
            :key="item.subItem.id"
            class="p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 border-l-2"
            :class="selectedNavId === item.subItem.id 
              ? 'bg-primary/10 border-l-primary' 
              : 'bg-transparent border-l-transparent hover:bg-muted'"
            @click="handleSelectNav(item.subItem.id)"
          >
            <Avatar class="h-9 w-9">
              <AvatarFallback 
                :class="selectedNavId === item.subItem.id ? 'bg-primary text-white' : 'bg-muted'"
                class="text-sm font-medium"
              >
                {{ item.subItem.title[0] }}
              </AvatarFallback>
            </Avatar>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm truncate">{{ item.subItem.title }}</div>
              <div class="text-xs text-muted-foreground truncate">ID: {{ item.subItem.id }}</div>
            </div>
            <Badge 
              v-if="item.subItem.template"
              variant="secondary"
              class="text-xs"
            >
              {{ item.subItem.template }}
            </Badge>
            <Badge 
              v-else
              variant="outline"
              class="text-xs text-muted-foreground"
            >
              无模板
            </Badge>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Content: Page Config Editor -->
    <div class="flex-1 flex flex-col overflow-hidden bg-background">
      <!-- 未选择导航时 -->
      <div v-if="!selectedNavId" class="h-full flex items-center justify-center">
        <div class="text-center text-muted-foreground">
          <Settings2 class="h-12 w-12 mx-auto opacity-30 mb-4" />
          <p>请从左侧选择一个导航项查看/编辑配置</p>
        </div>
      </div>

      <!-- 选中导航后 -->
      <div v-else class="flex flex-col h-full">
          <!-- 头部 -->
          <div class="p-4 border-b flex items-center justify-between">
            <div class="flex items-center gap-3">
              <FileCode class="w-5 h-5 text-muted-foreground" />
              <div>
                <h3 class="font-semibold">{{ selectedNavInfo?.subItem.title }}</h3>
                <span class="text-xs text-muted-foreground">导航 ID: {{ selectedNavId }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Button variant="outline" size="sm" @click="openEditNavDialog">
                <Pencil class="w-4 h-4 mr-1" />
                编辑导航
              </Button>
            </div>
          </div>

          <!-- 内容区 -->
          <div class="flex-1 overflow-auto p-6 space-y-6">
            <!-- 无配置时 -->
            <div v-if="!currentPageConfig" class="text-center py-12 border-2 border-dashed rounded-lg">
              <FileCode class="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p class="text-muted-foreground mb-4">该导航项还没有页面配置</p>
              <Button @click="handleCreatePageConfig">
                <Plus class="w-4 h-4 mr-1" />
                创建 Page1 配置
              </Button>
            </div>

            <!-- 有配置时 -->
            <template v-else>
              <!-- 筛选区配置 -->
              <div class="border rounded-lg">
                <div class="p-4 border-b flex items-center justify-between bg-muted/30">
                  <h4 class="font-semibold">筛选区配置</h4>
                  <Button variant="outline" size="sm" @click="openAddFilterDialog">
                    <Plus class="w-4 h-4 mr-1" />
                    添加筛选项
                  </Button>
                </div>
                <div class="p-4 space-y-4">
                  <!-- 布局配置 -->
                  <div class="flex items-center gap-6">
                    <div class="flex items-center gap-2">
                      <label class="text-sm text-muted-foreground">列数:</label>
                      <Input 
                        :model-value="currentPageConfig.filterArea.columns"
                        @update:model-value="handleUpdateFilterArea('columns', Number($event))"
                        type="number"
                        class="w-20 h-8"
                      />
                    </div>
                    <div class="flex items-center gap-2">
                      <label class="text-sm text-muted-foreground">间距:</label>
                      <Input 
                        :model-value="currentPageConfig.filterArea.gap"
                        @update:model-value="handleUpdateFilterArea('gap', $event)"
                        class="w-24 h-8"
                        placeholder="如 16px"
                      />
                    </div>
                  </div>
                  <!-- 筛选项列表 - Table (Issue 9: 支持拖拽排序) -->
                  <div class="border rounded-md" v-if="currentPageConfig.filterArea.filters.length > 0">
                    <table class="w-full">
                      <thead>
                        <tr class="border-b bg-muted/50">
                          <th class="w-8 p-2"></th>
                          <th class="text-left p-2 text-sm font-medium">类型</th>
                          <th class="text-left p-2 text-sm font-medium">标签</th>
                          <th class="text-left p-2 text-sm font-medium">字段名</th>
                          <th class="text-left p-2 text-sm font-medium">选项</th>
                          <th class="text-right p-2 text-sm font-medium w-20">操作</th>
                        </tr>
                      </thead>
                      <draggable 
                        v-model="filterList"
                        tag="tbody"
                        item-key="key"
                        handle=".drag-handle"
                        :animation="200"
                      >
                        <template #item="{ element: filter, index }">
                          <tr class="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td class="p-2">
                              <GripVertical class="w-4 h-4 text-muted-foreground cursor-grab drag-handle" />
                            </td>
                            <td class="p-2">
                              <Badge variant="outline" class="text-xs">{{ filter.type }}</Badge>
                            </td>
                            <td class="p-2 text-sm">{{ filter.label }}</td>
                            <td class="p-2">
                              <code class="text-xs text-muted-foreground">{{ filter.key }}</code>
                            </td>
                            <td class="p-2 text-xs text-muted-foreground">
                              <span v-if="filter.options">
                                {{ filter.options.length }} 个选项
                              </span>
                              <span v-else>-</span>
                            </td>
                            <td class="p-2">
                              <div class="flex gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  class="h-7 w-7 p-0"
                                  @click="openEditFilterDialog(index)"
                                >
                                  <Pencil class="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  class="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  @click="handleDeleteFilter(index)"
                                >
                                  <Trash2 class="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        </template>
                      </draggable>
                    </table>
                  </div>
                  <div v-if="currentPageConfig.filterArea.filters.length === 0" class="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-md">
                    暂无筛选项
                  </div>
                </div>
              </div>

              <!-- 表格区配置 -->
              <div class="border rounded-lg">
                <div class="p-4 border-b flex items-center justify-between bg-muted/30">
                  <h4 class="font-semibold">表格区配置</h4>
                  <Button variant="outline" size="sm" @click="openAddColumnDialog">
                    <Plus class="w-4 h-4 mr-1" />
                    添加列
                  </Button>
                </div>
                <div class="p-4 space-y-4">
                  <!-- 表格设置 -->
                  <div class="flex items-center gap-6 flex-wrap">
                    <div class="flex items-center gap-2">
                      <label class="text-sm text-muted-foreground">高度:</label>
                      <Input 
                        :model-value="currentPageConfig.tableArea.height"
                        @update:model-value="handleUpdateTableArea('height', $event)"
                        class="w-24 h-8"
                      />
                    </div>
                    <div class="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        :checked="currentPageConfig.tableArea.scrollX"
                        @change="handleUpdateTableArea('scrollX', ($event.target as HTMLInputElement).checked)"
                        class="rounded"
                      />
                      <label class="text-sm">横向滚动</label>
                    </div>
                    <div class="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        :checked="currentPageConfig.tableArea.scrollY"
                        @change="handleUpdateTableArea('scrollY', ($event.target as HTMLInputElement).checked)"
                        class="rounded"
                      />
                      <label class="text-sm">纵向滚动</label>
                    </div>
                    <div class="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        :checked="currentPageConfig.tableArea.showCheckbox"
                        @change="handleUpdateTableArea('showCheckbox', ($event.target as HTMLInputElement).checked)"
                        class="rounded"
                      />
                      <label class="text-sm">显示复选框</label>
                    </div>
                  </div>
                  <!-- 列配置列表 - Table (Issue 9: 支持拖拽排序) -->
                  <div class="border rounded-md" v-if="currentPageConfig.tableArea.columns.length > 0">
                    <table class="w-full">
                      <thead>
                        <tr class="border-b bg-muted/50">
                          <th class="w-8 p-2"></th>
                          <th class="text-left p-2 text-sm font-medium">类型</th>
                          <th class="text-left p-2 text-sm font-medium">标签</th>
                          <th class="text-left p-2 text-sm font-medium">字段名</th>
                          <th class="text-left p-2 text-sm font-medium">宽度</th>
                          <th class="text-right p-2 text-sm font-medium w-20">操作</th>
                        </tr>
                      </thead>
                      <draggable 
                        v-model="columnList"
                        tag="tbody"
                        item-key="key"
                        handle=".drag-handle"
                        :animation="200"
                      >
                        <template #item="{ element: col, index }">
                          <tr class="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td class="p-2">
                              <GripVertical class="w-4 h-4 text-muted-foreground cursor-grab drag-handle" />
                            </td>
                            <td class="p-2">
                              <Badge variant="outline" class="text-xs">{{ col.type || 'text' }}</Badge>
                            </td>
                            <td class="p-2 text-sm">{{ col.label }}</td>
                            <td class="p-2">
                              <code class="text-xs text-muted-foreground">{{ col.key }}</code>
                            </td>
                            <td class="p-2 text-xs text-muted-foreground">
                              {{ col.width || '-' }}
                            </td>
                            <td class="p-2">
                              <div class="flex gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  class="h-7 w-7 p-0"
                                  @click="openEditColumnDialog(index)"
                                >
                                  <Pencil class="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  class="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  @click="handleDeleteColumn(index)"
                                >
                                  <Trash2 class="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        </template>
                      </draggable>
                    </table>
                  </div>
                  <div v-if="currentPageConfig.tableArea.columns.length === 0" class="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-md">
                    暂无表格列
                  </div>
                </div>
              </div>

            </template>
          </div>
      </div>
      </div>
    </div>

    <!-- 编辑导航对话框 -->
  <Dialog v-model:open="editNavDialogOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>编辑导航</DialogTitle>
        <DialogDescription>修改导航项信息</DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">标题</label>
          <Input v-model="navForm.title" placeholder="输入导航标题" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">模板</label>
          <Select v-model="navForm.template">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="选择模板" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">无模板</SelectItem>
              <SelectItem value="Page1">Page1</SelectItem>
              <SelectItem value="Page2">Page2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <!-- Issue 4 & 5: 提示信息 -->
        <div class="flex items-start gap-2 p-3 rounded-md bg-muted/50 text-sm text-muted-foreground">
          <Info class="w-4 h-4 mt-0.5 shrink-0" />
          <p>修改将在点击顶部“写入源码”时同步保存到 sidebar.ts 文件。</p>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="closeEditNavDialog">取消</Button>
        <Button @click="handleEditNav">保存</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- 添加/编辑筛选项对话框 -->
  <Dialog v-model:open="filterDialogOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ editingFilterIndex !== null ? '编辑筛选项' : '添加筛选项' }}</DialogTitle>
        <DialogDescription>配置筛选项信息</DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">字段名 (key)</label>
            <Input v-model="filterForm.key" placeholder="如 userId" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">标签</label>
            <Input v-model="filterForm.label" placeholder="如 用户ID" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">类型</label>
            <Select v-model="filterForm.type">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="input">输入框</SelectItem>
                <SelectItem value="select">下拉框</SelectItem>
                <SelectItem value="tree-select">树形下拉框</SelectItem>
                <SelectItem value="date-range">日期范围</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">占位符</label>
            <Input v-model="filterForm.placeholder" placeholder="如 请输入用户ID" />
          </div>
        </div>
        <!-- 下拉框选项 -->
        <div v-if="filterForm.type === 'select'" class="space-y-2">
          <label class="text-sm font-medium">下拉选项 (逗号分隔)</label>
          <Input v-model="filterForm.options" placeholder="全部, 选项1, 选项2, 选项3" />
          <p class="text-xs text-muted-foreground">多个选项之间用逗号分隔</p>
        </div>
        <!-- 树形选项配置 -->
        <div v-if="filterForm.type === 'tree-select'" class="space-y-2">
          <label class="text-sm font-medium">树形选项配置 (JSON)</label>
          <textarea 
            v-model="filterForm.treeOptions"
            class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder='[{"value":"1","label":"节点1","children":[]}]'
          ></textarea>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="closeFilterDialog">取消</Button>
        <Button @click="handleSaveFilter">{{ editingFilterIndex !== null ? '保存' : '添加' }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- 添加列对话框 -->
  <Dialog v-model:open="columnDialogOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ editingColumnIndex !== null ? '编辑表格列' : '添加表格列' }}</DialogTitle>
        <DialogDescription>{{ editingColumnIndex !== null ? '修改表格列配置' : '为表格区添加新的列' }}</DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">字段名 (key)</label>
            <Input v-model="columnForm.key" placeholder="如 orderNo" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">表头标题</label>
            <Input v-model="columnForm.label" placeholder="如 订单号" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">列宽</label>
            <Input v-model="columnForm.width" placeholder="如 100px" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">类型</label>
            <Select v-model="columnForm.type">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">文本</SelectItem>
                <SelectItem value="badge">Badge</SelectItem>
                <SelectItem value="status-badge">状态 Badge</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="closeColumnDialog">取消</Button>
        <Button @click="handleSaveColumn">{{ editingColumnIndex !== null ? '保存' : '添加' }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>


  <!-- Issue 7: 确认对话框 (替代 confirm()) -->
  <AlertDialog v-model:open="confirmDialogOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ confirmDialogTitle }}</AlertDialogTitle>
        <AlertDialogDescription class="whitespace-pre-line">
          {{ confirmDialogDescription }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="handleCancelConfirm">取消</AlertDialogCancel>
        <AlertDialogAction @click="handleConfirmAction">确定</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  </div>
</template>

<style scoped>
.settings-root {
  height: 100%;
  display: contents;
}
</style>
