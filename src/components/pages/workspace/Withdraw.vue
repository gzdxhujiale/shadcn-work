<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { RangeCalendar } from '@/components/ui/range-calendar'
import { DateFormatter, getLocalTimeZone } from '@internationalized/date'
import type { DateRange } from 'radix-vue'

// --- 类型定义 ---
interface WithdrawItem {
  id: number
  app: string
  orderNo: string
  orderStatus: string
  statusText: string
  userId: string
  userName: string
  userPhone: string
  guildId: string
  guildName: string
  deviceId: string
  deviceModel: string
  deviceOS: string
  amount: number
  createTime: string
}

interface FilterConfig {
  key: string
  type: 'input' | 'select' | 'date-range'
  label: string
  placeholder?: string
  options?: string[]
  defaultValue?: string | DateRange | undefined
}

// 表格配置接口
interface TableConfig {
  height?: string         // 表格容器高度
  scrollX?: boolean       // 是否启用横向滚动
  scrollY?: boolean       // 是否启用纵向滚动
  showCheckbox?: boolean  // 是否显示复选框列
  fixedLayout?: boolean   // 是否使用固定布局（精确控制列宽）
}

// 表格列配置接口
interface TableColumn {
  key: keyof WithdrawItem
  label: string
  width?: string                    // 列宽，如 '100px'
  minWidth?: string                 // 最小宽度
  type?: 'text' | 'badge' | 'status-badge'
  fixed?: 'left' | 'right'          // 列固定位置
}

// --- 公共选项常量（用于顶部栏和复用） ---
const APP_OPTIONS = ['SoulChill', 'TikTok', 'Bigo Live', 'Likee']
const LANG_OPTIONS = ['中文', 'English', 'Español', 'العربية']
const YES_NO_OPTIONS = ['全部', '是', '否']  // 可复用的是/否选项

// --- 生成模拟数据 ---
const generateWithdrawData = (): WithdrawItem[] => {
  const data: WithdrawItem[] = []
  const apps = ['SoulChill', 'TikTok', 'Bigo Live', 'Likee']
  const statuses = ['pending', 'reviewing', 'approved', 'rejected', 'paid', 'failed']

  for (let i = 1; i <= 50; i++) {
    const app = apps[Math.floor(Math.random() * apps.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]

    data.push({
      id: i,
      app,
      orderNo: `订单号${i}`,
      orderStatus: status,
      statusText: `订单状态${i}`,
      userId: `用户ID${i}`,
      userName: `用户名称${i}`,
      userPhone: `用户手机${i}`,
      guildId: `公会ID${i}`,
      guildName: `公会名称${i}`,
      deviceId: `设备ID${i}`,
      deviceModel: `设备型号${i}`,
      deviceOS: `系统版本${i}`,
      amount: Math.floor(Math.random() * 50000) + 100,
      createTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN'),
    })
  }
  return data
}

// --- 响应式数据 ---
const withdrawData = ref<WithdrawItem[]>(generateWithdrawData())

// 全局状态
const currentApp = ref('SoulChill')
const currentLang = ref('中文')

// ============================================
// 筛选配置（融合：配置 + 选项 + 默认值）
// ============================================
const filterConfigs: FilterConfig[] = [
  // 输入框类型
  { key: 'userId', type: 'input', label: '用户ID', placeholder: '请输入用户ID', defaultValue: '' },
  { key: 'platformOrderNo', type: 'input', label: '平台订单号', placeholder: '请输入平台订单号', defaultValue: '' },
  { key: 'businessNo', type: 'input', label: '业务单号', placeholder: '请输入业务单号', defaultValue: '' },
  { key: 'channelNo', type: 'input', label: '渠道单号', placeholder: '请输入渠道单号', defaultValue: '' },
  
  // 下拉框类型（选项内聚）
  { key: 'orderStatus', type: 'select', label: '订单状态', defaultValue: '全部',
    options: ['全部', '待审核', '审核中', '已通过', '已拒绝', '已打款', '打款失败'] },
  { key: 'platformOrder', type: 'select', label: '平台订单号', defaultValue: '全部',
    options: ['全部', 'PO001', 'PO002', 'PO003'] },
  { key: 'accountType', type: 'select', label: '账户类型', defaultValue: '全部',
    options: ['全部', '支付宝', '微信', '银行卡', 'PayPal', 'Payoneer'] },
  { key: 'country', type: 'select', label: '国家', defaultValue: '全部',
    options: ['全部', '中国', '埃及', '摩洛哥', '土耳其', '阿尔及利亚', '约旦', '泰国', '沙特', '阿联酋', '印度', '印尼', '菲律宾'] },
  { key: 'channel', type: 'select', label: '渠道', defaultValue: '全部',
    options: ['全部', 'Dlocal', 'Airwallex', 'Payoneer', 'Epay', 'Payermax', 'Coda'] },
  { key: 'region', type: 'select', label: '大区', defaultValue: '全部',
    options: ['全部', '华东', '华南', '华北', '华中', '西南', '西北', '东北'] },
  { key: 'largeWithdraw', type: 'select', label: '大额提现单', defaultValue: '全部',
    options: YES_NO_OPTIONS },  // 复用公共选项
  { key: 'projectType', type: 'select', label: '项目类型', defaultValue: '全部',
    options: ['全部', '直播', '短视频', '游戏', '电商'] },
  
  // 日期范围类型
  { key: 'applyTime', type: 'date-range', label: '申请时间', defaultValue: undefined },
  { key: 'completeTime', type: 'date-range', label: '完成时间', defaultValue: undefined },
]

// 从配置自动生成筛选状态
const filters = reactive(
  filterConfigs.reduce((acc, config) => {
    acc[config.key] = config.defaultValue
    return acc
  }, {} as Record<string, any>)
)

// 表格配置
const tableConfig: TableConfig = {
  height: '500px',
  scrollX: true,
  scrollY: true,
  showCheckbox: true,
  fixedLayout: true,
}

// 表格列配置
const tableColumns: TableColumn[] = [
  { key: 'app', label: '应用', width: '100px', type: 'badge'},
  { key: 'orderNo', label: '订单号', width: '100px' },
  { key: 'statusText', label: '订单状态', width: '100px', type: 'status-badge' },
  { key: 'userName', label: '用户信息', width: '100px' },
  { key: 'guildName', label: '公会信息', width: '120px' },
  { key: 'deviceModel', label: '用户设备信息', width: '150px' },
]

// 选中的行
const selectedRows = ref<number[]>([])

// --- 计算属性 ---
const filteredData = computed(() => {
  return withdrawData.value.filter((item) => {
    // 简单模拟 App 筛选
    if (item.app !== currentApp.value) return false

    // 用户ID筛选
    if (filters.userId && !item.userId.toLowerCase().includes(filters.userId.toLowerCase())) {
      return false
    }
    // 平台订单号筛选
    if (filters.platformOrderNo && !item.orderNo.toLowerCase().includes(filters.platformOrderNo.toLowerCase())) {
      return false
    }
    // 订单状态筛选
    if (filters.orderStatus !== '全部' && item.statusText !== filters.orderStatus) {
      return false
    }
    return true
  })
})

// 分页
const currentPage = ref(1)
const pageSize = 15
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredData.value.slice(start, start + pageSize)
})
const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSize) || 1)

