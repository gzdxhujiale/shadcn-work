import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { setNavGroupsRef, initNavigation } from '@/config/sidebar'
// 移除默认配置导入 - 改用纯云端配置
import { supabase } from '@/lib/supabase'
import { toast } from 'vue-sonner'

// ============================================
// 导航配置类型定义
// ============================================

import type {
    NavGroup,
    NavMainItem,
    NavSubItem
} from '@/config/sidebar'
import type {
    Page1Config,
    FilterAreaConfig,
    FilterConfig,
    TableAreaConfig,
    TableColumn,
    ActionButtonConfig,
    ActionsAreaConfig,
    TreeNode,
    CardAreaConfig,
    CardItemConfig
} from '@/config/page1'

// Re-export types for convenience if needed, or components should import from config files directly.
// For now, let's export them so existing imports in components don't break.
export type {
    NavGroup,
    NavMainItem,
    NavSubItem,
    Page1Config,
    FilterAreaConfig,
    FilterConfig,
    TableAreaConfig,
    TableColumn,
    ActionButtonConfig,
    ActionsAreaConfig,
    TreeNode,
    CardAreaConfig,
    CardItemConfig
}

// ============================================
// LocalStorage Keys
// ============================================
const STORAGE_KEY_PAGE1_CONFIGS = 'shadcn_page1_configs'

// ============================================
// Helper: Save to localStorage
// ============================================
function savePage1ConfigsToStorage(configs: Record<string, Page1Config>) {
    try {
        localStorage.setItem(STORAGE_KEY_PAGE1_CONFIGS, JSON.stringify(configs))
    } catch (e) {
        console.warn('Failed to save page1Configs to localStorage:', e)
    }
}

// ============================================
// Config Store
// ============================================

