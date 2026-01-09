<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { Search, RotateCw, ChevronRight, Check, ChevronDown } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// --- 类型定义 ---
interface TodoItem {
  id: number
  period: string
  client: string
  platform: string
  shop: string
  status: string
  statusText: string
  deadline: number | null
  deadlineText: string
}

// --- 数据常量 ---
const CLIENT_OPTIONS: string[] = ['客户A', '客户B', '客户C']
const PLATFORM_OPTIONS: string[] = ['抖音', '快手', '淘宝']
const PERIOD_OPTIONS: string[] = ['2025.10', '2025.11', '2025.12']

// --- 生成模拟数据 ---
const generateTodoData = (): TodoItem[] => {
  const data: TodoItem[] = []
  let id = 1
  
  const shops = ['客户A抖音1号店', '客户A快手2号店', '客户B淘宝1号店', '客户C抖音3号店']
  const statusConfig = [
    { status: 'pending', statusText: '待上传' },
    { status: 'uploaded', statusText: '已上传' },
    { status: 'verified', statusText: '已校验' },
    { status: 'loaded', statusText: '已加载' }
  ]

  PERIOD_OPTIONS.forEach((period: string) => {
    shops.forEach((shop: string) => {
      const client = CLIENT_OPTIONS.find((c: string) => shop.includes(c)) || '客户A'
      const platform = PLATFORM_OPTIONS.find((p: string) => shop.includes(p)) || '抖音'
      const statusObj = statusConfig[Math.floor(Math.random() * 4)]
      const deadline = statusObj.status === 'pending' ? Math.floor(Math.random() * 20) + 1 : null
      
      data.push({
        id: id++,
        period,
        client,
        platform,
        shop,
        status: statusObj.status,
        statusText: statusObj.statusText,
        deadline,
        deadlineText: deadline ? `剩 ${deadline} 天` : '-'
      })
    })
  })
  
  return data
}

// --- 响应式数据 ---
const todoData = ref<TodoItem[]>(generateTodoData())

const filters = reactive({
  period: [...PERIOD_OPTIONS],
  client: [...CLIENT_OPTIONS],
  platform: [...PLATFORM_OPTIONS],
  search: ''
})

// --- 计算属性 ---
const filteredData = computed(() => {
  return todoData.value.filter((i: TodoItem) =>
    filters.period.includes(i.period) &&
    filters.client.includes(i.client) &&
    filters.platform.includes(i.platform) &&
    (!filters.search || i.shop.toLowerCase().includes(filters.search.toLowerCase()))
  )
})

const stats = computed(() => ({
  total: filteredData.value.length,
  pending: filteredData.value.filter((i: TodoItem) => i.status === 'pending').length,
  done: filteredData.value.filter((i: TodoItem) => ['uploaded', 'verified', 'loaded'].includes(i.status)).length
}))

// 分页
const currentPage = ref(1)
const pageSize = 10
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredData.value.slice(start, start + pageSize)
})
const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSize) || 1)

// --- 方法 ---
const resetFilters = () => {
  filters.period = [...PERIOD_OPTIONS]
  filters.client = [...CLIENT_OPTIONS]
  filters.platform = [...PLATFORM_OPTIONS]
  filters.search = ''
}

const getPlatformColor = (platform: string) => {
  const map: Record<string, string> = { '淘宝': 'orange', '抖音': 'default', '快手': 'destructive' }
  return map[platform] || 'secondary'
}

const getStatusVariant = (status: string) => {
  if (status === 'pending') return 'destructive'
  if (status === 'uploaded') return 'default'
  if (status === 'verified') return 'secondary'
  return 'outline'
}

const getFilterLabel = (key: keyof typeof filters, allOptions: string[]) => {
  const selected = filters[key] as string[]
  if (selected.length === 0) return '未选择'
  if (selected.length === allOptions.length) return '全部'
  if (selected.length === 1) return selected[0]
  return `已选 ${selected.length} 項`
}

const toggleAll = (key: 'period' | 'client' | 'platform', allOptions: string[]) => {
  if ((filters[key] as string[]).length === allOptions.length) {
    (filters[key] as string[]) = []
  } else {
    (filters[key] as string[]) = [...allOptions]
  }
}

const toggleOption = (key: 'period' | 'client' | 'platform', option: string, isChecked: boolean) => {
  const arr = filters[key] as string[]
  if (isChecked) {
    if (!arr.includes(option)) {
      arr.push(option)
    }
  } else {
    const idx = arr.indexOf(option)
    if (idx > -1) arr.splice(idx, 1)
  }
}
</script>