// 全选状态
const isAllSelected = computed(() => {
  return paginatedData.value.length > 0 && paginatedData.value.every((item) => selectedRows.value.includes(item.id))
})

// --- 日期格式化 ---
const df = new DateFormatter('zh-CN', {
  dateStyle: 'medium',
})

// --- 辅助函数：解决模板中的类型推断问题 ---
const getDateRangeValue = (key: keyof typeof filters): DateRange | undefined => {
  const val = filters[key]
  // 简单的类型保护
  if (val && typeof val === 'object' && 'start' in val) {
    return val as DateRange
  }
  return undefined
}

const setDateRangeValue = (key: keyof typeof filters, value: DateRange | undefined) => {
  // @ts-ignore - 强制赋值
  filters[key] = value
}

const getStringValue = (key: keyof typeof filters): string | number => {
  const val = filters[key]
  if (typeof val === 'string' || typeof val === 'number') {
    return val
  }
  return ''
}

const setStringValue = (key: keyof typeof filters, value: any) => {
  // @ts-ignore - 强制赋值
  filters[key] = value ?? ''
}

// --- 方法 ---
const handleSearch = () => {
  currentPage.value = 1
  console.log('搜索条件:', filters)
}

const handleExport = () => {
  console.log('导出数据:', filteredData.value)
}

const handleBatchApprove = () => {
  console.log('批量通过:', selectedRows.value)
}

const handleBatchReject = () => {
  console.log('批量拒绝:', selectedRows.value)
}