export const useConfigStore = defineStore('config', () => {
    // ============================================
    // State - 初始化为空，等待云端配置加载
    // ============================================
    const navGroups = ref<NavGroup[]>([])
    const page1Configs = ref<Record<string, Page1Config>>({})
    const mockDataFunctions = ref<Record<string, () => any[]>>({})

    // 预览模式状态
    const previewMode = ref<'append' | 'override' | null>(null)
    const previewConfig = ref<Page1Config | null>(null)
    const previewNavId = ref('preview-temp-id')

    // 加载状态
    const isConfigLoaded = ref(false)
    const isConfigLoading = ref(false)

    // 监听配置变化，自动保存到 localStorage（仅在配置已加载后）
    watch(page1Configs, (newConfigs) => {
        if (isConfigLoaded.value) {
            savePage1ConfigsToStorage(newConfigs)
        }
    }, { deep: true })

    // 同步 navGroups 到 sidebar 导航系统（用于模板查找）
    watch(navGroups, (newNavGroups) => {
        setNavGroupsRef(newNavGroups)
    }, { deep: true, immediate: true })

    // Getters
    const isInPreviewMode = computed(() => previewMode.value !== null)

    const effectiveNavGroups = computed(() => {
        if (!isInPreviewMode.value || !previewConfig.value) {
            return navGroups.value
        }

        const previewItem: NavMainItem = {
            id: 'preview-main',
            title: 'AI 预览',
            url: '#', // 添加必要的 url 属性
            isOpen: true,
            items: [{
                id: previewNavId.value,
                title: '预览页面',
                url: '#/preview',
                template: 'Page1',
                component: previewConfig.value
            }]
        }

        if (previewMode.value === 'override') {
            return [{
                label: '预览',
                items: [previewItem]
            }]
        } else {
            return [...navGroups.value, {
                label: 'AI 预览',
                showLabel: true,
                items: [previewItem]
            }]
        }
    })

    const getNavGroup = computed(() => (index: number) => effectiveNavGroups.value[index])

    const getPage1Config = computed(() => (navId: string): Page1Config | undefined => {
        // 优先检查预览模式
        if (isInPreviewMode.value && navId === previewNavId.value && previewConfig.value) {
            return {
                ...previewConfig.value,
                mockData: () => [] // 预览模式通常不需要 mock 数据或使用默认空数组
            }
        }

        const config = page1Configs.value[navId]
        if (config) {
            return {
                ...config,
                mockData: mockDataFunctions.value[navId] || (() => [])
            }
        }
        return undefined
    })

    // Preview Actions
    function setPreviewConfig(config: Page1Config, mode: 'append' | 'override' = 'override') {
        previewConfig.value = config
        previewMode.value = mode
        // 如果是 override 模式，可能需要重定向到预览页面
    }

    function clearPreviewConfig() {
        previewMode.value = null
        previewConfig.value = null
    }

    function applyPreviewConfig() {
        // TODO: 实现根据预览配置更新实际配置的逻辑
        // 这可能需要一个新的 actions 支持，或者只是提示用户
        console.log('Applying preview config is not fully implemented yet')
    }

    // ============================================
    // Navigation CRUD Actions
    // ============================================

    // 添加主导航项
    function addNavMainItem(groupIndex: number, item: Omit<NavMainItem, 'id'>) {
        const group = navGroups.value[groupIndex]
        if (group) {
            const newId = `nav-${Date.now()}`
            group.items.push({ ...item, id: newId, items: [] })
        }
    }

    // 更新主导航项
    function updateNavMainItem(groupIndex: number, itemId: string, updates: Partial<NavMainItem>) {
        const group = navGroups.value[groupIndex]
        if (group) {
            const item = group.items.find(i => i.id === itemId)
            if (item) {
                Object.assign(item, updates)
            }
        }
    }

    // 删除主导航项
    function deleteNavMainItem(groupIndex: number, itemId: string) {
        const group = navGroups.value[groupIndex]
        if (group) {
            const index = group.items.findIndex(i => i.id === itemId)
            if (index > -1) {
                group.items.splice(index, 1)
            }
        }
    }

    // 添加子导航项
    function addSubNavItem(groupIndex: number, mainItemId: string, item: Omit<NavSubItem, 'id'>) {
        const group = navGroups.value[groupIndex]
        if (group) {
            const mainItem = group.items.find(i => i.id === mainItemId)
            if (mainItem) {
                if (!mainItem.items) mainItem.items = []
                const newId = `sub-${Date.now()}`
                mainItem.items.push({ ...item, id: newId })
            }
        }
    }

    // 更新子导航项
    function updateSubNavItem(groupIndex: number, mainItemId: string, subItemId: string, updates: Partial<NavSubItem>) {
        const group = navGroups.value[groupIndex]
        if (group) {
            const mainItem = group.items.find(i => i.id === mainItemId)
            if (mainItem?.items) {
                const subItem = mainItem.items.find(s => s.id === subItemId)
                if (subItem) {
                    Object.assign(subItem, updates)
                }
            }
        }
    }

    // 删除子导航项
    function deleteSubNavItem(groupIndex: number, mainItemId: string, subItemId: string) {
        const group = navGroups.value[groupIndex]
        if (group) {
            const mainItem = group.items.find(i => i.id === mainItemId)
            if (mainItem?.items) {
                const index = mainItem.items.findIndex(s => s.id === subItemId)
                if (index > -1) {
                    mainItem.items.splice(index, 1)
                }
            }
        }
    }

    // ============================================
    // Page1 Config CRUD Actions
    // ============================================

    // 添加 Page1 配置
    function addPage1Config(navId: string, config: Omit<Page1Config, 'mockData'>) {
        page1Configs.value[navId] = config as Page1Config
        mockDataFunctions.value[navId] = () => []

        // 自动将对应导航项的 component 字段设置为配置对象 (Update for Phase 2)
        for (const group of navGroups.value) {
            for (const mainItem of group.items) {
                const subItem = mainItem.items?.find(s => s.id === navId)
                if (subItem) {
                    subItem.component = config as Page1Config
                    // subItem.template = 'Page1' 
                }
            }
        }
    }

    // 更新 Page1 配置
    function updatePage1Config(navId: string, updates: Partial<Page1Config>) {
        if (page1Configs.value[navId]) {
            Object.assign(page1Configs.value[navId], updates)
        }
    }

    // 删除 Page1 配置
    function deletePage1Config(navId: string) {
        delete page1Configs.value[navId]
        delete mockDataFunctions.value[navId]

        // 自动移除对应导航项的 template
        for (const group of navGroups.value) {
            for (const mainItem of group.items) {
                const subItem = mainItem.items?.find(s => s.id === navId)
                if (subItem) {
                    subItem.template = ''
                }
            }
        }
    }

    // 更新筛选区配置
    function updateFilterAreaConfig(navId: string, updates: Partial<FilterAreaConfig>) {
        if (page1Configs.value[navId]) {
            Object.assign(page1Configs.value[navId].filterArea, updates)
        }
    }

    // 更新表格区配置
    function updateTableAreaConfig(navId: string, updates: Partial<TableAreaConfig>) {
        if (page1Configs.value[navId]) {
            Object.assign(page1Configs.value[navId].tableArea, updates)
        }
    }

    // ============================================
    // 重置配置（清空本地配置）
    // ============================================
    function resetToDefaults() {
        // 清空配置
        navGroups.value = []
        page1Configs.value = {}
        mockDataFunctions.value = {}
        isConfigLoaded.value = false
        localStorage.removeItem(STORAGE_KEY_PAGE1_CONFIGS)
    }

    // ============================================
    // 保存配置到源码文件 (仅开发环境)
    // ============================================
    async function saveToSourceFile(): Promise<boolean> {
        // 并行保存两份配置
        const [page1Success, sidebarSuccess] = await Promise.all([
            savePage1Config(),
            syncSidebarConfig()
        ])
        return page1Success && sidebarSuccess
    }

    // 读取源码文件内容
    async function readSourceFile(filename: string): Promise<string | null> {
        try {
            // 添加时间戳防止缓存
            const response = await fetch(`/__api/write-config?filename=${filename}&t=${Date.now()}`)
            if (response.ok) {
                const data = await response.json()
                return data.content
            }
        } catch (e) {
            console.error(`Failed to read ${filename}:`, e)
        }
        return null
    }

    // 辅助函数：查找匹配的括号
    function findBalancedBlock(text: string, startIndex: number): { start: number, end: number, content: string } | null {
        let balance = 0
        let started = false

        for (let i = startIndex; i < text.length; i++) {
            if (text[i] === '{' || text[i] === '[') {
                balance++
                started = true
            } else if (text[i] === '}' || text[i] === ']') {
                balance--
                if (started && balance === 0) {
                    return { start: startIndex, end: i + 1, content: text.substring(startIndex, i + 1) }
                }
            }
        }
        return null
    }

    // 辅助函数：根据 ID 查找对象块
    function findObjectBlockById(text: string, id: string): { start: number, end: number, text: string } | null {
        // 尝试单引号和双引号
        const idVariations = [`id: '${id}'`, `id: "${id}"`]
        let idIndex = -1

        for (const v of idVariations) {
            idIndex = text.indexOf(v)
            if (idIndex !== -1) break
        }

        if (idIndex === -1) return null

        // 向后查找开大括号
        let openIdx = -1
        let balance = 0
        for (let i = idIndex; i >= 0; i--) {
            if (text[i] === '}') balance++
            else if (text[i] === '{') {
                if (balance === 0) {
                    openIdx = i
                    break
                }
                balance--
            }
        }

        if (openIdx === -1) return null

        // 使用通用的平衡查找向前查找闭大括号
        const block = findBalancedBlock(text, openIdx)
        if (!block) return null

        return { start: block.start, end: block.end, text: block.content }
    }


    // 同步 sidebar 配置到源码
    async function syncSidebarConfig(): Promise<boolean> {
        const filename = 'sidebar.ts'
        let content = await readSourceFile(filename)
        if (!content) return false

        let hasChanges = false

        // 遍历内存中的所有导航项
        for (const group of navGroups.value) {
            for (const mainItem of group.items) {
                if (!mainItem.id) continue

                // 1. 查找主导航项的代码块
                const blockInfo = findObjectBlockById(content, mainItem.id)
                if (!blockInfo) {
                    console.warn(`[Sync] Could not find block for Main ID ${mainItem.id}`)
                    continue
                }

                let newBlock = blockInfo.text
                let blockChanged = false

                // 2. 更新 Title (如果变化)
                const titlePattern = /(title:\s*['"])(.*?)(['"])/
                const titleMatch = titlePattern.exec(newBlock)
                if (titleMatch && titleMatch[2] !== mainItem.title) {
                    newBlock = newBlock.replace(titlePattern, `$1${mainItem.title}$3`)
                    blockChanged = true
                }

                // 3. 更新 Items (重建数组)
                const itemsMarker = 'items: ['
                const itemsStartRel = newBlock.indexOf(itemsMarker)

                if (itemsStartRel !== -1 && mainItem.items) {
                    // 找到现有的 items 数组块
                    // itemsMarker is 'items: ['. indexOf gives start of 'i'.
                    // 7 chars: 'i','t','e','m','s',':',' ' (if space).
                    // Actually let's assume 'items:' search then find '['.

                    // Helper inside logic:
                    let arrayStartRel = newBlock.indexOf('[', itemsStartRel)
                    if (arrayStartRel !== -1) {
                        const arrayBlock = findBalancedBlock(newBlock, arrayStartRel)
                        if (arrayBlock) {
                            // 生成新的 sub-items 代码
                            const indent = '                        ' // 24 spaces
                            const subItemsCode = mainItem.items.map(sub => {
                                let s = `${indent}{ id: '${sub.id}', title: '${sub.title}', url: '${sub.url}'`
                                if (sub.template) s += `, template: '${sub.template}'`
                                // template handling: default empty string? 
                                // Original code had template: 'Page1'.
                                // If empty template? don't write it? or write ''?
                                // Re-read existing style: template: '' exists in file.
                                // So write it always or if present.
                                if (sub.template === '') s += `, template: ''`

                                s += ` },`
                                return s
                            }).join('\n')

                            const newArrayContent = `[\n${subItemsCode}\n                    ]` // 20 spaces indent for bracket

                            if (arrayBlock.content !== newArrayContent) {
                                newBlock = newBlock.substring(0, arrayBlock.start) + newArrayContent + newBlock.substring(arrayBlock.end)
                                blockChanged = true
                            }
                        }
                    }
                }

                // 4. 写回
                if (blockChanged) {
                    content = content.substring(0, blockInfo.start) + newBlock + content.substring(blockInfo.end)
                    hasChanges = true
                }
            }
        }

        if (!hasChanges) return true

        try {
            const response = await fetch('/__api/write-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename,
                    content
                })
            })
            return response.ok
        } catch (e) {
            console.error('Failed to update sidebar.ts:', e)
            return false
        }
    }

    async function savePage1Config(): Promise<boolean> {
        const code = generatePage1ConfigCode()
        try {
            const response = await fetch('/__api/write-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: 'page1.ts',
                    content: code
                })
            })
            return response.ok
        } catch (e) {
            console.error('Failed to save page1.ts:', e)
            return false
        }
    }



    // ============================================
    // 导出配置为 TypeScript 代码
    // ============================================
    function generatePage1ConfigCode(): string {
        const configs = page1Configs.value

        let code = `import type { DateRange } from 'radix-vue'

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
    type?: 'text' | 'badge' | 'status-badge' | 'text-button'
    fixed?: 'left' | 'right'          // 列固定位置
    visible?: boolean
    mockFormat?: 'text' | 'datetime' | 'number' // 虚拟数据格式
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
    pageSize?: number       // 每页显示行数
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
// ============================================

export const page1Configs: Record<string, Page1Config> = {
`
        // 生成每个配置
        Object.keys(configs).forEach(navId => {
            const config = configs[navId]
            code += `    // ID: '${navId}'\n`
            code += `    '${navId}': {\n`

            // topBar
            if (config.topBar) {
                code += `        topBar: {\n`
                if (config.topBar.appOptions) {
                    code += `            appOptions: COMMON_OPTIONS.APP,\n`
                }
                if (config.topBar.langOptions) {
                    code += `            langOptions: COMMON_OPTIONS.LANG,\n`
                }
                code += `        },\n`
            }

            // filterArea
            code += `        filterArea: {\n`
            code += `            columns: ${config.filterArea.columns},\n`
            code += `            gap: '${config.filterArea.gap}',\n`
            code += `            filters: [\n`
            config.filterArea.filters.forEach(filter => {
                code += `                { key: '${filter.key}', type: '${filter.type}', label: '${filter.label}'`
                if (filter.placeholder) code += `, placeholder: '${filter.placeholder}'`
                if (filter.defaultValue !== undefined && filter.type !== 'date-range') {
                    code += `, defaultValue: '${filter.defaultValue}'`
                }
                if (filter.type === 'date-range') {
                    code += `, defaultValue: undefined`
                }
                if (filter.options && filter.options.length > 0) {
                    code += `,\n                    options: [${filter.options.map(o => `'${o}'`).join(', ')}]`
                }
                if (filter.treeOptions && filter.treeOptions.length > 0) {
                    code += `,\n                    treeOptions: ${JSON.stringify(filter.treeOptions, null, 24).replace(/"([^"]+)":/g, '$1:').trim()}`
                }
                if (filter.visible === false) {
                    code += `, visible: false`
                }
                code += ` },\n`
            })
            code += `            ],\n`
            code += `        },\n`

            // actionsArea
            if (config.actionsArea) {
                code += `        actionsArea: {\n`
                if (config.actionsArea.show !== undefined) code += `            show: ${config.actionsArea.show},\n`
                code += `            buttons: [\n`
                config.actionsArea.buttons.forEach((action: ActionButtonConfig) => {
                    code += `                { key: '${action.key}', label: '${action.label}'`
                    if (action.variant) code += `, variant: '${action.variant}'`
                    if (action.className) code += `,\n                    className: '${action.className}'`
                    if (action.visible === false) code += `, visible: false`
                    code += ` },\n`
                })
                code += `            ],\n`
                code += `        },\n`
            }

            // cardArea
            if (config.cardArea) {
                code += `        cardArea: {\n`
                code += `            show: ${config.cardArea.show},\n`
                code += `            columns: ${config.cardArea.columns},\n`
                code += `            gap: '${config.cardArea.gap}',\n`
                if (config.cardArea.cardHeight) code += `            cardHeight: '${config.cardArea.cardHeight}',\n`
                if (config.cardArea.cardWidth) code += `            cardWidth: '${config.cardArea.cardWidth}',\n`
                code += `            cards: [\n`
                config.cardArea.cards.forEach(card => {
                    code += `                { key: '${card.key}', title: '${card.title}', data: '${card.data}' },\n`
                })
                code += `            ],\n`
                code += `        },\n`
            }

            // tableArea
            code += `        tableArea: {\n`
            if (config.tableArea.height) code += `            height: '${config.tableArea.height}',\n`
            if (config.tableArea.scrollX !== undefined) code += `            scrollX: ${config.tableArea.scrollX},\n`
            if (config.tableArea.scrollY !== undefined) code += `            scrollY: ${config.tableArea.scrollY},\n`
            if (config.tableArea.showCheckbox !== undefined) code += `            showCheckbox: ${config.tableArea.showCheckbox},\n`
            if (config.tableArea.fixedLayout !== undefined) code += `            fixedLayout: ${config.tableArea.fixedLayout},\n`
            code += `            columns: [\n`
            config.tableArea.columns.forEach(col => {
                code += `                { key: '${col.key}', label: '${col.label}'`
                if (col.width) code += `, width: '${col.width}'`
                if (col.minWidth) code += `, minWidth: '${col.minWidth}'`
                if (col.type) code += `, type: '${col.type}'`
                if (col.fixed) code += `, fixed: '${col.fixed}'`
                if (col.visible === false) code += `, visible: false`
                if (col.mockFormat) code += `, mockFormat: '${col.mockFormat}'`
                code += ` },\n`
            })
            code += `            ],\n`
            code += `        },\n`

            // mockData placeholder
            code += `        mockData: () => {
            // TODO: 实现模拟数据生成
            return []
        },\n`

            code += `    },\n`
        })

        code += `}

/**
 * 获取指定导航 ID 的页面配置
 */
export function getPage1Config(navId: string): Page1Config | undefined {
    return page1Configs[navId]
}
`
        return code
    }

    // ============================================
    // 导入/导出配置 (JSON 格式)
    // ============================================

    interface ExportData {
        version: string
        exportedAt: string
        navGroups: Array<{
            label: string
            showLabel?: boolean
            items: Array<{
                id: string
                title: string
                isOpen?: boolean
                items?: Array<{
                    id: string
                    title: string
                    url?: string
                    template?: string
                    component?: Omit<Page1Config, 'mockData'> // 内嵌页面配置 (Phase 2)
                }>
            }>
        }>
        pageConfigs: Record<string, Omit<Page1Config, 'mockData'>>
    }

    /**
     * 获取模板配置（供下载）
     */
    function getTemplateConfig(): ExportData {
        const exampleComponentConfig: Omit<Page1Config, 'mockData'> = {
            filterArea: {
                columns: 4,
                gap: '16px',
                filters: [
                    { key: 'keyword', type: 'input', label: '关键词', placeholder: '请输入关键词', defaultValue: '' },
                    { key: 'status', type: 'select', label: '状态', defaultValue: '全部', options: ['全部', '待审核', '已通过', '已拒绝'] }
                ]
            },
            actionsArea: {
                show: true,
                buttons: [
                    { key: 'search', label: '查询', variant: 'outline' },
                    { key: 'reset', label: '重置', variant: 'outline' }
                ]
            },
            cardArea: {
                show: false,
                columns: 4,
                gap: '16px',
                cards: []
            },
            tableArea: {
                height: '500px',
                scrollX: true,
                scrollY: true,
                showCheckbox: true,
                fixedLayout: true,
                columns: [
                    { key: 'id', label: 'ID', width: '80px' },
                    { key: 'name', label: '名称', width: '150px' }
                ]
            }
        }

        return {
            version: '2.0', // Updated version
            exportedAt: new Date().toISOString(),
            navGroups: [
                {
                    label: '平台',
                    showLabel: false,
                    items: [
                        {
                            id: 'example-main',
                            title: '示例主导航',
                            isOpen: true,
                            items: [
                                {
                                    id: 'example-1',
                                    title: '示例页面1',
                                    url: '#',
                                    // Removed template field
                                    component: exampleComponentConfig
                                }
                            ]
                        }
                    ]
                }
            ],
            pageConfigs: {} // Keep empty for type compatibility, or remove if type allows (type says it's required in interface, we can make it partial or just empty)
        }
    }

    /**
     * 导出完整配置
     */
    function exportFullConfig(): ExportData {
        // 构建导航组数据（包含内嵌的页面配置）
        const exportNavGroups = navGroups.value.map(group => ({
            label: group.label,
            showLabel: group.showLabel,
            items: group.items.map(mainItem => ({
                id: mainItem.id,
                title: mainItem.title,
                isOpen: mainItem.isOpen,
                items: mainItem.items?.map(subItem => {
                    // 获取页面配置（如果有）
                    const pageConfig = page1Configs.value[subItem.id]
                    let componentConfig: Omit<Page1Config, 'mockData'> | undefined

                    if (pageConfig) {
                        const { mockData, ...rest } = pageConfig
                        // Create a clean copy of the config without internal flags if any
                        componentConfig = {
                            ...rest,
                            // Ensure areas match structure
                            ...(rest.topBar && { topBar: rest.topBar }),
                            filterArea: rest.filterArea,
                            ...(rest.actionsArea && { actionsArea: rest.actionsArea }),
                            ...(rest.cardArea && { cardArea: rest.cardArea }),
                            tableArea: rest.tableArea,
                        }
                    }

                    return {
                        id: subItem.id,
                        title: subItem.title,
                        url: subItem.url,
                        // template 字段不再导出，或者设为空
                        component: componentConfig // Phase 2: 内嵌配置
                    }
                })
            }))
        }))

        return {
            version: '2.0',
            exportedAt: new Date().toISOString(),
            navGroups: exportNavGroups,
            pageConfigs: {} // We migrate to nested structure, so this is empty. Kept for type compatibility.
        }
    }

    /**
     * 导入配置
     */
    function importFullConfig(data: ExportData): { success: boolean; message: string } {
        try {
            console.log('importFullConfig: Importing config data:', data)

            // 验证基本结构 - 放宽验证，允许缺少某些字段
            if (!data || typeof data !== 'object') {
                return { success: false, message: '无效的配置格式' }
            }

            // 规范化数据输入（兼容不同的 JSON 格式）
            const navGroupsData = data.navGroups || (data as any).Configs || []

            // 导入导航组 - 完全替换而不是合并，确保云端配置完全覆盖本地
            if (navGroupsData && Array.isArray(navGroupsData)) {
                // 清空现有导航组
                navGroups.value = []

                // 导入所有导航组
                navGroupsData.forEach((importGroup: any) => {
                    const items = importGroup.items || importGroup.navitems || []

                    navGroups.value.push({
                        label: importGroup.label,
                        showLabel: importGroup.showLabel,
                        items: items.map((mainItem: any) => {
                            const subItems = mainItem.items || mainItem.navitems || []

                            return {
                                id: mainItem.id,
                                title: mainItem.title || mainItem.label,
                                url: '#',
                                isOpen: mainItem.isOpen,
                                items: subItems.map((sub: any) => {
                                    // Phase 2: 如果存在内嵌的 component 配置，提取到 page1Configs
                                    let componentConfig: Page1Config | undefined

                                    if (sub.component) {
                                        // 需要补充 mockData 函数，因为导出时忽略了它
                                        componentConfig = {
                                            ...sub.component,
                                            mockData: () => []
                                        } as Page1Config

                                        page1Configs.value[sub.id] = componentConfig
                                    }

                                    // 如果有 component 配置但没有指定 template，默认使用 Page1
                                    const inferredTemplate = sub.template || (componentConfig ? 'Page1' : '')

                                    return {
                                        id: sub.id,
                                        title: sub.title || sub.label,
                                        url: sub.url || '#',
                                        template: inferredTemplate as 'Page1' | 'Page2' | '',
                                        component: componentConfig // 使用包含 mockData 的完整配置
                                    }
                                })
                            }
                        }) || []
                    })
                })
            }

            // 导入页面配置
            if (data.pageConfigs) {
                Object.entries(data.pageConfigs).forEach(([navId, config]: [string, any]) => {
                    // 显式列出要导入的字段，排除废弃的 actions 字段
                    page1Configs.value[navId] = {
                        ...(config.topBar && { topBar: config.topBar }),
                        filterArea: config.filterArea,
                        ...(config.actionsArea && { actionsArea: config.actionsArea }),
                        ...(config.cardArea && { cardArea: config.cardArea }),
                        tableArea: config.tableArea,
                        mockData: mockDataFunctions.value[navId] || (() => [])
                    } as Page1Config
                })
            }

            return { success: true, message: '配置导入成功' }
        } catch (e) {
            console.error('Failed to import config:', e)
            return { success: false, message: '导入失败: ' + (e as Error).message }
        }
    }

    // ============================================
    // Supabase 云端配置存储
    // ============================================

    /**
     * 保存配置到 Supabase
     */
    async function saveToSupabase(): Promise<{ success: boolean; message: string }> {
        try {
            // 获取当前用户
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                return { success: false, message: '用户未登录' }
            }

            const exportData = exportFullConfig()

            const { error } = await supabase
                .from('user_configs')
                .upsert(
                    {
                        user_id: user.id,
                        config_data: exportData,
                        updated_at: new Date().toISOString()
                    },
                    { onConflict: 'user_id' }
                )

            if (error) {
                console.error('Failed to save to Supabase:', error)
                toast.error('保存失败', { description: error.message })
                return { success: false, message: error.message }
            }

            toast.success('配置已保存到云端')

            return { success: true, message: '配置已保存到云端' }
        } catch (e) {
            console.error('Failed to save to Supabase:', e)
            toast.error('保存失败', { description: (e as Error).message })
            return { success: false, message: '保存失败: ' + (e as Error).message }
        }
    }

    /**
     * 从 Supabase 加载配置
     */
    async function loadFromSupabase(): Promise<{ success: boolean; message: string }> {
        isConfigLoading.value = true
        try {
            // 获取当前用户
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('未登录', { description: '请先登录后再加载配置' })
                isConfigLoading.value = false
                return { success: false, message: '用户未登录' }
            }

            const { data, error } = await supabase
                .from('user_configs')
                .select('config_data')
                .eq('user_id', user.id)
                .single()

            if (error) {
                // PGRST116 表示没有找到记录
                if (error.code === 'PGRST116') {
                    console.log('用户没有云端配置，显示空状态')
                    toast.info('未找到云端配置', { description: '请通过 AI 助手创建配置' })
                    // 保持空状态
                    isConfigLoaded.value = true
                    isConfigLoading.value = false
                    return { success: true, message: '无云端配置' }
                }
                console.error('Failed to load from Supabase:', error)
                toast.error('加载失败', { description: error.message })
                isConfigLoading.value = false
                return { success: false, message: error.message }
            }

            if (data?.config_data) {
                // 先清除 localStorage，确保使用云端数据
                localStorage.removeItem(STORAGE_KEY_PAGE1_CONFIGS)
                // 导入云端配置
                const result = importFullConfig(data.config_data)
                if (result.success) {
                    console.log('已从云端加载配置')
                    toast.success('已加载云端配置')
                    // 将云端配置同步到 localStorage
                    savePage1ConfigsToStorage(page1Configs.value)

                    // 初始化导航状态
                    if (navGroups.value.length > 0) {
                        initNavigation(navGroups.value)
                    }

                    isConfigLoaded.value = true
                } else {
                    toast.error('配置导入失败', { description: result.message })
                }
                isConfigLoading.value = false
                return result
            }

            isConfigLoaded.value = true
            isConfigLoading.value = false
            return { success: true, message: '配置加载成功' }
        } catch (e) {
            console.error('Failed to load from Supabase:', e)
            isConfigLoading.value = false
            return { success: false, message: '加载失败: ' + (e as Error).message }
        }
    }

    /**
     * 导入 JSON 配置并同步到云端
     */
    async function importAndSyncToCloud(data: ExportData): Promise<{ success: boolean; message: string }> {
        // 先导入到本地
        const importResult = importFullConfig(data)
        if (!importResult.success) {
            return importResult
        }

        // 再同步到云端
        const saveResult = await saveToSupabase()
        if (!saveResult.success) {
            return { success: false, message: `导入成功但同步失败: ${saveResult.message}` }
        }

        return { success: true, message: '配置导入并同步成功' }
    }

    return {
        // State
        navGroups,
        page1Configs,
        // Preview State
        previewMode,
        previewConfig,
        // 加载状态
        isConfigLoaded,
        isConfigLoading,
        // Getters
        isInPreviewMode,
        effectiveNavGroups,
        getNavGroup,
        getPage1Config,
        // Preview Actions
        setPreviewConfig,
        clearPreviewConfig,
        applyPreviewConfig,
        // Nav Actions
        addNavMainItem,
        updateNavMainItem,
        deleteNavMainItem,
        addSubNavItem,
        updateSubNavItem,
        deleteSubNavItem,
        // Page1 Actions
        addPage1Config,
        updatePage1Config,
        deletePage1Config,
        updateFilterAreaConfig,
        updateTableAreaConfig,
        // Persistence Actions
        resetToDefaults,
        generatePage1ConfigCode,
        saveToSourceFile,
        // Import/Export Actions
        getTemplateConfig,
        exportFullConfig,
        importFullConfig,
        // Supabase Actions
        saveToSupabase,
        loadFromSupabase,
        importAndSyncToCloud,
    }
})
