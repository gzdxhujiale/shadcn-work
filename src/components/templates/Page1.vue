<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FilterInput, FilterSelect, FilterDateRange, FilterTreeSelect, FilterCard } from '@/components/ui/filter'
import { useNavigation } from '@/config/sidebar'
import { useConfigStore, type Page1Config } from '@/stores/configStore'

// --- 获取导航状态 ---
const { currentNavId } = useNavigation()

// --- 使用 Pinia store ---
const configStore = useConfigStore()

// --- 获取当前页面配置 ---
const pageConfig = computed<Page1Config | undefined>(() => {
  const config = configStore.getPage1Config(currentNavId.value)
  console.log('Page1: Resolving config for ID:', currentNavId.value, 'Found:', !!config)
  return config
})

// --- 响应式数据 ---
const tableData = ref<any[]>([])

// 选中的行
const selectedRows = ref<number[]>([])

// 分页
const currentPage = ref(1)
const pageSize = computed(() => pageConfig.value?.tableArea.pageSize || 15)

// 顶部栏状态
const currentApp = ref(pageConfig.value?.topBar?.appOptions?.[0] ?? '')
const currentLang = ref(pageConfig.value?.topBar?.langOptions?.[0] ?? '')

// 从配置自动生成筛选状态
const filters = reactive<Record<string, any>>({})

// 根据 mockFormat 生成虚拟数据
function generateMockValue(format: string | undefined, label: string, index: number): string | number {
  switch (format) {
    case 'text':
      // 文本格式：标签名 + 数字
      return `${label}${index + 1}`
    case 'datetime':
      // 时间格式：随机日期时间
      const now = new Date()
      const randomDays = Math.floor(Math.random() * 30)
      const randomHours = Math.floor(Math.random() * 24)
      const randomMinutes = Math.floor(Math.random() * 60)
      const randomSeconds = Math.floor(Math.random() * 60)
      const date = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()
      const h = String(randomHours).padStart(2, '0')
      const m = String(randomMinutes).padStart(2, '0')
      const s = String(randomSeconds).padStart(2, '0')
      return `${year}-${month}-${day} ${h}:${m}:${s}`
    case 'number':
      // 数字格式：随机5位数
      return Math.floor(10000 + Math.random() * 90000)
    default:
      // 默认返回空或占位值
      return `${label}${index + 1}`
  }
}

// 根据配置生成模拟数据
function generateMockData(): any[] {
  if (!pageConfig.value) return []
  
  const columns = pageConfig.value.tableArea.columns
  const rowCount = 20 // 生成20行数据
  const data: any[] = []
  
  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, any> = { id: i + 1 }
    
    columns.forEach(col => {
      if (col.mockFormat) {
        row[col.key] = generateMockValue(col.mockFormat, col.label, i)
      } else {
        // 如果没有指定格式，使用默认值
        row[col.key] = `${col.label}${i + 1}`
      }
    })
    
    data.push(row)
  }
  
  return data
}

// 加载数据函数
function loadData() {
  if (pageConfig.value?.mockData) {
    const mockData = pageConfig.value.mockData()
    // 如果 mockData 返回空数组，尝试根据列配置生成数据
    if (mockData.length === 0) {
      tableData.value = generateMockData()
    } else {
      tableData.value = mockData
    }
  } else {
    // 没有 mockData 函数，根据列配置生成
    tableData.value = generateMockData()
  }
  currentPage.value = 1
  selectedRows.value = []
}

// 监听导航变化，重新加载数据
watch(currentNavId, () => {
  loadData()
}, { immediate: true })

// 监听配置变化，重置筛选状态
watch(pageConfig, (config) => {
  if (config) {
    // 清空旧状态
    Object.keys(filters).forEach(key => delete filters[key])
    // 设置新状态
    config.filterArea.filters.forEach(filter => {
      filters[filter.key] = filter.defaultValue
    })
  }
}, { immediate: true })

// --- 计算属性 ---
const filteredData = computed(() => {
  return tableData.value
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})
const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSize.value) || 1)

// 可见的筛选项
const visibleFilters = computed(() => {
  return pageConfig.value?.filterArea.filters.filter(f => f.visible !== false) || []
})

// 可见的列
const visibleColumns = computed(() => {
  return pageConfig.value?.tableArea.columns.filter(c => c.visible !== false) || []
})

// 可见的操作按钮
const visibleActions = computed(() => {
  return pageConfig.value?.actionsArea?.buttons?.filter((a: { visible?: boolean }) => a.visible !== false) || []
})

// 全选状态
const isAllSelected = computed(() => {
  return paginatedData.value.length > 0 && paginatedData.value.every((item) => selectedRows.value.includes(item.id))
})

// --- 方法 ---
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedRows.value = selectedRows.value.filter((id) => !paginatedData.value.some((item) => item.id === id))
  } else {
    const currentIds = paginatedData.value.map((item) => item.id)
    selectedRows.value = [...new Set([...selectedRows.value, ...currentIds])]
  }
}