const handleBatchRiskReview = () => {
  console.log('批量风控审核:', selectedRows.value)
}

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
  <div class="h-full flex flex-col">
    <!-- 顶部操作栏 Teleport -->
    <Teleport to="#breadcrumb-actions" defer>
      <div class="flex items-center gap-4">
        <!-- App 选择 -->
        <Select v-model="currentApp">
          <SelectTrigger class="w-[120px] h-8 text-xs">
            <SelectValue placeholder="选择应用" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="app in APP_OPTIONS" :key="app" :value="app">
              {{ app }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- 语言选择 -->
        <Select v-model="currentLang">
          <SelectTrigger class="w-[100px] h-8 text-xs">
            <SelectValue placeholder="选择语言" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="lang in LANG_OPTIONS" :key="lang" :value="lang">
              {{ lang }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- 功能按钮 -->
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
      
      <!-- 功能区 - 筛选条件 -->
      <div class="bg-background rounded-xl border shadow-sm">
        <div class="p-5">
          <!-- 动态筛选表单区 -->
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            <div 
              v-for="config in filterConfigs" 
              :key="config.key"
              class="space-y-1.5"
            >
              <label class="text-xs font-medium text-muted-foreground">{{ config.label }}</label>
              
              <!-- 输入框类型 -->
              <Input
                v-if="config.type === 'input'"
                :model-value="getStringValue(config.key)"
                @update:model-value="(v) => setStringValue(config.key, v)"
                :placeholder="config.placeholder"
                class="h-9 text-sm"
              />
              
              <!-- 下拉框类型 -->
              <Select 
                v-else-if="config.type === 'select'"
                :model-value="getStringValue(config.key) as string"
                @update:model-value="(v) => setStringValue(config.key, v)"
              >
                <SelectTrigger class="h-9 text-sm w-full">
                  <SelectValue :placeholder="`选择${config.label}`" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem 
                    v-for="opt in config.options" 
                    :key="opt" 
                    :value="opt"
                  >
                    {{ opt }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <!-- 日期范围选择类型 -->
              <Popover v-else-if="config.type === 'date-range'">
                <PopoverTrigger as-child>
                  <Button
                    variant="outline"
                    class="h-9 w-full justify-start text-left font-normal px-3"
                    :class="!getDateRangeValue(config.key) && 'text-muted-foreground'"
                  >
                    <CalendarIcon class="mr-2 h-4 w-4" />
                    <template v-if="getDateRangeValue(config.key)?.start">
                      <template v-if="getDateRangeValue(config.key)?.end">
                        {{ df.format(getDateRangeValue(config.key)!.start!.toDate(getLocalTimeZone())) }} - {{ df.format(getDateRangeValue(config.key)!.end!.toDate(getLocalTimeZone())) }}
                      </template>
                      <template v-else>
                        {{ df.format(getDateRangeValue(config.key)!.start!.toDate(getLocalTimeZone())) }}
                      </template>
                    </template>
                    <template v-else>
                      <span>选择日期</span>
                    </template>
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <RangeCalendar
                    :model-value="getDateRangeValue(config.key)"
                    initial-focus
                    :number-of-months="2"
                    @update:model-value="(v) => setDateRangeValue(config.key, v)"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <!-- 底部操作按钮 -->
          <div class="flex items-center gap-3 pt-2 border-t">
            <Button @click="handleSearch" class="h-9 px-5">
              查询
            </Button>
            <Button variant="outline" @click="handleExport" class="h-9 px-5">
              导出
            </Button>
            <div class="w-px h-6 bg-border mx-1"></div>
            <Button 
              variant="secondary" 
              @click="handleBatchApprove"
              class="h-9 px-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
            >
              批量运营审核通过
            </Button>
            <Button 
              variant="secondary" 
              @click="handleBatchReject"
              class="h-9 px-4 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
            >
              批量运营审核不通过
            </Button>
            <Button 
              variant="secondary" 
              @click="handleBatchRiskReview"
              class="h-9 px-4 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
            >
              离线提现批量风控审核
            </Button>
            <div class="ml-auto text-xs text-muted-foreground">
              已选择 <span class="font-semibold text-foreground">{{ selectedRows.length }}</span> 条记录
            </div>
          </div>
        </div>
      </div>

      <!-- 列表区 -->
      <div class="flex-1 bg-background rounded-xl border shadow-sm overflow-hidden flex flex-col">
        <div 
          class="flex-1"
          :class="{
            'overflow-x-auto': tableConfig.scrollX,
            'overflow-y-auto': tableConfig.scrollY,
            'overflow-x-hidden': !tableConfig.scrollX,
            'overflow-y-hidden': !tableConfig.scrollY,
          }"
          :style="{ maxHeight: tableConfig.height }"
        >
          <Table :class="{ 'table-fixed': tableConfig.fixedLayout }" class="w-full">
            <TableHeader class="sticky top-0 bg-muted/50 z-10">
              <TableRow class="text-xs hover:bg-transparent">
                <!-- 复选框列 -->
                <TableHead 
                  v-if="tableConfig.showCheckbox"
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
                  v-for="col in tableColumns" 
                  :key="col.key"
                  class="h-11 font-semibold border-r last:border-r-0"
                  :class="{
                    'sticky z-20 bg-muted/50': col.fixed,
                    'left-0': col.fixed === 'left' && !tableConfig.showCheckbox,
                    'left-[50px]': col.fixed === 'left' && tableConfig.showCheckbox,
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
                  v-if="tableConfig.showCheckbox"
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
                  v-for="col in tableColumns" 
                  :key="col.key"
                  class="py-3 border-r last:border-r-0"
                  :class="{
                    'sticky z-10 bg-background': col.fixed,
                    'left-0': col.fixed === 'left' && !tableConfig.showCheckbox,
                    'left-[50px]': col.fixed === 'left' && tableConfig.showCheckbox,
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
</template>
