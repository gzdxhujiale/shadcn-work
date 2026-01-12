<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { 
  Shield,
  Search,
  Lock,
  Users,
  Filter,
  LayoutGrid,
  Database,
  ChevronRight,
  ChevronDown,
  Folder,
  File,
  Check,
  Eye,
  EyeOff,
  X,
  Expand
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// --- 数据定义 ---
const PERMISSION_TREE = [
  { id: 'workspace', name: '工作台', icon: 'folder', children: [
    { id: 'workspace:todo', name: '待办清单', icon: 'file', type: 'menu', children: [
      { id: 'workspace:todo:view', name: '查看', type: 'action' },
      { id: 'workspace:todo:edit', name: '编辑', type: 'action' },
    ]},
    { id: 'workspace:history', name: '历史记录', icon: 'file', type: 'menu', children: [
      { id: 'workspace:history:view', name: '查看', type: 'action' },
    ]},
  ]},
  { id: 'report', name: '经营仓', icon: 'folder', children: [
    { id: 'report:company', name: '公司经营仓', icon: 'file', type: 'menu', children: [
      { id: 'report:company:view', name: '查看', type: 'action' },
      { id: 'report:company:export', name: '导出', type: 'action' },
    ]},
    { id: 'report:ameba', name: '阿米巴经营仓', icon: 'file', type: 'menu', children: [
      { id: 'report:ameba:view', name: '查看', type: 'action' },
      { id: 'report:ameba:export', name: '导出', type: 'action' },
    ]},
    { id: 'report:store', name: '店铺经营仓', icon: 'file', type: 'menu', children: [
      { id: 'report:store:view', name: '查看', type: 'action' },
      { id: 'report:store:export', name: '导出', type: 'action' },
    ]},
  ]},
  { id: 'dashboard', name: '数据看板', icon: 'folder', children: [
    { id: 'dashboard:self-service-bi', name: '自助报表', icon: 'file', type: 'menu', children: [
      { id: 'dashboard:self-service-bi:view', name: '查看', type: 'action' },
      { id: 'dashboard:self-service-bi:edit', name: '编辑', type: 'action' },
      { id: 'dashboard:self-service-bi:export', name: '导出', type: 'action' },
    ]},
    { id: 'dashboard:comparison', name: '对比分析', icon: 'file', type: 'menu', children: [
      { id: 'dashboard:comparison:view', name: '查看', type: 'action' },
      { id: 'dashboard:comparison:export', name: '导出', type: 'action' },
    ]},
  ]},
  { id: 'rbac', name: '权限中心', icon: 'folder', children: [
    { id: 'rbac:user', name: '用户管理', icon: 'file', type: 'menu', children: [
      { id: 'rbac:user:view', name: '查看', type: 'action' },
      { id: 'rbac:user:add', name: '新增', type: 'action' },
      { id: 'rbac:user:edit', name: '编辑', type: 'action' },
      { id: 'rbac:user:delete', name: '删除', type: 'action' },
    ]},
    { id: 'rbac:role', name: '角色管理', icon: 'file', type: 'menu', children: [
      { id: 'rbac:role:view', name: '查看', type: 'action' },
      { id: 'rbac:role:add', name: '新增', type: 'action' },
      { id: 'rbac:role:edit', name: '编辑', type: 'action' },
      { id: 'rbac:role:delete', name: '删除', type: 'action' },
    ]},
    { id: 'rbac:permission', name: '权限配置', icon: 'file', type: 'menu', children: [
      { id: 'rbac:permission:view', name: '查看', type: 'action' },
      { id: 'rbac:permission:edit', name: '编辑', type: 'action' },
    ]},
    { id: 'rbac:apply', name: '权限申请', icon: 'file', type: 'menu', children: [
      { id: 'rbac:apply:view', name: '查看', type: 'action' },
      { id: 'rbac:apply:approve', name: '审批', type: 'action' },
    ]},
    { id: 'rbac:log', name: '操作日志', icon: 'file', type: 'menu', children: [
      { id: 'rbac:log:view', name: '查看', type: 'action' },
    ]},
  ]},
  { id: 'settings', name: '系统设置', icon: 'folder', children: [
    { id: 'settings:dimension', name: '配置管理', icon: 'file', type: 'menu', children: [
      { id: 'settings:dimension:view', name: '查看', type: 'action' },
      { id: 'settings:dimension:edit', name: '编辑', type: 'action' },
    ]},
    { id: 'settings:notification', name: '通知设置', icon: 'file', type: 'menu', children: [
      { id: 'settings:notification:view', name: '查看', type: 'action' },
      { id: 'settings:notification:edit', name: '编辑', type: 'action' },
    ]},
  ]},
  { id: 'docs', name: '文档', icon: 'folder', children: [
    { id: 'docs:data-dictionary', name: '数据字典', icon: 'file', type: 'menu', children: [
      { id: 'docs:data-dictionary:view', name: '查看', type: 'action' },
    ]},
    { id: 'docs:user-manual', name: '用户操作手册', icon: 'file', type: 'menu', children: [
      { id: 'docs:user-manual:view', name: '查看', type: 'action' },
    ]},
  ]},
]

const ROLES = [
  { id: 1, name: '超级管理员', desc: '拥有系统所有权限', permissions: ['all'] },
  { id: 2, name: '运维工程师', desc: '负责系统运维、日志管理', permissions: ['rbac:log:view', 'settings:dimension:view', 'settings:notification:view'] },
  { id: 3, name: '财务数据中心', desc: '拥有所有经营仓和数据看板权限', permissions: ['workspace', 'report', 'dashboard', 'docs'] },
  { id: 4, name: '财务BI', desc: '财务部门数据分析师', permissions: ['workspace', 'report:company:view', 'report:ameba:view', 'report:store:view', 'dashboard:self-service-bi:view', 'dashboard:comparison:view'] },
  { id: 5, name: '业务BI', desc: '业务部门数据分析师', permissions: ['workspace', 'report:store:view', 'dashboard:self-service-bi:view'] },
  { id: 6, name: 'IT运维', desc: 'IT部门运维人员', permissions: ['rbac', 'settings', 'docs:user-manual:view'] },
]

const DATA_TABLES = [
  { 
    id: 'ecommerce_daily', 
    name: '店铺经营明细表', 
    description: '电商平台每日运营数据，包含GMV、订单、流量、成本等指标',
    fields: {
      date: { label: '日期', type: 'date', sensitive: false },
      customer: { label: '客户', type: 'string', sensitive: false },
      platform: { label: '平台', type: 'enum', values: ['淘宝', '抖音', '快手'], sensitive: false },
      shopName: { label: '店铺名称', type: 'string', sensitive: false },
      gmv: { label: 'GMV', type: 'number', sensitive: false },
      orders: { label: '订单数', type: 'number', sensitive: false },
      salesCount: { label: '销售件数', type: 'number', sensitive: false },
      refundAmount: { label: '退款金额', type: 'number', sensitive: true },
      refundCount: { label: '退款件数', type: 'number', sensitive: false },
      payUsers: { label: '支付用户数', type: 'number', sensitive: false },
      visitors: { label: '访客数', type: 'number', sensitive: false },
      pageViews: { label: '浏览量', type: 'number', sensitive: false },
      addToCart: { label: '加购次数', type: 'number', sensitive: false },
      favorites: { label: '收藏次数', type: 'number', sensitive: false },
      productCost: { label: '商品成本', type: 'number', sensitive: true },
      adCost: { label: '广告费', type: 'number', sensitive: true },
      platformFee: { label: '平台费用', type: 'number', sensitive: true },
      shippingCost: { label: '运费', type: 'number', sensitive: true },
      otherCost: { label: '其他费用', type: 'number', sensitive: true },
      grossMargin: { label: '毛利率', type: 'percent', sensitive: true },
      netMargin: { label: '净利率', type: 'percent', sensitive: true },
      returnRate: { label: '退货率', type: 'percent', sensitive: false },
      roi: { label: 'ROI', type: 'number', sensitive: true },
      aov: { label: '客单价', type: 'number', sensitive: false },
    }
  },
  { 
    id: 'company_finance', 
    name: '公司财务报表', 
    description: '资产负债表、利润表、现金流量表数据',
    fields: {
      subjectId: { label: '科目编码', type: 'string', sensitive: false },
      subjectName: { label: '科目名称', type: 'string', sensitive: false },
      currentValue: { label: '本期金额', type: 'number', sensitive: true },
      beginValue: { label: '期初金额', type: 'number', sensitive: true },
      budget: { label: '预算金额', type: 'number', sensitive: true },
      variance: { label: '差异', type: 'number', sensitive: true },
    }
  },
  { 
    id: 'ameba_report', 
    name: '阿米巴经营报表', 
    description: '各核算单元收入、成本、利润数据',
    fields: {
      unitId: { label: '核算单元ID', type: 'string', sensitive: false },
      unitName: { label: '核算单元名称', type: 'string', sensitive: false },
      income: { label: '经营收入', type: 'number', sensitive: false },
      directCost: { label: '直接成本', type: 'number', sensitive: true },
      allocatedCost: { label: '分摊成本', type: 'number', sensitive: true },
      profit: { label: '经营利润', type: 'number', sensitive: true },
      profitRatio: { label: '利润率', type: 'percent', sensitive: true },
    }
  },
  { 
    id: 'budget_monitor', 
    name: '预算监控表', 
    description: '各部门/科目预算执行情况',
    fields: {
      department: { label: '部门', type: 'string', sensitive: false },
      subject: { label: '费用科目', type: 'string', sensitive: false },
      budgetAmount: { label: '预算金额', type: 'number', sensitive: true },
      actualAmount: { label: '实际金额', type: 'number', sensitive: true },
      usageRate: { label: '执行率', type: 'percent', sensitive: false },
      variance: { label: '差异', type: 'number', sensitive: true },
    }
  },
]

const ROW_PERMISSION_RULES = [
  { id: 'all', name: '全部数据', description: '不限制，可查看所有行数据', color: 'emerald' },
  // 客户维度
  { id: 'customer_a', name: '客户A数据', description: '仅可查看客户A的数据', filter: { field: 'customer', operator: 'eq', value: '客户A' }, color: 'blue' },
  { id: 'customer_b', name: '客户B数据', description: '仅可查看客户B的数据', filter: { field: 'customer', operator: 'eq', value: '客户B' }, color: 'blue' },
  { id: 'customer_c', name: '客户C数据', description: '仅可查看客户C的数据', filter: { field: 'customer', operator: 'eq', value: '客户C' }, color: 'blue' },
  // 平台维度
  { id: 'platform_taobao', name: '淘宝平台', description: '仅淘宝平台数据', filter: { field: 'platform', operator: 'eq', value: '淘宝' }, color: 'orange' },
  { id: 'platform_douyin', name: '抖音平台', description: '仅抖音平台数据', filter: { field: 'platform', operator: 'eq', value: '抖音' }, color: 'pink' },
  { id: 'platform_kuaishou', name: '快手平台', description: '仅快手平台数据', filter: { field: 'platform', operator: 'eq', value: '快手' }, color: 'red' },
  // 财务指标维度
  { id: 'profit_positive', name: '盈利数据', description: '仅利润>0的数据', filter: { field: 'netMargin', operator: 'gt', value: 0 }, color: 'green' },
  { id: 'gmv_high', name: '高GMV店铺', description: 'GMV超过10万的数据', filter: { field: 'gmv', operator: 'gte', value: 100000 }, color: 'purple' },
  // 部门维度 (针对阿米巴/预算)
  { id: 'dept_ops', name: '运营部数据', description: '仅运营部相关数据', filter: { field: 'department', operator: 'like', value: '运营部' }, color: 'cyan' },
  { id: 'dept_finance', name: '财务部数据', description: '仅财务部相关数据', filter: { field: 'department', operator: 'eq', value: '财务部' }, color: 'indigo' },
]

const COLUMN_PERMISSION_RULES = [
  { id: 'all', name: '全部字段', description: '可查看所有字段，包括敏感数据', color: 'emerald' },
  { id: 'hide_cost', name: '隐藏成本字段', description: '隐藏商品成本、广告费、平台费用、运费、其他费用', hiddenFields: ['productCost', 'adCost', 'platformFee', 'shippingCost', 'otherCost'], color: 'amber' },
  { id: 'hide_profit', name: '隐藏利润字段', description: '隐藏毛利率、净利率、ROI等盈利指标', hiddenFields: ['grossMargin', 'netMargin', 'roi', 'profit', 'profitRatio'], color: 'orange' },
  { id: 'hide_sensitive', name: '隐藏所有敏感字段', description: '隐藏所有标记为敏感的字段', hiddenFields: ['productCost', 'adCost', 'platformFee', 'shippingCost', 'otherCost', 'grossMargin', 'netMargin', 'roi', 'refundAmount', 'profit', 'profitRatio', 'directCost', 'allocatedCost', 'budget', 'budgetAmount', 'actualAmount', 'variance', 'currentValue', 'beginValue'], color: 'red' },
  { id: 'basic_only', name: '仅基础字段', description: '只显示日期、客户、平台、店铺等基础信息', visibleFields: ['date', 'customer', 'platform', 'shopName', 'unitName', 'department', 'subject', 'subjectName'], color: 'gray' },
  { id: 'sales_only', name: '仅销售指标', description: '只显示GMV、订单数、销售件数等销售指标', visibleFields: ['date', 'customer', 'platform', 'shopName', 'gmv', 'orders', 'salesCount', 'aov', 'income'], color: 'blue' },
  { id: 'traffic_only', name: '仅流量指标', description: '只显示访客数、浏览量、加购次数等流量数据', visibleFields: ['date', 'customer', 'platform', 'shopName', 'visitors', 'pageViews', 'addToCart', 'favorites', 'payUsers'], color: 'cyan' },
]

const ROLE_DATA_PERMISSIONS = {
  // 超级管理员 - 所有数据权限
  1: { tables: { 
    ecommerce_daily: { access: true, rowRule: 'all', columnRule: 'all' }, 
    company_finance: { access: true, rowRule: 'all', columnRule: 'all' }, 
    ameba_report: { access: true, rowRule: 'all', columnRule: 'all' },
    budget_monitor: { access: true, rowRule: 'all', columnRule: 'all' }
  } },
  // 运维工程师 - 只能看基础数据
  2: { tables: { 
    ecommerce_daily: { access: true, rowRule: 'all', columnRule: 'basic_only' }
  } },
  // 财务数据中心 - 所有报表全权限
  3: { tables: { 
    ecommerce_daily: { access: true, rowRule: 'all', columnRule: 'all' }, 
    company_finance: { access: true, rowRule: 'all', columnRule: 'all' }, 
    ameba_report: { access: true, rowRule: 'all', columnRule: 'all' },
    budget_monitor: { access: true, rowRule: 'all', columnRule: 'all' }
  } },
  // 财务BI - 可看所有客户，隐藏成本  
  4: { tables: { 
    ecommerce_daily: { access: true, rowRule: 'all', columnRule: 'hide_cost' }, 
    company_finance: { access: true, rowRule: 'all', columnRule: 'all' },
    ameba_report: { access: true, rowRule: 'all', columnRule: 'hide_cost' }
  } },
  // 业务BI - 只看销售和流量指标
  5: { tables: { 
    ecommerce_daily: { access: true, rowRule: 'profit_positive', columnRule: 'sales_only' }
  } },
  // IT运维 - 只看基础字段
  6: { tables: { 
    ecommerce_daily: { access: true, rowRule: 'platform_taobao', columnRule: 'basic_only' },
    budget_monitor: { access: true, rowRule: 'dept_ops', columnRule: 'hide_sensitive' }
  } },
}

// 示例数据（用于预览）
const TABLE_DATA = {
  ecommerce_daily: [
    { date: '2025-06-01', customer: '客户A', platform: '淘宝', shopName: '客户A淘宝1号店', gmv: 8783.98, orders: 115, salesCount: 293, productCost: 3240.32, adCost: 1478.88, grossMargin: 47.92, netMargin: 9.71 },
    { date: '2025-06-01', customer: '客户A', platform: '抖音', shopName: '客户A抖音1号店', gmv: 4708.13, orders: 23, salesCount: 50, productCost: 1796.56, adCost: 919.54, grossMargin: 56.66, netMargin: 25.52 },
    { date: '2025-06-01', customer: '客户B', platform: '快手', shopName: '客户B快手2号店', gmv: 50095.98, orders: 257, salesCount: 726, productCost: 15575.28, adCost: 8862.12, grossMargin: 61.64, netMargin: 34.58 },
    { date: '2025-06-01', customer: '客户C', platform: '淘宝', shopName: '客户C淘宝1号店', gmv: 13498.85, orders: 58, salesCount: 78, productCost: 6904.91, adCost: 2109.49, grossMargin: 30.97, netMargin: 5.55 },
  ],
  company_finance: [
    { subjectId: 'A01', subjectName: '资产总计', currentValue: 58420000, beginValue: 55200000, budget: 60000000, variance: -1580000 },
    { subjectId: 'L01', subjectName: '负债合计', currentValue: 21300000, beginValue: 20500000, budget: 20000000, variance: 1300000 },
    { subjectId: 'P01', subjectName: '净利润', currentValue: 10537500, beginValue: 9675000, budget: 12000000, variance: -1462500 },
  ],
  ameba_report: [
    { unitId: 'OP-TB', unitName: '运营部-淘宝', income: 2850000, directCost: 1420000, allocatedCost: 380000, profit: 1050000, profitRatio: 36.8 },
    { unitId: 'OP-DY', unitName: '运营部-抖音', income: 1920000, directCost: 980000, allocatedCost: 290000, profit: 650000, profitRatio: 33.9 },
    { unitId: 'OP-KS', unitName: '运营部-快手', income: 1580000, directCost: 820000, allocatedCost: 240000, profit: 520000, profitRatio: 32.9 },
  ],
  budget_monitor: [
    { department: '运营部-淘宝', subject: '广告费', budgetAmount: 5000000, actualAmount: 4200000, usageRate: 84, variance: -800000 },
    { department: '运营部-抖音', subject: '广告费', budgetAmount: 3500000, actualAmount: 3800000, usageRate: 108.6, variance: 300000 },
    { department: '财务部', subject: '人工成本', budgetAmount: 2000000, actualAmount: 1850000, usageRate: 92.5, variance: -150000 },
  ]
}

// --- 状态 ---
const activeTab = ref('function')
const selectedRole = ref(ROLES[0])
const expandedNodes = ref(['report', 'workspace', 'rbac', 'config'])
const searchText = ref('')
const selectedTable = ref(null)

const permissionTree = ref(PERMISSION_TREE)
const roles = ref(ROLES)
const tables = ref(DATA_TABLES)
const rowRules = ref(ROW_PERMISSION_RULES)
const columnRules = ref(COLUMN_PERMISSION_RULES)
const roleDataPerms = ref(ROLE_DATA_PERMISSIONS)
const tableData = ref(TABLE_DATA)

// --- 计算属性 ---
const currentRoleDataPerm = computed(() => roleDataPerms.value[selectedRole.value.id] || { tables: {} })
const isAllExpanded = computed(() => expandedNodes.value.length > 5)

// --- 方法 ---
const handleRoleSelect = (role) => {
  selectedRole.value = role
  selectedTable.value = null
}

const toggleExpand = (id) => {
  if (expandedNodes.value.includes(id)) {
    expandedNodes.value = expandedNodes.value.filter(n => n !== id)
  } else {
    expandedNodes.value.push(id)
  }
}

const toggleAllNodes = () => {
  if (isAllExpanded.value) {
    expandedNodes.value = []
  } else {
    const getAllIds = (nodes) => {
      let ids = []
      nodes.forEach(n => {
        ids.push(n.id)
        if (n.children) ids = ids.concat(getAllIds(n.children))
      })
      return ids
    }
    expandedNodes.value = getAllIds(permissionTree.value)
  }
}

const hasPermission = (nodeId) => {
  if (selectedRole.value.permissions.includes('all')) return true
  return selectedRole.value.permissions.includes(nodeId)
}

const hasAnyChildPermission = (node) => {
  if (selectedRole.value.permissions.includes('all')) return true
  if (hasPermission(node.id)) return true
  if (node.children) return node.children.some(child => hasAnyChildPermission(child))
  return false
}

const hasTableAccess = (tableId) => {
  const perm = currentRoleDataPerm.value.tables[tableId]
  return perm && perm.access
}

const getRowRuleName = (tableId) => {
  const perm = currentRoleDataPerm.value.tables[tableId]
  if (!perm) return '-'
  const rule = rowRules.value.find(r => r.id === perm.rowRule)
  return rule ? rule.name : '全部'
}

const getColRuleName = (tableId) => {
  const perm = currentRoleDataPerm.value.tables[tableId]
  if (!perm) return '-'
  const rule = columnRules.value.find(r => r.id === perm.columnRule)
  return rule ? rule.name : '全部'
}

const getVisibleColumns = (tableId) => {
  const tablePerm = currentRoleDataPerm.value.tables[tableId]
  if (!tablePerm || !tablePerm.access) return []
  const table = tables.value.find(t => t.id === tableId)
  if (!table) return []
  
  const allFields = Object.keys(table.fields)
  if (tablePerm.columnRule === 'all') return allFields
  if (tablePerm.columnRule === 'hide_sensitive') {
    return allFields.filter(f => !table.fields[f].sensitive)
  }
  if (tablePerm.columnRule === 'basic_only') {
    return allFields.filter(f => table.fields[f].type === 'string')
  }
  return allFields
}

const isColumnVisible = (tableId, fieldId) => {
  return getVisibleColumns(tableId).includes(fieldId)
}

const getFilteredData = (tableId) => {
  const tablePerm = currentRoleDataPerm.value.tables[tableId]
  if (!tablePerm || !tablePerm.access) return []
  const data = tableData.value[tableId] || []
  if (tablePerm.rowRule === 'all' || !tablePerm.rowRule) return data
  
  const rule = rowRules.value.find(r => r.id === tablePerm.rowRule)
  if (!rule || !rule.filter) return data
  
  const { field, operator, value } = rule.filter
  return data.filter(row => {
    if (operator === 'eq') return row[field] === value
    if (operator === 'gt') return row[field] > value
    if (operator === 'lt') return row[field] < value
    return true
  })
}

const getTableById = (id) => tables.value.find(t => t.id === id)

const getCurrentRowRuleFilter = (tableId) => {
  const perm = currentRoleDataPerm.value.tables[tableId]
  if(!perm) return null
  const rule = rowRules.value.find(r => r.id === perm.rowRule)
  return rule && rule.filter ? rule : null
}

const getFilterDisplay = (tableId) => {
  const rule = getCurrentRowRuleFilter(tableId)
  if(!rule) return ''
  const table = getTableById(tableId)
  const label = table.fields[rule.filter.field]?.label || rule.filter.field
  const op = rule.filter.operator === 'eq' ? ' = ' : rule.filter.operator === 'gt' ? ' > ' : ' < '
  return `${label}${op}"${rule.filter.value}"`
}

const matchSearch = (node) => {
  if (!searchText.value) return true
  if (node.name.includes(searchText.value) || node.id.includes(searchText.value)) return true
  if (node.children) return node.children.some(c => matchSearch(c))
  return false
}
</script>

<template>
  <div class="h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
    <!-- Teleport Tabs 到面包屑区域 -->
    <Teleport to="#breadcrumb-actions" defer>
      <Tabs v-model:model-value="activeTab" class="w-auto">
        <TabsList>
          <TabsTrigger value="function">功能权限</TabsTrigger>
          <TabsTrigger value="data">数据权限</TabsTrigger>
        </TabsList>
      </Tabs>
    </Teleport>
    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Sidebar: Role List -->
      <div class="w-72 border-r bg-muted/30 flex flex-col">
        <div class="p-4 border-b flex items-center justify-between">
          <h3 class="font-semibold">角色列表</h3>
          <span class="text-xs text-muted-foreground">点击查看详情</span>
        </div>
        <div class="flex-1 scrollbar-hidden-auto">
          <div class="p-2 space-y-1">
            <div
              v-for="role in roles"
              :key="role.id"
              class="p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 border-l-2"
              :class="selectedRole.id === role.id 
                ? 'bg-primary/10 border-l-primary' 
                : 'bg-transparent border-l-transparent hover:bg-muted'"
              @click="handleRoleSelect(role)"
            >
              <Avatar class="h-9 w-9">
                <AvatarFallback 
                  :class="selectedRole.id === role.id ? 'bg-primary text-white' : 'bg-muted'"
                  class="text-sm font-medium"
                >
                  {{ role.name[0] }}
                </AvatarFallback>
              </Avatar>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">{{ role.name }}</div>
                <div class="text-xs text-muted-foreground truncate">{{ role.desc }}</div>
              </div>
              <div class="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock class="h-3.5 w-3.5" />
                <span>{{ role.permissions.includes('all') ? 'All' : role.permissions.length }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Content -->
      <div class="flex-1 flex flex-col overflow-auto bg-white dark:bg-slate-950">
        <!-- 功能权限视图 -->
        <template v-if="activeTab === 'function'">
          <div class="p-4 border-b flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-semibold">功能菜单授权</span>
              <Badge variant="outline">{{ selectedRole.name }}</Badge>
            </div>
            <div class="flex items-center gap-3">
              <div class="relative w-60">
                <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  v-model="searchText"
                  type="search" 
                  placeholder="过滤菜单节点" 
                  class="pl-9 h-9"
                />
              </div>
              <Button variant="outline" size="sm" @click="toggleAllNodes">
                <Expand class="mr-2 h-4 w-4" />
                {{ isAllExpanded ? '折叠全部' : '展开全部' }}
              </Button>
            </div>
          </div>
          
          <div class="flex-1 overflow-auto p-6">
            <div v-if="selectedRole.permissions.includes('all')" class="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p class="text-amber-700 text-sm">
                当前角色拥有 <b>超级管理员</b> 权限，默认拥有所有功能访问权，无需单独配置。
              </p>
            </div>
            
            <div class="border rounded-lg bg-white p-2 space-y-1">
              <template v-for="group in permissionTree" :key="group.id">
                <template v-if="matchSearch(group)">
                  <div 
                    class="flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted"
                    :class="hasAnyChildPermission(group) ? 'text-foreground' : 'text-muted-foreground/60'"
                    @click="toggleExpand(group.id)"
                  >
                    <component :is="expandedNodes.includes(group.id) ? ChevronDown : ChevronRight" class="h-4 w-4" />
                    <Folder class="h-4 w-4 text-amber-500" />
                    <span class="font-medium">{{ group.name }}</span>
                  </div>
                  
                  <template v-if="expandedNodes.includes(group.id) && group.children">
                    <div class="ml-6 space-y-1">
                      <template v-for="item in group.children" :key="item.id">
                        <template v-if="matchSearch(item)">
                          <div 
                            class="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors"
                            :class="[
                              hasPermission(item.id) ? 'text-primary' : 'text-muted-foreground/60',
                              item.children ? 'hover:bg-muted' : ''
                            ]"
                            @click="item.children && toggleExpand(item.id)"
                          >
                            <component 
                              v-if="item.children" 
                              :is="expandedNodes.includes(item.id) ? ChevronDown : ChevronRight" 
                              class="h-4 w-4" 
                            />
                            <span v-else class="w-4"></span>
                            
                            <div 
                              v-if="!item.children"
                              class="w-4 h-4 rounded border flex items-center justify-center"
                              :class="hasPermission(item.id) ? 'bg-primary border-primary' : 'border-muted-foreground/30'"
                            >
                              <Check v-if="hasPermission(item.id)" class="h-3 w-3 text-white" />
                            </div>
                            
                            <File class="h-4 w-4 text-muted-foreground" />
                            <span class="text-sm">{{ item.name }}</span>
                            
                            <Badge v-if="item.type === 'menu'" variant="outline" class="ml-auto text-xs">菜单</Badge>
                          </div>
                          
                          <template v-if="expandedNodes.includes(item.id) && item.children">
                            <div class="ml-10 flex flex-wrap gap-2 py-2">
                              <div 
                                v-for="action in item.children" 
                                :key="action.id"
                                class="flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs transition-colors"
                                :class="hasPermission(action.id) 
                                  ? 'bg-primary/10 border-primary text-primary' 
                                  : 'border-muted-foreground/30 text-muted-foreground/60'"
                              >
                                <div 
                                  class="w-3 h-3 rounded border flex items-center justify-center"
                                  :class="hasPermission(action.id) ? 'bg-primary border-primary' : 'border-muted-foreground/30'"
                                >
                                  <Check v-if="hasPermission(action.id)" class="h-2 w-2 text-white" />
                                </div>
                                {{ action.name }}
                              </div>
                            </div>
                          </template>
                        </template>
                      </template>
                    </div>
                  </template>
                </template>
              </template>
            </div>
          </div>
        </template>
        
        <!-- 数据权限视图 -->
        <template v-else>
          <div class="flex-1 flex overflow-hidden">
            <!-- 数据表列表 -->
            <div class="w-60 border-r bg-muted/30 flex flex-col">
              <div class="p-3 border-b text-xs font-medium text-muted-foreground uppercase tracking-wider">
                数据资源列表
              </div>
              <ScrollArea class="flex-1">
                <div 
                  v-for="table in tables" 
                  :key="table.id"
                  class="p-3 border-b cursor-pointer flex items-center gap-3 transition-colors"
                  :class="{
                    'bg-white border-l-2 border-l-primary': selectedTable === table.id && hasTableAccess(table.id),
                    'opacity-50 cursor-not-allowed': !hasTableAccess(table.id),
                    'hover:bg-muted': hasTableAccess(table.id)
                  }"
                  @click="hasTableAccess(table.id) && (selectedTable = table.id)"
                >
                  <div 
                    class="w-2 h-2 rounded-full"
                    :class="hasTableAccess(table.id) ? 'bg-green-500' : 'bg-muted-foreground/30'"
                  ></div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">{{ table.name }}</div>
                    <div class="text-xs text-muted-foreground font-mono">{{ table.id }}</div>
                  </div>
                  <Lock v-if="!hasTableAccess(table.id)" class="h-4 w-4 text-muted-foreground" />
                </div>
              </ScrollArea>
            </div>
            
            <!-- 数据表详情 -->
            <div class="flex-1 overflow-hidden">
              <div v-if="!selectedTable" class="h-full flex items-center justify-center">
                <div class="text-center text-muted-foreground">
                  <Database class="h-12 w-12 mx-auto opacity-30 mb-4" />
                  <p>请从左侧选择一个数据表查看权限详情</p>
                </div>
              </div>
              
              <div v-else class="h-full overflow-auto p-6 space-y-6">
                <!-- 头部统计 -->
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="text-xl font-bold">{{ getTableById(selectedTable)?.name }}</h3>
                    <p class="text-sm text-muted-foreground">
                      行数: {{ (tableData[selectedTable] || []).length }} · 
                      列数: {{ Object.keys(getTableById(selectedTable)?.fields || {}).length }}
                    </p>
                  </div>
                  <div class="flex items-center gap-6 p-3 bg-muted/50 rounded-lg">
                    <div class="text-center">
                      <div class="text-xs text-muted-foreground mb-1">行级规则</div>
                      <div class="font-semibold text-primary">{{ getRowRuleName(selectedTable) }}</div>
                    </div>
                    <div class="h-8 w-px bg-border"></div>
                    <div class="text-center">
                      <div class="text-xs text-muted-foreground mb-1">列级规则</div>
                      <div class="font-semibold text-green-600">{{ getColRuleName(selectedTable) }}</div>
                    </div>
                  </div>
                </div>
                
                <!-- 过滤条件 -->
                <div 
                  v-if="getCurrentRowRuleFilter(selectedTable)" 
                  class="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-2 text-sm"
                >
                  <Filter class="h-4 w-4 text-primary" />
                  <span class="text-muted-foreground">当前行级过滤条件：</span>
                  <code class="bg-primary/10 px-2 py-0.5 rounded font-mono text-primary">
                    {{ getFilterDisplay(selectedTable) }}
                  </code>
                </div>
                
                <!-- 字段权限 -->
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h4 class="font-semibold border-l-2 border-primary pl-3">字段可见性</h4>
                    <div class="flex items-center gap-4 text-xs text-muted-foreground">
                      <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-green-500"></span>可见</span>
                      <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500"></span>敏感</span>
                      <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-muted-foreground/30"></span>隐藏</span>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-3 p-4 bg-muted/50 rounded-lg">
                    <div 
                      v-for="(field, fieldId) in getTableById(selectedTable)?.fields" 
                      :key="fieldId"
                      class="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm"
                      :class="isColumnVisible(selectedTable, fieldId) 
                        ? (field.sensitive ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-green-50 border-green-200 text-green-700')
                        : 'bg-muted border-muted-foreground/20 text-muted-foreground'"
                    >
                      <component 
                        :is="!isColumnVisible(selectedTable, fieldId) ? X : (field.sensitive ? EyeOff : Eye)" 
                        class="h-3.5 w-3.5" 
                      />
                      {{ field.label }}
                    </div>
                  </div>
                </div>
                
                <!-- 数据预览 -->
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h4 class="font-semibold border-l-2 border-primary pl-3">数据预览 (Top 10)</h4>
                    <Badge variant="outline">模拟数据</Badge>
                  </div>
                  <div class="border rounded-lg overflow-x-auto">
                    <Table class="min-w-max">
                      <TableHeader>
                        <TableRow>
                          <TableHead 
                            v-for="(field, fieldId) in getTableById(selectedTable)?.fields" 
                            :key="fieldId"
                            class="whitespace-nowrap"
                          >
                            {{ field.label }}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow v-for="(row, idx) in getFilteredData(selectedTable).slice(0, 10)" :key="idx">
                          <TableCell 
                            v-for="(field, fieldId) in getTableById(selectedTable)?.fields" 
                            :key="fieldId"
                            class="whitespace-nowrap"
                          >
                            <span 
                              v-if="isColumnVisible(selectedTable, fieldId)"
                              :class="field.sensitive ? 'text-amber-600' : ''"
                            >
                              {{ typeof row[fieldId] === 'number' ? row[fieldId].toLocaleString() : row[fieldId] }}
                            </span>
                            <span v-else class="text-muted-foreground tracking-wider">******</span>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
