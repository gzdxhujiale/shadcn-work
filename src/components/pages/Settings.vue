<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Layers, Plus, Pencil, Trash2, Settings2, Save, FileCode, GripVertical, Info, ChevronRight, ChevronDown, Eye, EyeOff, Square, Download, Upload, FileDown, Search, MoreHorizontal, RefreshCw } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'vue-sonner'
import draggable from 'vuedraggable'
import { useConfigStore, type NavSubItem, type FilterConfig, type TableColumn } from '@/stores/configStore'

// Store
const configStore = useConfigStore()

// UI State - 当前选中的导航项
const selectedNavId = ref<string | null>(null)
const searchQuery = ref('') // 侧边栏搜索

// 一级导航展开/折叠状态
const expandedMainItems = reactive<Record<string, boolean>>({})

// 初始化展开状态（默认全部展开）
const initExpandedState = () => {
  configStore.navGroups.forEach(group => {
    group.items.forEach(mainItem => {
      if (expandedMainItems[mainItem.id] === undefined) {
        expandedMainItems[mainItem.id] = mainItem.isOpen ?? true
      }
    })
  })
}

// 切换一级导航展开状态
const toggleMainItemExpand = (mainItemId: string) => {
  expandedMainItems[mainItemId] = !expandedMainItems[mainItemId]
}

// 过滤后的导航组 (Search Enhancement)
const filteredNavGroups = computed(() => {
  if (!searchQuery.value) return configStore.navGroups

  const query = searchQuery.value.toLowerCase()
  return configStore.navGroups.map(group => {
    const filteredItems = group.items.map(mainItem => {
      // 如果主导航匹配，显示所有子导航
      if (mainItem.title.toLowerCase().includes(query)) return mainItem

      // 否则过滤子导航
      const filteredSubItems = mainItem.items?.filter(sub => 
        sub.title.toLowerCase().includes(query)
      )

      if (filteredSubItems?.length) {
        return { ...mainItem, items: filteredSubItems, isOpen: true } // 搜索时自动展开
      }
      return null
    }).filter(Boolean) as typeof group.items

    return { ...group, items: filteredItems }
  }).filter(group => group.items.length > 0)
})

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
  // template field removed - utilizing component structure
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

// Action Button Dialog State
const actionDialogOpen = ref(false)
const editingActionIndex = ref<number | null>(null)

const actionForm = ref({
  key: '',
  label: '',
  variant: 'default' as 'default' | 'outline' | 'secondary' | 'ghost',
  className: ''
})

// Card Dialog State
const cardDialogOpen = ref(false)
const editingCardIndex = ref<number | null>(null)

const cardForm = ref({
  key: '',
  title: '',
  data: ''
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
  initExpandedState()
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
      title: selectedNavInfo.value.subItem.title
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
        title: navForm.value.title
      }
    )
    closeEditNavDialog()
  }
}

// ============================================
// Add/Delete Sub Navigation
// ============================================

// Add Sub Nav Dialog State
const addSubNavDialogOpen = ref(false)
const addSubNavTargetGroup = ref(0)
const addSubNavTargetMainId = ref('')
const addSubNavForm = ref({ title: '', url: '#' })

const openAddSubNavDialog = (groupIndex: number, mainItemId: string) => {
  addSubNavTargetGroup.value = groupIndex
  addSubNavTargetMainId.value = mainItemId
  addSubNavForm.value = { title: '', url: '#' }
  addSubNavDialogOpen.value = true
}

const closeAddSubNavDialog = () => {
  addSubNavDialogOpen.value = false
}

const handleAddSubNav = () => {
  if (addSubNavForm.value.title) {
    configStore.addSubNavItem(
      addSubNavTargetGroup.value,
      addSubNavTargetMainId.value,
      {
        title: addSubNavForm.value.title,
        url: addSubNavForm.value.url,
        template: ''
      }
    )
    closeAddSubNavDialog()
  }
}

// Add Main Nav Dialog State
const addMainNavDialogOpen = ref(false)
const addMainNavForm = ref({ title: '', icon: Square })



const closeAddMainNavDialog = () => {
  addMainNavDialogOpen.value = false
}

const handleAddMainNav = () => {
    if (addMainNavForm.value.title) {
        // Default to group 0 (Platform)
        configStore.addNavMainItem(0, {
            title: addMainNavForm.value.title,
            icon: addMainNavForm.value.icon,
            url: '',
            items: []
        })
        closeAddMainNavDialog()
    }
}

const handleDeleteSubNav = (groupIndex: number, mainItemId: string, subItemId: string, subItemTitle: string) => {
  showConfirm(
    '确定删除导航项？',
    `确定要删除导航项 "${subItemTitle}" 吗？相关的页面配置也会被删除。`,
    () => {
      configStore.deleteSubNavItem(groupIndex, mainItemId, subItemId)
      // 如果删除的是当前选中的导航项，清除选中状态
      if (selectedNavId.value === subItemId) {
        selectedNavId.value = null
      }
    }
  )
}