<template>
  <div class="h-full">
    <!-- 统计数据 Teleport -->
    <Teleport to="#breadcrumb-actions" defer>
      <div class="flex items-center gap-2">
        <div class="text-center">
          <div class="text-[10px] text-muted-foreground uppercase">总任务</div>
          <div class="text-sm font-bold leading-none">{{ stats.total }}</div>
        </div>
        <div class="w-px h-6 bg-border"></div>
        <div class="text-center">
          <div class="text-[10px] text-muted-foreground uppercase">待上传</div>
          <div class="text-sm font-bold text-amber-600 leading-none">{{ stats.pending }}</div>
        </div>
        <div class="w-px h-6 bg-border"></div>
        <div class="text-center">
          <div class="text-[10px] text-muted-foreground uppercase">已完成</div>
          <div class="text-sm font-bold text-emerald-600 leading-none">{{ stats.done }}</div>
        </div>
      </div>
    </Teleport>

    <!-- 主体内容 -->
    <div class="p-6 h-full">
      <div class="bg-background rounded-lg border p-6 h-full flex flex-col">
        <!-- 工具栏 -->
        <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div class="flex items-center gap-3">
            <span class="font-semibold text-lg">当月任务清单</span>
            <Badge variant="outline" class="font-normal text-xs uppercase tracking-wider">DEC 2025</Badge>
          </div>
          
          <div class="flex items-center gap-3 flex-wrap">
            <!-- 筛选器组 -->
            <div class="flex items-center gap-3">
              <!-- 账期 -->
              <div class="flex items-center border rounded-md overflow-hidden h-8 shadow-sm">
                <div class="px-3 py-1.5 bg-muted/40 border-r text-xs font-medium text-muted-foreground whitespace-nowrap">
                  账期
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger class="h-full px-3 text-xs w-[110px] bg-background hover:bg-muted/20 flex justify-between items-center transition-colors focus:outline-none">
                    <span class="truncate">{{ getFilterLabel('period', PERIOD_OPTIONS) }}</span>
                    <ChevronDown class="w-3 h-3 opacity-50" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" class="w-48">
                    <div class="px-2 py-1.5 text-xs cursor-pointer hover:bg-muted rounded flex items-center select-none" @click.prevent="toggleAll('period', PERIOD_OPTIONS)">
                      <div class="flex items-center justify-center w-4 h-4 mr-2 border rounded" :class="filters.period.length === PERIOD_OPTIONS.length ? 'bg-primary border-primary text-primary-foreground' : 'border-input'">
                        <Check v-if="filters.period.length === PERIOD_OPTIONS.length" class="w-3 h-3" />
                      </div>
                      <span>全选</span>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem 
                      v-for="p in PERIOD_OPTIONS" 
                      :key="p" 
                      :model-value="filters.period.includes(p)"
                      @update:model-value="(checked) => toggleOption('period', p, checked as boolean)"
                      @select.prevent
                      class="text-xs"
                    >
                      {{ p }}
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <!-- 客户 -->
              <div class="flex items-center border rounded-md overflow-hidden h-8 shadow-sm">
                <div class="px-3 py-1.5 bg-muted/40 border-r text-xs font-medium text-muted-foreground whitespace-nowrap">
                  客户
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger class="h-full px-3 text-xs w-[100px] bg-background hover:bg-muted/20 flex justify-between items-center transition-colors focus:outline-none">
                    <span class="truncate">{{ getFilterLabel('client', CLIENT_OPTIONS) }}</span>
                    <ChevronDown class="w-3 h-3 opacity-50" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" class="w-48">
                    <div class="px-2 py-1.5 text-xs cursor-pointer hover:bg-muted rounded flex items-center select-none" @click.prevent="toggleAll('client', CLIENT_OPTIONS)">
                      <div class="flex items-center justify-center w-4 h-4 mr-2 border rounded" :class="filters.client.length === CLIENT_OPTIONS.length ? 'bg-primary border-primary text-primary-foreground' : 'border-input'">
                        <Check v-if="filters.client.length === CLIENT_OPTIONS.length" class="w-3 h-3" />
                      </div>
                      <span>全选</span>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem 
                      v-for="c in CLIENT_OPTIONS" 
                      :key="c" 
                      :model-value="filters.client.includes(c)"
                      @update:model-value="(checked) => toggleOption('client', c, checked as boolean)"
                      @select.prevent
                      class="text-xs"
                    >
                      {{ c }}
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <!-- 平台 -->
              <div class="flex items-center border rounded-md overflow-hidden h-8 shadow-sm">
                <div class="px-3 py-1.5 bg-muted/40 border-r text-xs font-medium text-muted-foreground whitespace-nowrap">
                  平台
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger class="h-full px-3 text-xs w-[100px] bg-background hover:bg-muted/20 flex justify-between items-center transition-colors focus:outline-none">
                    <span class="truncate">{{ getFilterLabel('platform', PLATFORM_OPTIONS) }}</span>
                    <ChevronDown class="w-3 h-3 opacity-50" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" class="w-48">
                    <div class="px-2 py-1.5 text-xs cursor-pointer hover:bg-muted rounded flex items-center select-none" @click.prevent="toggleAll('platform', PLATFORM_OPTIONS)">
                      <div class="flex items-center justify-center w-4 h-4 mr-2 border rounded" :class="filters.platform.length === PLATFORM_OPTIONS.length ? 'bg-primary border-primary text-primary-foreground' : 'border-input'">
                        <Check v-if="filters.platform.length === PLATFORM_OPTIONS.length" class="w-3 h-3" />
                      </div>
                      <span>全选</span>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem 
                      v-for="p in PLATFORM_OPTIONS" 
                      :key="p" 
                      :model-value="filters.platform.includes(p)"
                      @update:model-value="(checked) => toggleOption('platform', p, checked as boolean)"
                      @select.prevent
                      class="text-xs"
                    >
                      {{ p }}
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div class="w-px h-6 bg-border mx-1"></div>

            <!-- 搜索与重置 -->
            <div class="relative">
              <Search class="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" :size="14" />
              <Input
                v-model="filters.search"
                placeholder="搜索店铺..."
                class="pl-9 w-48 h-8 text-xs rounded-md bg-background border shadow-sm focus-visible:ring-1"
              />
            </div>
            
            <Button variant="outline" size="sm" class="h-8 w-8 p-0" @click="resetFilters">
              <RotateCw :size="14" />
            </Button>
          </div>
        </div>
        
        <!-- 表格 -->
        <div class="border rounded-lg overflow-hidden flex-1 relative">
          <div class="absolute inset-0 overflow-auto">
            <Table>
              <TableHeader class="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow class="bg-muted/40 text-xs">
                  <TableHead class="w-[100px] h-9">账期</TableHead>
                  <TableHead class="w-[100px] h-9">客户</TableHead>
                  <TableHead class="w-[120px] h-9">平台</TableHead>
                  <TableHead class="h-9">店铺名称</TableHead>
                  <TableHead class="w-[120px] h-9">状态</TableHead>
                  <TableHead class="w-[120px] h-9">剩余时间</TableHead>
                  <TableHead class="w-[80px] h-9 text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="item in paginatedData" :key="item.id" class="hover:bg-muted/30 h-10 border-b">
                  <TableCell class="font-medium text-xs font-mono">{{ item.period }}</TableCell>
                  <TableCell class="text-xs">{{ item.client }}</TableCell>
                  <TableCell>
                    <Badge :variant="getPlatformColor(item.platform) as any" class="text-[10px] px-1.5 py-0 h-5">
                      {{ item.platform }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-xs">{{ item.shop }}</TableCell>
                  <TableCell>
                    <Badge :variant="getStatusVariant(item.status) as any" class="text-[10px] px-1.5 py-0 h-5 font-normal">
                      {{ item.statusText }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      v-if="item.status === 'pending'"
                      class="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      :class="(item.deadline ?? 0) <= 3 ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'"
                    >
                      {{ item.deadlineText }}
                    </span>
                    <span v-else class="text-xs text-muted-foreground">-</span>
                  </TableCell>
                  <TableCell class="text-center">
                    <Button variant="ghost" size="icon" class="h-6 w-6">
                      <ChevronRight :size="14" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <!-- 分页 -->
        <div class="flex justify-between items-center mt-3 pt-2">
          <div class="text-xs text-muted-foreground">
            显示 {{ ((currentPage - 1) * pageSize) + 1 }} - {{ Math.min(currentPage * pageSize, filteredData.length) }} 共 {{ filteredData.length }} 条
          </div>
          <div class="flex gap-2 items-center">
            <div class="text-xs text-muted-foreground mr-2">第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</div>
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
</template>
