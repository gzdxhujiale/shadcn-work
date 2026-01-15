

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
    defaultValue?: string | any | undefined
    visible?: boolean
}

/**
 * 筛选区布局配置
 */
export interface FilterAreaConfig {
    show?: boolean     // 是否显示筛选区
    columns: number    // 每行显示的筛选项数量
    gap: string        // 筛选项之间的间距
    filters: FilterConfig[]
}

/**
 * 卡片项配置
 */
export interface CardItemConfig {
    key: string
    title: string      // 卡片标题
    data: string | number  // 卡片数据
}

/**
 * 卡片区配置
 */
export interface CardAreaConfig {
    show: boolean           // 是否显示卡片区
    columns: number         // 每行显示的卡片数量
    gap: string             // 卡片之间的间距
    cardHeight?: string     // 卡片高度
    cardWidth?: string      // 卡片宽度
    cards: CardItemConfig[] // 卡片列表
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
    show?: boolean          // 是否显示表格区
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
 * 操作区配置
 */
export interface ActionsAreaConfig {
    show?: boolean                  // 是否显示操作区
    buttons: ActionButtonConfig[]   // 操作按钮列表
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
    // 操作区配置（可选）
    actionsArea?: ActionsAreaConfig
    // 卡片区配置（可选）
    cardArea?: CardAreaConfig
    // 表格区配置
    tableArea: TableAreaConfig
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
// 默认配置已移除 - 使用云端配置
// ============================================

// 注意：page1Configs 现在在 configStore 中初始化为空对象
// 配置从 Supabase 云端加载