const handleDeleteCurrentNav = () => {
  if (!selectedNavInfo.value) return
  handleDeleteSubNav(
    selectedNavInfo.value.groupIndex,
    selectedNavInfo.value.mainItemId,
    selectedNavInfo.value.subItem.id,
    selectedNavInfo.value.subItem.title
  )
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

// 切换筛选项可见性
const toggleFilterVisibility = (index: number) => {
  if (!selectedNavId.value) return
  const config = configStore.page1Configs[selectedNavId.value]
  if (config) {
    const filter = config.filterArea.filters[index]
    filter.visible = filter.visible === false ? true : false
  }
}

// 切换列可见性
const toggleColumnVisibility = (index: number) => {
  if (!selectedNavId.value) return
  const config = configStore.page1Configs[selectedNavId.value]
  if (config) {
    const col = config.tableArea.columns[index]
    col.visible = col.visible === false ? true : false
  }
}

// 切换操作按钮可见性
const toggleActionVisibility = (index: number) => {
  if (!selectedNavId.value) return
  const config = configStore.page1Configs[selectedNavId.value]
  if (config?.actionsArea?.buttons) {
    const action = config.actionsArea.buttons[index]
    action.visible = action.visible === false ? true : false
  }
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
// Action Button CRUD
// ============================================

const openAddActionDialog = () => {
  editingActionIndex.value = null
  actionForm.value = { key: '', label: '', variant: 'default', className: '' }
  actionDialogOpen.value = true
}

const openEditActionDialog = (index: number) => {
  const config = configStore.page1Configs[selectedNavId.value!]
  if (config?.actionsArea?.buttons) {
    const action = config.actionsArea.buttons[index]
    editingActionIndex.value = index
    actionForm.value = {
      key: action.key,
      label: action.label,
      variant: action.variant || 'default',
      className: action.className || ''
    }
    actionDialogOpen.value = true
  }
}

const closeActionDialog = () => {
  actionDialogOpen.value = false
  editingActionIndex.value = null
}

const handleSaveAction = () => {
  if (selectedNavId.value && actionForm.value.key && actionForm.value.label) {
    const config = configStore.page1Configs[selectedNavId.value]
    if (config) {
      if (!config.actionsArea) config.actionsArea = { buttons: [] }
      if (!config.actionsArea.buttons) config.actionsArea.buttons = []
      
      const newAction = {
        key: actionForm.value.key,
        label: actionForm.value.label,
        variant: actionForm.value.variant === 'default' ? undefined : actionForm.value.variant,
        className: actionForm.value.className || undefined
      }
      
      if (editingActionIndex.value !== null) {
        config.actionsArea.buttons[editingActionIndex.value] = newAction
      } else {
        config.actionsArea.buttons.push(newAction)
      }
    }
    closeActionDialog()
  }
}

const handleDeleteAction = (index: number) => {
  if (!selectedNavId.value) return
  showConfirm(
    '确定删除？',
    '确定要删除这个操作按钮吗？',
    () => {
      const config = configStore.page1Configs[selectedNavId.value!]
      if (config?.actionsArea?.buttons) {
        config.actionsArea.buttons.splice(index, 1)
      }
    }
  )
}

// ============================================
// Card Config Actions
// ============================================

const openAddCardDialog = () => {
  editingCardIndex.value = null
  cardForm.value = { key: '', title: '', data: '' }
  cardDialogOpen.value = true
}

const openEditCardDialog = (index: number) => {
  const config = configStore.page1Configs[selectedNavId.value!]
  if (config?.cardArea?.cards) {
    const card = config.cardArea.cards[index]
    editingCardIndex.value = index
    cardForm.value = {
      key: card.key,
      title: card.title,
      data: String(card.data)
    }
    cardDialogOpen.value = true
  }
}

const closeCardDialog = () => {
  cardDialogOpen.value = false
  editingCardIndex.value = null
}

const handleSaveCard = () => {
  if (selectedNavId.value && cardForm.value.key && cardForm.value.title) {
    const config = configStore.page1Configs[selectedNavId.value]
    if (config) {
      if (!config.cardArea) config.cardArea = { show: true, columns: 4, gap: '16px', cards: [] }
      if (!config.cardArea.cards) config.cardArea.cards = []
      
      const newCard = {
        key: cardForm.value.key,
        title: cardForm.value.title,
        data: cardForm.value.data
      }
      
      if (editingCardIndex.value !== null) {
        config.cardArea.cards[editingCardIndex.value] = newCard
      } else {
        config.cardArea.cards.push(newCard)
      }
    }
    closeCardDialog()
  }
}

const handleDeleteCard = (index: number) => {
  if (!selectedNavId.value) return
  showConfirm(
    '确定删除？',
    '确定要删除这个卡片吗？',
    () => {
      const config = configStore.page1Configs[selectedNavId.value!]
      if (config?.cardArea?.cards) {
        config.cardArea.cards.splice(index, 1)
      }
    }
  )
}

// 切换区域显示状态
const toggleAreaShow = (area: 'filterArea' | 'actionsArea' | 'cardArea' | 'tableArea') => {
  if (!selectedNavId.value) return
  const config = configStore.page1Configs[selectedNavId.value]
  if (config) {
    if (area === 'filterArea') {
      config.filterArea.show = config.filterArea.show === false ? true : false
    } else if (area === 'actionsArea') {
      if (!config.actionsArea) config.actionsArea = { buttons: [] }
      config.actionsArea.show = config.actionsArea.show === false ? true : false
    } else if (area === 'cardArea') {
      if (!config.cardArea) config.cardArea = { show: true, columns: 4, gap: '16px', cards: [] }
      config.cardArea.show = !config.cardArea.show
    } else if (area === 'tableArea') {
      config.tableArea.show = config.tableArea.show === false ? true : false
    }
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

// 操作按钮列表的本地副本用于拖拽
const actionList = computed({
  get: () => currentPageConfig.value?.actionsArea?.buttons || [],
  set: (val) => {
    if (currentPageConfig.value) {
      if (!currentPageConfig.value.actionsArea) currentPageConfig.value.actionsArea = { buttons: [] }
      currentPageConfig.value.actionsArea.buttons = val
    }
  }
})

// 卡片列表的本地副本用于拖拽
const cardList = computed({
  get: () => currentPageConfig.value?.cardArea?.cards || [],
  set: (val) => {
    if (currentPageConfig.value) {
      if (!currentPageConfig.value.cardArea) currentPageConfig.value.cardArea = { show: true, columns: 4, gap: '16px', cards: [] }
      currentPageConfig.value.cardArea.cards = val
    }
  }
})

// ============================================
// 保存配置功能 (Issue 10: 添加 toast 通知)
// ============================================

const isSaving = ref(false)

// ============================================
// 配置导入/导出功能
// ============================================

// 隐藏的文件输入元素引用
const fileInputRef = ref<HTMLInputElement | null>(null)

// 下载 JSON 文件
const downloadJson = (data: object, filename: string) => {
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 模板下载
const handleDownloadTemplate = () => {
  const template = configStore.getTemplateConfig()
  downloadJson(template, 'config-template.json')
  toast.success('模板下载成功', {
    description: '请按照模板格式填写配置后导入'
  })
}

// 导出配置
const handleExportConfig = () => {
  const exportData = configStore.exportFullConfig()
  const filename = `settings-config-${new Date().toISOString().slice(0, 10)}.json`
  downloadJson(exportData, filename)
  toast.success('配置导出成功', {
    description: `已保存为 ${filename}`
  })
}

// 导入配置
const handleImportConfig = () => {
  fileInputRef.value?.click()
}

// 待确认导入的数据
const pendingImportData = ref<any>(null)
const importConfirmDialogOpen = ref(false)

// 处理文件选择
const handleFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      // 验证新版 JSON 结构 (version 2.0)
      if (!data.version || !data.navGroups || !Array.isArray(data.navGroups)) {
        toast.error('导入失败', {
          description: '无效的配置文件格式，请使用 2.0 版本格式'
        })
        return
      }
      // 检查版本
      if (data.version !== '2.0') {
        toast.warning('版本警告', {
          description: `配置文件版本 ${data.version} 可能不兼容，推荐使用 2.0 版本`
        })
      }
      // 储存数据并显示确认对话框
      pendingImportData.value = data
      importConfirmDialogOpen.value = true
    } catch (err) {
      toast.error('导入失败', {
        description: '无效的 JSON 文件格式'
      })
    }
  }
  reader.readAsText(file)
  
  // 清空 input 以便重复选择同一文件
  input.value = ''
}

// 确认导入并同步到云端
const handleConfirmImport = async () => {
  if (!pendingImportData.value) return
  
  isSaving.value = true
  importConfirmDialogOpen.value = false
  
  try {
    const result = await configStore.importAndSyncToCloud(pendingImportData.value)
    if (result.success) {
      toast.success('导入成功', {
        description: result.message
      })
    } else {
      toast.error('导入失败', {
        description: result.message
      })
    }
  } finally {
    isSaving.value = false
    pendingImportData.value = null
  }
}

// 保存配置到云端
const handleSaveToCloud = async () => {
  isSaving.value = true
  try {
    const result = await configStore.saveToSupabase()
    if (result.success) {
      toast.success('保存成功', {
        description: result.message
      })
    } else {
      toast.error('保存失败', {
        description: result.message
      })
    }
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="settings-root">
      <!-- 隐藏的文件输入 -->
      <input 
        ref="fileInputRef"
        type="file" 
        accept=".json"
        class="hidden"
        @change="handleFileSelected"
      />
    
    <div class="h-full flex overflow-hidden">
      <!-- Left Sidebar: Navigation List -->
    <div class="w-72 border-r bg-muted/30 flex flex-col">
      <!-- Sidebar Header -->
      <div class="p-4 border-b">
        <div class="flex items-center justify-between">
            <h2 class="font-semibold text-lg flex items-center gap-2">
            <Settings2 class="w-5 h-5" />
            页面配置
            </h2>
            <DropdownMenu>
            <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon" class="h-8 w-8">
                <MoreHorizontal class="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuLabel>全局操作</DropdownMenuLabel>
                <DropdownMenuItem @click="handleImportConfig">
                <Upload class="w-4 h-4 mr-2" />
                导入配置
                </DropdownMenuItem>
                <DropdownMenuItem @click="handleExportConfig">
                <Download class="w-4 h-4 mr-2" />
                导出配置
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem @click="handleDownloadTemplate">
                <FileDown class="w-4 h-4 mr-2" />
                下载模板
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                 <DropdownMenuItem @click="handleSaveToCloud" :disabled="isSaving">
                  <Save class="w-4 h-4 mr-2" />
                  保存到云端
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <!-- Search Input -->
        <div class="relative mt-4">
          <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            v-model="searchQuery"
            placeholder="搜索导航..." 
            class="pl-8"
          />
        </div>
      </div>

      <!-- Navigation List -->
      <div class="flex-1 overflow-auto p-4">
        <div class="space-y-6">
          <div v-for="(group, groupIndex) in filteredNavGroups" :key="groupIndex">
            <h3 class="text-xs font-semibold text-muted-foreground mb-3 px-2 uppercase tracking-wider">
              {{ group.label || '未命名分组' }}
            </h3>
            
            <div class="space-y-1">
              <div v-for="mainItem in group.items" :key="mainItem.id" class="border rounded-lg overflow-hidden">
                  <!-- Main Item Header - Clickable to expand/collapse -->
                  <div 
                    class="px-3 py-2 text-sm font-medium text-foreground flex items-center gap-2 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                    @click="toggleMainItemExpand(mainItem.id)"
                  >
                     <!-- Expand/Collapse Icon -->
                     <ChevronDown v-if="expandedMainItems[mainItem.id]" class="w-4 h-4 text-muted-foreground shrink-0"/>
                     <ChevronRight v-else class="w-4 h-4 text-muted-foreground shrink-0"/>
                     <component :is="mainItem.icon" v-if="mainItem.icon" class="w-4 h-4 text-muted-foreground shrink-0"/>
                     <span class="flex-1 truncate">{{ mainItem.title }}</span>
                     <!-- Add Sub Item Button -->
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       class="h-6 w-6 p-0 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                       @click.stop="openAddSubNavDialog(groupIndex, mainItem.id)"
                     >
                       <Plus class="w-3.5 h-3.5"/>
                     </Button>
                  </div>
                  
                  <!-- Sub Items - Collapsible -->
                  <div v-show="expandedMainItems[mainItem.id]">
                    <draggable
                      v-model="mainItem.items"
                      tag="div"
                      class="space-y-0.5 p-1 min-h-[10px]"
                      item-key="id"
                      :animation="200"
                      group="subItems"
                      handle=".drag-handle"
                    >
                      <template #item="{ element: subItem }">
                         <div
                          class="px-3 py-2 rounded-md cursor-pointer transition-all flex items-center justify-between group/item"
                          :class="selectedNavId === subItem.id 
                            ? 'bg-primary/10 text-primary font-medium' 
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
                          @click="handleSelectNav(subItem.id)"
                         >
                           <div class="flex items-center gap-2 flex-1 min-w-0">
                              <!-- Drag Handle (visible on hover) -->
                              <GripVertical class="w-3 h-3 text-muted-foreground opacity-0 group-hover/item:opacity-50 cursor-grab drag-handle" />
                              <span class="truncate text-sm">{{ subItem.title }}</span>
                           </div>
                           
                           <!-- Removed template badge -->
                         </div>
                      </template>
                    </draggable>
                    <!-- Empty state -->
                    <div v-if="!mainItem.items?.length" class="px-3 py-2 text-xs text-muted-foreground text-center">
                      暂无子导航
                    </div>
                  </div>
                </div>
             </div>
          </div>
          
          <!-- Empty Search Result -->
          <div v-if="filteredNavGroups.length === 0" class="text-center py-8 text-muted-foreground">
            <p class="text-sm">未找到匹配的导航项</p>
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
          <!-- Header Content (Compact Layout) -->
          <div class="px-6 py-4 border-b flex items-center justify-between shrink-0 bg-background/95 backdrop-blur z-10">
            <!-- Left: Title & ID -->
            <div class="flex items-center gap-3 overflow-hidden">
               <div class="p-2 bg-primary/5 rounded-lg shrink-0">
                  <FileCode class="w-5 h-5 text-primary" />
               </div>
               <div class="flex flex-col min-w-0">
                  <h3 class="font-medium text-base truncate">{{ selectedNavInfo?.subItem.title }}</h3>
                  <span class="text-[10px] text-muted-foreground font-mono truncate leading-none mt-1">ID: {{ selectedNavId }}</span>
               </div>
            </div>

             <!-- Right: Actions -->
            <div class="flex items-center gap-1.5 shrink-0">
               <!-- 重命名 -->
               <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-foreground" title="重命名" @click="openEditNavDialog">
                  <Pencil class="w-4 h-4" />
               </Button>

               <!-- 更多操作 -->
               <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <MoreHorizontal class="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-48">
                  <DropdownMenuLabel>页面配置操作</DropdownMenuLabel>
                  <DropdownMenuItem @click="handleExportConfig">
                    <Download class="w-4 h-4 mr-2" />导出配置
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="handleImportConfig">
                    <Upload class="w-4 h-4 mr-2" />导入配置
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem @click="handleDownloadTemplate">
                    <FileDown class="w-4 h-4 mr-2" />下载模板
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="text-destructive focus:text-destructive" @click="handleDeleteCurrentNav">
                    <Trash2 class="w-4 h-4 mr-2" />删除导航项
                  </DropdownMenuItem>
                   <DropdownMenuSeparator />
                  <DropdownMenuItem class="text-destructive focus:text-destructive" @click="handleDeletePageConfig">
                    <RefreshCw class="w-4 h-4 mr-2" />重置页面配置
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

               <!-- 分隔线 -->
               <div class="w-px h-4 bg-border mx-1"></div>
               
               <!-- 保存按钮 -->
               <Button size="sm" class="h-8 px-3 text-xs" @click="handleSaveToCloud" :disabled="isSaving">
                  <Save class="w-3.5 h-3.5 mr-1.5" />
                  <span v-if="isSaving">保存中...</span>
                  <span v-else>保存</span>
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
            <Tabs default-value="filter" class="w-full">
                <TabsList class="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="filter">筛选区配置</TabsTrigger>
                  <TabsTrigger value="actions">操作区配置</TabsTrigger>
                  <TabsTrigger value="card">卡片区配置</TabsTrigger>
                  <TabsTrigger value="table">表格区配置</TabsTrigger>
                </TabsList>

                <div class="mt-4">
                  <!-- 筛选区配置 -->
                  <TabsContent value="filter" class="m-0 focus-visible:ring-0">
                    <Card>
                      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div class="space-y-1">
                          <CardTitle class="text-base">筛选区配置</CardTitle>
                          <CardDescription>配置页面顶部的筛选条件</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" @click="openAddFilterDialog">
                          <Plus class="w-4 h-4 mr-2" />
                          添加筛选项
                        </Button>
                      </CardHeader>
                      <CardContent class="space-y-6">
                        <!-- 布局配置 -->
                        <div class="flex items-center gap-6 p-4 bg-muted/30 rounded-lg">
                          <div class="flex items-center gap-3">
                            <label class="text-sm font-medium">每行显示:</label>
                            <div class="flex items-center">
                              <Input 
                                :model-value="currentPageConfig.filterArea.columns"
                                @update:model-value="handleUpdateFilterArea('columns', Number($event))"
                                type="number"
                                class="w-16 h-8 rounded-r-none border-r-0 focus-visible:ring-0"
                              />
                              <div class="h-8 px-3 flex items-center bg-muted border rounded-r-md text-xs text-muted-foreground">列</div>
                            </div>
                          </div>
                          <div class="flex items-center gap-3">
                            <label class="text-sm font-medium">间距:</label>
                            <Input 
                              :model-value="currentPageConfig.filterArea.gap"
                              @update:model-value="handleUpdateFilterArea('gap', $event)"
                              class="w-24 h-8"
                              placeholder="如 16px"
                            />
                          </div>
                        </div>

                        <!-- 筛选项列表 - Table -->
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
                                      :class="filter.visible === false ? 'text-muted-foreground' : 'text-foreground'"
                                      @click="toggleFilterVisibility(index)"
                                      :title="filter.visible === false ? '点击显示' : '点击隐藏'"
                                    >
                                      <EyeOff v-if="filter.visible === false" class="w-3 h-3" />
                                      <Eye v-else class="w-3 h-3" />
                                    </Button>
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
                            <div v-if="currentPageConfig.filterArea.filters.length === 0" class="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-md bg-muted/10">
                          <div class="p-3 bg-muted rounded-full mb-3">
                            <Search class="w-6 h-6 text-muted-foreground/50" />
                          </div>
                          <p class="text-sm text-muted-foreground font-medium">暂无筛选项</p>
                          <p class="text-xs text-muted-foreground mt-1">点击右上角添加按钮开始配置</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <!-- 操作区配置 -->
                  <TabsContent value="actions" class="m-0 focus-visible:ring-0">
                    <Card>
                      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div class="space-y-1">
                          <CardTitle class="text-base">操作区配置</CardTitle>
                          <CardDescription>页面右上角的操作按钮</CardDescription>
                        </div>
                        <div class="flex items-center gap-4">
                          <div class="flex items-center gap-2">
                             <input 
                              type="checkbox" 
                              :checked="currentPageConfig.actionsArea?.show !== false"
                              @change="toggleAreaShow('actionsArea')"
                              class="rounded border-input text-primary focus:ring-primary"
                            />
                            <label class="text-sm text-muted-foreground">显示区域</label>
                          </div>
                          <Button variant="outline" size="sm" @click="openAddActionDialog">
                            <Plus class="w-4 h-4 mr-2" />
                            添加按钮
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent class="space-y-6">
                        <!-- Action List -->
                        <div class="border rounded-md" v-if="currentPageConfig.actionsArea?.buttons && currentPageConfig.actionsArea.buttons.length > 0">
                        <table class="w-full">
                          <thead>
                            <tr class="border-b bg-muted/50">
                              <th class="w-8 p-2"></th>
                              <th class="text-left p-2 text-sm font-medium">标签</th>
                              <th class="text-left p-2 text-sm font-medium">Key</th>
                              <th class="text-left p-2 text-sm font-medium">样式</th>
                              <th class="text-right p-2 text-sm font-medium w-20">操作</th>
                            </tr>
                          </thead>
                          <draggable 
                            v-model="actionList"
                            tag="tbody"
                            item-key="key"
                            handle=".drag-handle"
                            :animation="200"
                          >
                            <template #item="{ element: action, index }">
                              <tr class="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                <td class="p-2">
                                  <GripVertical class="w-4 h-4 text-muted-foreground cursor-grab drag-handle" />
                                </td>
                                <td class="p-2 text-sm font-medium">{{ action.label }}</td>
                                <td class="p-2">
                                  <code class="text-xs text-muted-foreground">{{ action.key }}</code>
                                </td>
                                <td class="p-2">
                                  <Badge variant="outline" class="text-xs">{{ action.variant || 'default' }}</Badge>
                                </td>
                                <td class="p-2">
                                  <div class="flex gap-1 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      class="h-7 w-7 p-0"
                                      :class="action.visible === false ? 'text-muted-foreground' : 'text-foreground'"
                                      @click="toggleActionVisibility(index)"
                                      :title="action.visible === false ? '点击显示' : '点击隐藏'"
                                    >
                                      <EyeOff v-if="action.visible === false" class="w-3 h-3" />
                                      <Eye v-else class="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      class="h-7 w-7 p-0"
                                      @click="openEditActionDialog(index)"
                                    >
                                      <Pencil class="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      class="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                      @click="handleDeleteAction(index)"
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
                            <div v-if="!currentPageConfig.actionsArea?.buttons || currentPageConfig.actionsArea.buttons.length === 0" class="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-md bg-muted/10">
                          <div class="p-3 bg-muted rounded-full mb-3">
                            <MoreHorizontal class="w-6 h-6 text-muted-foreground/50" />
                          </div>
                          <p class="text-sm text-muted-foreground font-medium">暂无操作按钮</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <!-- 卡片区配置 -->
                  <TabsContent value="card" class="m-0 focus-visible:ring-0">
                    <Card>
                      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div class="space-y-1">
                          <CardTitle class="text-base">卡片区配置</CardTitle>
                          <CardDescription>顶部概览卡片</CardDescription>
                        </div>
                        <div class="flex items-center gap-4">
                           <div class="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              :checked="currentPageConfig.cardArea?.show !== false"
                              @change="toggleAreaShow('cardArea')"
                              class="rounded border-input text-primary focus:ring-primary"
                            />
                            <label class="text-sm text-muted-foreground">显示区域</label>
                          </div>
                          <Button variant="outline" size="sm" @click="openAddCardDialog">
                            <Plus class="w-4 h-4 mr-2" />
                            添加卡片
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent class="space-y-6">
                        <!-- 布局配置 -->
                        <div class="flex items-center gap-6 p-4 bg-muted/30 rounded-lg">
                           <div class="flex items-center gap-3">
                            <label class="text-sm font-medium">每行显示:</label>
                            <div class="flex items-center">
                              <Input 
                                :model-value="currentPageConfig.cardArea?.columns || 4"
                                @update:model-value="(v: string | number) => { if (currentPageConfig && currentPageConfig.cardArea) currentPageConfig.cardArea.columns = Number(v) }"
                                type="number"
                                class="w-16 h-8 rounded-r-none border-r-0 focus-visible:ring-0"
                              />
                               <div class="h-8 px-3 flex items-center bg-muted border rounded-r-md text-xs text-muted-foreground">列</div>
                            </div>
                          </div>
                           <div class="flex items-center gap-3">
                            <label class="text-sm font-medium">间距:</label>
                             <Input 
                              :model-value="currentPageConfig.cardArea?.gap || '16px'"
                              @update:model-value="(v: string | number) => { if (currentPageConfig && currentPageConfig.cardArea) currentPageConfig.cardArea.gap = String(v) }"
                              class="w-24 h-8"
                              placeholder="如 16px"
                            />
                          </div>
                        </div>
                        
                        <!-- 卡片列表 - Table -->
                        <div class="border rounded-md" v-if="currentPageConfig.cardArea?.cards && currentPageConfig.cardArea.cards.length > 0">
                        <table class="w-full">
                          <thead>
                            <tr class="border-b bg-muted/50">
                              <th class="w-8 p-2"></th>
                              <th class="text-left p-2 text-sm font-medium">Key</th>
                              <th class="text-left p-2 text-sm font-medium">标题</th>
                              <th class="text-left p-2 text-sm font-medium">数据</th>
                              <th class="text-right p-2 text-sm font-medium w-20">操作</th>
                            </tr>
                          </thead>
                          <draggable 
                            v-model="cardList"
                            tag="tbody"
                            item-key="key"
                            handle=".drag-handle"
                            :animation="200"
                          >
                            <template #item="{ element: card, index }">
                              <tr class="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                <td class="p-2">
                                  <GripVertical class="w-4 h-4 text-muted-foreground cursor-grab drag-handle" />
                                </td>
                                <td class="p-2">
                                  <code class="text-xs text-muted-foreground">{{ card.key }}</code>
                                </td>
                                <td class="p-2 text-sm">{{ card.title }}</td>
                                <td class="p-2 text-sm text-muted-foreground">{{ card.data }}</td>
                                <td class="p-2">
                                  <div class="flex gap-1 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      class="h-7 w-7 p-0"
                                      @click="openEditCardDialog(index)"
                                    >
                                      <Pencil class="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      class="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                      @click="handleDeleteCard(index)"
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
                            <div v-if="!currentPageConfig.cardArea?.cards || currentPageConfig.cardArea.cards.length === 0" class="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-md bg-muted/10">
                          <div class="p-3 bg-muted rounded-full mb-3">
                            <Layers class="w-6 h-6 text-muted-foreground/50" />
                          </div>
                          <p class="text-sm text-muted-foreground font-medium">暂无卡片配置</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <!-- 表格区配置 -->
                  <TabsContent value="table" class="m-0 focus-visible:ring-0">
                    <Card>
                      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div class="space-y-1">
                          <CardTitle class="text-base">表格区配置</CardTitle>
                          <CardDescription>数据表格列与布局</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" @click="openAddColumnDialog">
                          <Plus class="w-4 h-4 mr-2" />
                          添加列
                        </Button>
                      </CardHeader>
                      <CardContent class="space-y-6">
                        <!-- 表格设置 -->
                        <div class="flex items-center gap-6 flex-wrap p-4 bg-muted/30 rounded-lg">
                           <div class="flex items-center gap-3">
                            <label class="text-sm font-medium">高度:</label>
                             <Input 
                              :model-value="currentPageConfig.tableArea.height"
                              @update:model-value="handleUpdateTableArea('height', $event)"
                              class="w-24 h-8"
                            />
                          </div>
                          <div class="h-8 w-px bg-border"></div>
                          <div class="flex items-center gap-2">
                             <input 
                              type="checkbox" 
                              :checked="currentPageConfig.tableArea.scrollX"
                              @change="handleUpdateTableArea('scrollX', ($event.target as HTMLInputElement).checked)"
                              class="rounded border-input text-primary focus:ring-primary"
                            />
                            <label class="text-sm text-muted-foreground">横向滚动</label>
                          </div>
                          <div class="flex items-center gap-2">
                             <input 
                              type="checkbox" 
                              :checked="currentPageConfig.tableArea.scrollY"
                              @change="handleUpdateTableArea('scrollY', ($event.target as HTMLInputElement).checked)"
                              class="rounded border-input text-primary focus:ring-primary"
                            />
                            <label class="text-sm text-muted-foreground">纵向滚动</label>
                          </div>
                          <div class="flex items-center gap-2">
                             <input 
                              type="checkbox" 
                              :checked="currentPageConfig.tableArea.showCheckbox"
                              @change="handleUpdateTableArea('showCheckbox', ($event.target as HTMLInputElement).checked)"
                              class="rounded border-input text-primary focus:ring-primary"
                            />
                            <label class="text-sm text-muted-foreground">显示复选框</label>
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
                                      :class="col.visible === false ? 'text-muted-foreground' : 'text-foreground'"
                                      @click="toggleColumnVisibility(index)"
                                      :title="col.visible === false ? '点击显示' : '点击隐藏'"
                                    >
                                      <EyeOff v-if="col.visible === false" class="w-3 h-3" />
                                      <Eye v-else class="w-3 h-3" />
                                    </Button>
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
                            <div v-if="currentPageConfig.tableArea.columns.length === 0" class="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-md bg-muted/10">
                          <div class="p-3 bg-muted rounded-full mb-3">
                            <FileCode class="w-6 h-6 text-muted-foreground/50" />
                          </div>
                          <p class="text-sm text-muted-foreground font-medium">暂无表格列</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
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

  <!-- 添加/编辑操作按钮对话框 -->
  <Dialog v-model:open="actionDialogOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ editingActionIndex !== null ? '编辑操作按钮' : '添加操作按钮' }}</DialogTitle>
        <DialogDescription>{{ editingActionIndex !== null ? '修改操作按钮配置' : '添加新的操作按钮' }}</DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Key</label>
            <Input v-model="actionForm.key" placeholder="如 search" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">按钮文本</label>
            <Input v-model="actionForm.label" placeholder="如 查询" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">样式</label>
            <Select v-model="actionForm.variant">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (蓝色)</SelectItem>
                <SelectItem value="outline">Outline (边框)</SelectItem>
                <SelectItem value="secondary">Secondary (灰色)</SelectItem>
                <SelectItem value="ghost">Ghost (透明)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">自定义样式类</label>
            <Input v-model="actionForm.className" placeholder="可选，如 bg-emerald-50" />
          </div>
        </div>
        
        <!-- Preview Section -->
        <div class="space-y-2 pt-2 border-t">
          <label class="text-sm font-medium text-muted-foreground">预览</label>
          <div class="flex items-center gap-3 p-3 rounded-md bg-muted/30">
            <Button 
              :variant="actionForm.variant"
              class="h-9 px-5"
              :class="actionForm.className"
            >
              {{ actionForm.label || '按钮文本' }}
            </Button>
            <span class="text-xs text-muted-foreground">← 按钮实际样式</span>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="closeActionDialog">取消</Button>
        <Button @click="handleSaveAction">{{ editingActionIndex !== null ? '保存' : '添加' }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Card Dialog -->
  <Dialog v-model:open="cardDialogOpen">
    <DialogContent class="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle>{{ editingCardIndex !== null ? '编辑卡片' : '添加卡片' }}</DialogTitle>
        <DialogDescription>{{ editingCardIndex !== null ? '修改卡片配置' : '添加新的卡片' }}</DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">Key</label>
          <Input v-model="cardForm.key" placeholder="如 total_orders" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">标题</label>
          <Input v-model="cardForm.title" placeholder="如 订单总数" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">数据</label>
          <Input v-model="cardForm.data" placeholder="如 1,234 或动态值" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="closeCardDialog">取消</Button>
        <Button @click="handleSaveCard">{{ editingCardIndex !== null ? '保存' : '添加' }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Add Sub Nav Dialog -->
  <Dialog v-model:open="addSubNavDialogOpen">
    <DialogContent class="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle>添加子导航</DialogTitle>
        <DialogDescription>
          添加一个新的子导航项
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">标题</label>
          <Input v-model="addSubNavForm.title" placeholder="请输入导航标题" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="closeAddSubNavDialog">取消</Button>
        <Button @click="handleAddSubNav">添加</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Add Main Nav Dialog -->
  <Dialog v-model:open="addMainNavDialogOpen">
    <DialogContent class="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle>添加一级导航</DialogTitle>
        <DialogDescription>
          添加一个新的主导航项
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">标题</label>
          <Input v-model="addMainNavForm.title" placeholder="请输入导航标题" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="closeAddMainNavDialog">取消</Button>
        <Button @click="handleAddMainNav">添加</Button>
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

  <!-- 导入确认对话框 -->
  <AlertDialog v-model:open="importConfirmDialogOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>确认导入配置</AlertDialogTitle>
        <AlertDialogDescription>
          导入配置将覆盖当前设置并同步到云端。确定要继续吗？
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="importConfirmDialogOpen = false">取消</AlertDialogCancel>
        <AlertDialogAction @click="handleConfirmImport">确认导入</AlertDialogAction>
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