const toggleRowSelection = (id: number) => {
  const index = selectedRows.value.indexOf(id)
  if (index > -1) {
    selectedRows.value.splice(index, 1)
  } else {
    selectedRows.value.push(id)
  }
}

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    reviewing: 'bg-blue-100 text-blue-700 border-blue-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    paid: 'bg-green-100 text-green-700 border-green-200',
    failed: 'bg-rose-100 text-rose-700 border-rose-200',
  }
  return map[status] || ''
}
</script>

<template>
  <div v-if="pageConfig" class="h-full flex flex-col">
    <!-- 顶部操作栏 Teleport -->
    <Teleport to="#breadcrumb-actions" defer>
      <div class="flex items-center gap-4">
        <!-- topBar 选择器（如果配置了的话） -->
        <template v-if="pageConfig.topBar">
          <!-- App 选择 -->
          <Select v-if="pageConfig.topBar.appOptions" v-model="currentApp">
            <SelectTrigger class="w-[120px] h-8 text-xs">
              <SelectValue placeholder="选择应用" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="app in pageConfig.topBar.appOptions" :key="app" :value="app">
                {{ app }}
              </SelectItem>
            </SelectContent>
          </Select>

          <!-- 语言选择 -->
          <Select v-if="pageConfig.topBar.langOptions" v-model="currentLang">
            <SelectTrigger class="w-[100px] h-8 text-xs">
              <SelectValue placeholder="选择语言" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="lang in pageConfig.topBar.langOptions" :key="lang" :value="lang">
                {{ lang }}
              </SelectItem>
            </SelectContent>
          </Select>
        </template>

        <!-- 功能按钮 (始终显示的全局按钮) -->
        <div class="flex items-center gap-2">
           <Button variant="ghost" size="sm" class="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 font-normal">
             更新记录
           </Button>
           <div class="w-px h-4 bg-border"></div>
           <Button variant="ghost" size="sm" class="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 font-normal">
             权限申请
           </Button>
        </div>
      </div>
    </Teleport>

    <!-- 主体内容 -->
    <div class="flex-1 flex flex-col p-6 gap-4 overflow-hidden">
      
      <!-- 功能区 - 筛选条件 + 操作按钮 -->
      <div v-if="pageConfig.filterArea?.show !== false || pageConfig.actionsArea?.show !== false" class="bg-background rounded-xl border shadow-sm">
        <div class="p-5">
          <!-- 动态筛选表单区 -->
          <div 
            v-if="pageConfig.filterArea?.show !== false"
            class="grid mb-4"
            :style="{
              gridTemplateColumns: `repeat(${pageConfig.filterArea.columns}, 1fr)`,
              gap: pageConfig.filterArea.gap,
            }"
          >
            <template v-for="config in visibleFilters" :key="config.key">
              <!-- 输入框类型 -->
              <FilterInput
                v-if="config.type === 'input'"
                :label="config.label"
                v-model="filters[config.key]"
                :placeholder="config.placeholder"
              />
              
              <!-- 下拉框类型 -->
              <FilterSelect
                v-else-if="config.type === 'select'"
                :label="config.label"
                v-model="filters[config.key]"
                :options="config.options ?? []"
              />

              <!-- 日期范围选择类型 -->
              <FilterDateRange
                v-else-if="config.type === 'date-range'"
                :label="config.label"
                v-model="filters[config.key]"
              />

              <!-- 树形下拉框类型 -->
              <FilterTreeSelect
                v-else-if="config.type === 'tree-select'"
                :label="config.label"
                v-model="filters[config.key]"
                :options="config.treeOptions ?? []"
                :placeholder="config.placeholder"
              />
            </template>
          </div>

          <!-- 底部操作按钮 -->
          <div v-if="pageConfig.actionsArea?.show !== false" class="flex items-center justify-between pt-2 border-t">
            <div class="text-xs text-muted-foreground">
              已选择 <span class="font-semibold text-foreground">{{ selectedRows.length }}</span> 条记录
            </div>
            
            <div class="flex items-center gap-3">
              <template v-for="(action, index) in visibleActions" :key="action.key">
                <!-- 分隔符（在第2个按钮后添加） -->
                <div v-if="index === 2" class="w-px h-6 bg-border mx-1"></div>
                <Button 
                  :variant="action.variant ?? 'default'"
                  class="h-9 px-5"
                  :class="action.className"
                >
                  {{ action.label }}
                </Button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 卡片区 -->
      <div 
        v-if="pageConfig.cardArea?.show"
        class="grid"
        :style="{
          gridTemplateColumns: `repeat(${pageConfig.cardArea.columns}, 1fr)`,
          gap: pageConfig.cardArea.gap,
        }"
      >
        <FilterCard
          v-for="card in pageConfig.cardArea.cards"
          :key="card.key"
          :title="card.title"
          :data="card.data"
          :height="pageConfig.cardArea.cardHeight"
          :width="pageConfig.cardArea.cardWidth"
        />
      </div>

      <!-- 列表区 -->
      <div v-if="pageConfig.tableArea?.show !== false" class="flex-1 bg-background rounded-xl border shadow-sm overflow-hidden flex flex-col">
        <div 
          class="flex-1"
          :class="{
            'overflow-x-auto': pageConfig.tableArea.scrollX,
            'overflow-y-auto': pageConfig.tableArea.scrollY,
            'overflow-x-hidden': !pageConfig.tableArea.scrollX,
            'overflow-y-hidden': !pageConfig.tableArea.scrollY,
          }"
          :style="{ maxHeight: pageConfig.tableArea.height }"
        >
          <Table :class="{ 'table-fixed': pageConfig.tableArea.fixedLayout }" class="w-full">
            <TableHeader class="sticky top-0 bg-muted/50 z-10">
              <TableRow class="text-xs hover:bg-transparent">
                <!-- 复选框列 -->
                <TableHead 
                  v-if="pageConfig.tableArea.showCheckbox"
                  class="h-11 border-r bg-muted/50"
                  :style="{ width: '30px' }"
                >
                  <Checkbox 
                    :model-value="isAllSelected"
                    @update:model-value="toggleSelectAll"
                  />
                </TableHead>
                <!-- 数据列 -->
                <TableHead 
                  v-for="col in visibleColumns" 
                  :key="col.key"
                  class="h-11 font-semibold border-r last:border-r-0"
                  :class="{
                    'sticky z-20 bg-muted/50': col.fixed,
                    'left-0': col.fixed === 'left' && !pageConfig.tableArea.showCheckbox,
                    'left-[50px]': col.fixed === 'left' && pageConfig.tableArea.showCheckbox,
                    'right-0': col.fixed === 'right',
                  }"
                  :style="{ 
                    width: col.width, 
                    minWidth: col.minWidth 
                  }"
                >
                  {{ col.label }}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow 
                v-for="item in paginatedData" 
                :key="item.id" 
                class="hover:bg-muted/30 cursor-pointer transition-colors"
                :class="{ 'bg-primary/5': selectedRows.includes(item.id) }"
                @click="toggleRowSelection(item.id)"
              >
                <!-- 复选框列 -->
                <TableCell 
                  v-if="pageConfig.tableArea.showCheckbox"
                  class="py-3 border-r bg-background"
                  :style="{ width: '50px' }"
                  @click.stop
                >
                  <Checkbox 
                    :model-value="selectedRows.includes(item.id)"
                    @update:model-value="toggleRowSelection(item.id)"
                  />
                </TableCell>
                <!-- 数据列 -->
                <TableCell 
                  v-for="col in visibleColumns" 
                  :key="col.key"
                  class="py-3 border-r last:border-r-0"
                  :class="{
                    'sticky z-10 bg-background': col.fixed,
                    'left-0': col.fixed === 'left' && !pageConfig.tableArea.showCheckbox,
                    'left-[50px]': col.fixed === 'left' && pageConfig.tableArea.showCheckbox,
                    'right-0': col.fixed === 'right',
                  }"
                  :style="{ width: col.width }"
                >
                  <!-- Badge 类型 (应用) -->
                  <Badge v-if="col.type === 'badge'" variant="outline" class="font-medium">
                    {{ item[col.key] }}
                  </Badge>
                  <!-- 状态 Badge 类型 -->
                  <Badge 
                    v-else-if="col.type === 'status-badge'" 
                    variant="outline" 
                    :class="getStatusClass(item.orderStatus)"
                    class="text-xs font-medium"
                  >
                    {{ item[col.key] }}
                  </Badge>
                  <!-- 文字按钮类型 -->
                  <Button
                    v-else-if="col.type === 'text-button'"
                    variant="link"
                    size="sm"
                    class="h-auto p-0 text-blue-600 hover:text-blue-700"
                    @click.stop="console.log('Clicked:', item[col.key])"
                  >
                    {{ item[col.key] }}
                  </Button>
                  <!-- 普通文本类型 -->
                  <span v-else class="text-sm">{{ item[col.key] }}</span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- 分页 -->
        <div class="flex justify-between items-center px-4 py-3 border-t bg-muted/20">
          <div class="text-xs text-muted-foreground">
            显示 {{ ((currentPage - 1) * pageSize) + 1 }} - {{ Math.min(currentPage * pageSize, filteredData.length) }} 共 {{ filteredData.length }} 条
          </div>
          <div class="flex gap-2 items-center">
            <div class="text-xs text-muted-foreground mr-2">
              第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
            </div>
            <Button
              variant="outline"
              size="sm"
              class="h-7 text-xs px-3"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="h-7 text-xs px-3"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              下一页
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 无配置时显示占位 -->
  <div v-else class="flex flex-col items-center justify-center h-full text-muted-foreground">
      <p class="text-lg font-medium">配置未找到</p>
      <p class="text-sm">Config ID: {{ currentNavId }}</p>
      <p class="text-xs text-muted-foreground mt-2">请检查配置导入日志</p>
  </div>
</template>
