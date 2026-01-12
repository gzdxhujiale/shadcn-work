import type { DateRange } from 'radix-vue'

// ============================================
// 类型定义
// ============================================

/**
 * 树形选择节点类型
 */
export interface TreeNode {
    value: string
    label: string
    children?: TreeNode[]
}

/**
 * 筛选项配置
 */
export interface FilterConfig {
    key: string
    type: 'input' | 'select' | 'date-range' | 'tree-select'
    label: string
    placeholder?: string
    options?: string[]
    treeOptions?: TreeNode[]
    defaultValue?: string | DateRange | undefined
    visible?: boolean
}

/**
 * 筛选区布局配置
 */
export interface FilterAreaConfig {
    columns: number    // 每行显示的筛选项数量
    gap: string        // 筛选项之间的间距
    filters: FilterConfig[]
}

/**
 * 表格列配置
 */
export interface TableColumn {
    key: string
    label: string
    width?: string                    // 列宽，如 '100px'
    minWidth?: string                 // 最小宽度
    type?: 'text' | 'badge' | 'status-badge'
    fixed?: 'left' | 'right'          // 列固定位置
    visible?: boolean
}

/**
 * 表格区配置
 */
export interface TableAreaConfig {
    height?: string         // 表格容器高度
    scrollX?: boolean       // 是否启用横向滚动
    scrollY?: boolean       // 是否启用纵向滚动
    showCheckbox?: boolean  // 是否显示复选框列
    fixedLayout?: boolean   // 是否使用固定布局
    columns: TableColumn[]
}

/**
 * 操作按钮配置
 */
export interface ActionButtonConfig {
    key: string
    label: string
    variant?: 'default' | 'outline' | 'secondary' | 'ghost'
    className?: string       // 自定义样式类
    visible?: boolean
}

/**
 * Page1 模板完整配置
 */
export interface Page1Config {
    // 顶部栏选项（可选）
    topBar?: {
        appOptions?: string[]
        langOptions?: string[]
    }
    // 筛选区配置
    filterArea: FilterAreaConfig
    // 表格区配置
    tableArea: TableAreaConfig
    // 操作按钮配置
    actions?: ActionButtonConfig[]
    // 模拟数据生成函数
    mockData: () => any[]
}

// ============================================
// 公共选项常量
// ============================================

export const COMMON_OPTIONS = {
    YES_NO: ['全部', '是', '否'],
    APP: ['SoulChill', 'TikTok', 'Bigo Live', 'Likee'],
    LANG: ['中文', 'English', 'Español', 'العربية'],
}

// ============================================
// 按导航 ID 索引的页面配置
// ============================================

export const page1Configs: Record<string, Page1Config> = {
    // ID: '1'
    '1': {
        topBar: {
            appOptions: COMMON_OPTIONS.APP,
            langOptions: COMMON_OPTIONS.LANG,
        },
        filterArea: {
            columns: 4,
            gap: '16px',
            filters: [
                { key: 'userId', type: 'input', label: '用户ID', placeholder: '请输入用户ID', defaultValue: '' },
                { key: 'platformOrderNo', type: 'input', label: '平台订单号', placeholder: '请输入平台订单号', defaultValue: '' },
                { key: 'businessNo', type: 'input', label: '业务单号', placeholder: '请输入业务单号', defaultValue: '' },
                { key: 'channelNo', type: 'input', label: '渠道单号', placeholder: '请输入渠道单号', defaultValue: '' },
                {
                    key: 'orderStatus', type: 'select', label: '订单状态', defaultValue: '',
                    options: ['全部', '待审核', '审核中']
                },
                {
                    key: 'platformOrder', type: 'select', label: '平台订单号', defaultValue: '全部',
                    options: ['全部', 'PO001', 'PO002', 'PO003']
                },
                {
                    key: 'accountType', type: 'select', label: '账户类型', defaultValue: '全部',
                    options: ['全部', '支付宝', '微信', '银行卡', 'PayPal', 'Payoneer']
                },
                {
                    key: 'country', type: 'tree-select', label: '国家-渠道', defaultValue: '',
                    treeOptions: [
                        {
                            value: "egypt",
                            label: "埃及",
                            children: [
                                {
                                    value: "egypt-airwallex",
                                    label: "airwallex"
                                },
                                {
                                    value: "egypt-payoneer",
                                    label: "payoneer"
                                },
                                {
                                    value: "egypt-payermax",
                                    label: "payermax"
                                },
                                {
                                    value: "egypt-dlocal",
                                    label: "dlocal（2026.1.6下线）"
                                }
                            ]
                        },
                        {
                            value: "morocco",
                            label: "摩洛哥",
                            children: [
                                {
                                    value: "morocco-dlocal",
                                    label: "dlocal"
                                },
                                {
                                    value: "morocco-payoneer",
                                    label: "payoneer"
                                }
                            ]
                        },
                        {
                            value: "turkey",
                            label: "土耳其",
                            children: [
                                {
                                    value: "turkey-dlocal",
                                    label: "dlocal"
                                },
                                {
                                    value: "turkey-airwallex",
                                    label: "airwallex"
                                },
                                {
                                    value: "turkey-payoneer",
                                    label: "payoneer"
                                }
                            ]
                        },
                        {
                            value: "algeria",
                            label: "阿尔及利亚",
                            children: [
                                {
                                    value: "algeria-dlocal",
                                    label: "dlocal"
                                },
                                {
                                    value: "algeria-payoneer",
                                    label: "payoneer"
                                }
                            ]
                        },
                        {
                            value: "jordan",
                            label: "约旦",
                            children: [
                                {
                                    value: "jordan-dlocal",
                                    label: "dlocal"
                                },
                                {
                                    value: "jordan-payoneer",
                                    label: "payoneer"
                                }
                            ]
                        },
                        {
                            value: "thailand",
                            label: "泰国",
                            children: [
                                {
                                    value: "thailand-airwallex",
                                    label: "airwallex"
                                },
                                {
                                    value: "thailand-payoneer",
                                    label: "payoneer"
                                }
                            ]
                        },
                        {
                            value: "saudi-arabia",
                            label: "沙特",
                            children: []
                        }
                    ]
                },
                {
                    key: 'region', type: 'select', label: '大区', defaultValue: '全部',
                    options: ['全部', '华东', '华南', '华北', '华中']
                },
                {
                    key: 'largeWithdraw', type: 'select', label: '大额提现单', defaultValue: '全部',
                    options: ['全部', '是', '否']
                },
                {
                    key: 'projectType', type: 'select', label: '项目类型', defaultValue: '全部',
                    options: ['全部', '直播', '短视频', '游戏', '电商']
                },
                { key: 'applyTime', type: 'date-range', label: '申请时间', defaultValue: undefined },
                { key: 'completeTime', type: 'date-range', label: '完成时间', defaultValue: undefined },
            ],
        },
        tableArea: {
            height: '500px',
            scrollX: true,
            scrollY: true,
            showCheckbox: true,
            fixedLayout: true,
            columns: [
                { key: 'app', label: '应用', width: '100px', type: 'badge' },
                { key: 'orderNo', label: '订单号', width: '100px' },
                { key: 'statusText', label: '订单状态', width: '100px', type: 'status-badge' },
                { key: 'userName', label: '用户信息', width: '100px' },
                { key: 'guildName', label: '公会信息', width: '120px' },
                { key: 'deviceModel', label: '用户设备信息', width: '150px' },
            ],
        },
        actions: [
            { key: 'search', label: '查询', variant: 'outline' },
            { key: 'export', label: '导出', variant: 'outline' },
            {
                key: 'batchApprove', label: '批量运营审核通过', variant: 'secondary',
                className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            },
            {
                key: 'batchReject', label: '批量运营审核不通过', variant: 'secondary',
                className: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            },
            {
                key: 'batchRiskReview', label: '离线提现批量风控审核', variant: 'secondary',
                className: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            },
        ],
        mockData: () => {
            // TODO: 实现模拟数据生成
            return []
        },
    },
    // ID: '2'
    '2': {
        filterArea: {
            columns: 4,
            gap: '16px',
            filters: [
            ],
        },
        tableArea: {
            height: '500px',
            scrollX: true,
            scrollY: true,
            showCheckbox: true,
            columns: [
            ],
        },
        mockData: () => {
            // TODO: 实现模拟数据生成
            return []
        },
    },
}

/**
 * 获取指定导航 ID 的页面配置
 */
export function getPage1Config(navId: string): Page1Config | undefined {
    return page1Configs[navId]
}
