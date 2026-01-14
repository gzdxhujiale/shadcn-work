import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { defaultSidebarConfig } from '@/config/sidebar'
import { page1Configs as defaultPage1Configs } from '@/config/page1'
import { supabase } from '@/lib/supabase'

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
// Helper: Load from localStorage
// ============================================
function loadPage1ConfigsFromStorage(): Record<string, Page1Config> | null {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_PAGE1_CONFIGS)
        if (saved) {
            return JSON.parse(saved)
        }
    } catch (e) {
        console.warn('Failed to load page1Configs from localStorage:', e)
    }
    return null
}

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
    // State - 使用深拷贝初始化，避免直接修改源配置
    const navGroups = ref<NavGroup[]>(JSON.parse(JSON.stringify(defaultSidebarConfig.navGroups)))

    // 尝试从 localStorage 加载配置，并与默认配置合并
    // 这样可以保留默认配置，同时 localStorage 中的配置可以覆盖或添加新的
    const savedConfigs = loadPage1ConfigsFromStorage()
    const defaultConfigsClone = JSON.parse(JSON.stringify(defaultPage1Configs, (_key, value) => {
        // 函数不能序列化，需要排除
        if (typeof value === 'function') return undefined
        return value
    }))

    // 合并配置：默认配置 + localStorage 配置
    // localStorage 中的配置会覆盖默认配置中相同 ID 的配置
    const mergedConfigs: Record<string, Page1Config> = {
        ...defaultConfigsClone,
        ...(savedConfigs || {})
    }

    const page1Configs = ref<Record<string, Page1Config>>(mergedConfigs)

    // 保存 mockData 函数引用（不能序列化）
    const initialMockFunctions: Record<string, () => any[]> = {}
    Object.keys(defaultPage1Configs).forEach(key => {
        initialMockFunctions[key] = defaultPage1Configs[key].mockData
    })
    const mockDataFunctions = ref<Record<string, () => any[]>>(initialMockFunctions)

    // 监听配置变化，自动保存到 localStorage
    watch(page1Configs, (newConfigs) => {
        savePage1ConfigsToStorage(newConfigs)
    }, { deep: true })

    // Getters
    const getNavGroup = computed(() => (index: number) => navGroups.value[index])

    const getPage1Config = computed(() => (navId: string): Page1Config | undefined => {
        const config = page1Configs.value[navId]
        if (config) {
            return {
                ...config,
                mockData: mockDataFunctions.value[navId] || (() => [])
            }
        }
        return undefined
    })

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

        // 自动将对应导航项的 template 设置为 'Page1'
        for (const group of navGroups.value) {
            for (const mainItem of group.items) {
                const subItem = mainItem.items?.find(s => s.id === navId)
                if (subItem) {
                    subItem.template = 'Page1'
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
    // 重置为默认配置
    // ============================================
    function resetToDefaults() {
        page1Configs.value = JSON.parse(JSON.stringify(defaultPage1Configs, (_key, value) => {
            if (typeof value === 'function') return undefined
            return value
        }))
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
                }>
            }>
        }>
        pageConfigs: Record<string, Omit<Page1Config, 'mockData'>>
    }

    /**
     * 获取模板配置（供下载）
     */
    function getTemplateConfig(): ExportData {
        return {
            version: '1.0',
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
                                { id: 'example-1', title: '示例页面1', url: '#', template: 'Page1' },
                                { id: 'example-2', title: '示例页面2', url: '#', template: 'Page1' }
                            ]
                        }
                    ]
                }
            ],
            pageConfigs: {
                'example-1': {
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
            }
        }
    }

    /**
     * 导出完整配置
     */
    function exportFullConfig(): ExportData {
        // 构建导航组数据（不包含 icon 等不可序列化的属性）
        const exportNavGroups = navGroups.value.map(group => ({
            label: group.label,
            showLabel: group.showLabel,
            items: group.items.map(mainItem => ({
                id: mainItem.id,
                title: mainItem.title,
                isOpen: mainItem.isOpen,
                items: mainItem.items?.map(subItem => ({
                    id: subItem.id,
                    title: subItem.title,
                    url: subItem.url,
                    template: subItem.template
                }))
            }))
        }))

        // 构建页面配置（只导出已知字段，排除 mockData 和废弃的 actions 字段）
        const exportPageConfigs: Record<string, Omit<Page1Config, 'mockData'>> = {}
        Object.entries(page1Configs.value).forEach(([navId, config]) => {
            // 显式列出要导出的字段，排除废弃字段
            exportPageConfigs[navId] = {
                ...(config.topBar && { topBar: config.topBar }),
                filterArea: config.filterArea,
                ...(config.actionsArea && { actionsArea: config.actionsArea }),
                ...(config.cardArea && { cardArea: config.cardArea }),
                tableArea: config.tableArea,
            }
        })

        return {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            navGroups: exportNavGroups,
            pageConfigs: exportPageConfigs
        }
    }

    /**
     * 导入配置
     */
    function importFullConfig(data: ExportData): { success: boolean; message: string } {
        try {
            // 验证版本
            if (!data.version || !data.navGroups || !data.pageConfigs) {
                return { success: false, message: '无效的配置格式' }
            }

            // 导入导航组
            if (data.navGroups && Array.isArray(data.navGroups)) {
                // 合并导航组：保留现有的，更新/添加导入的
                data.navGroups.forEach(importGroup => {
                    // 查找现有组（按 label 匹配）
                    let existingGroup = navGroups.value.find(g => g.label === importGroup.label)

                    if (!existingGroup) {
                        // 新建组
                        navGroups.value.push({
                            label: importGroup.label,
                            showLabel: importGroup.showLabel,
                            items: []
                        })
                        existingGroup = navGroups.value[navGroups.value.length - 1]
                    }

                    // 合并主导航项
                    importGroup.items?.forEach(importMainItem => {
                        const existingMainItem = existingGroup!.items.find(i => i.id === importMainItem.id)

                        if (existingMainItem) {
                            // 更新现有项
                            existingMainItem.title = importMainItem.title
                            existingMainItem.isOpen = importMainItem.isOpen

                            // 合并子导航项
                            importMainItem.items?.forEach(importSubItem => {
                                const existingSub = existingMainItem.items?.find(s => s.id === importSubItem.id)
                                if (existingSub) {
                                    existingSub.title = importSubItem.title
                                    existingSub.url = importSubItem.url || '#'
                                    existingSub.template = importSubItem.template as 'Page1' | 'Page2' | ''
                                } else {
                                    if (!existingMainItem.items) existingMainItem.items = []
                                    existingMainItem.items.push({
                                        id: importSubItem.id,
                                        title: importSubItem.title,
                                        url: importSubItem.url || '#',
                                        template: importSubItem.template as 'Page1' | 'Page2' | ''
                                    })
                                }
                            })
                        } else {
                            // 新建主导航项
                            existingGroup!.items.push({
                                id: importMainItem.id,
                                title: importMainItem.title,
                                url: '#',
                                isOpen: importMainItem.isOpen,
                                items: importMainItem.items?.map(sub => ({
                                    id: sub.id,
                                    title: sub.title,
                                    url: sub.url || '#',
                                    template: sub.template as 'Page1' | 'Page2' | ''
                                }))
                            })
                        }
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
                return { success: false, message: error.message }
            }

            return { success: true, message: '配置已保存到云端' }
        } catch (e) {
            console.error('Failed to save to Supabase:', e)
            return { success: false, message: '保存失败: ' + (e as Error).message }
        }
    }

    /**
     * 从 Supabase 加载配置
     */
    async function loadFromSupabase(): Promise<{ success: boolean; message: string }> {
        try {
            // 获取当前用户
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
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
                    console.log('用户没有云端配置，使用默认配置')
                    // 清除 localStorage，使用纯默认配置
                    localStorage.removeItem(STORAGE_KEY_PAGE1_CONFIGS)
                    resetToDefaults()
                    return { success: true, message: '使用默认配置' }
                }
                console.error('Failed to load from Supabase:', error)
                return { success: false, message: error.message }
            }

            if (data?.config_data) {
                // 先清除 localStorage，确保使用云端数据
                localStorage.removeItem(STORAGE_KEY_PAGE1_CONFIGS)
                // 先重置为默认配置，再导入云端配置
                resetToDefaults()
                const result = importFullConfig(data.config_data)
                if (result.success) {
                    console.log('已从云端加载配置')
                    // 将云端配置同步到 localStorage
                    savePage1ConfigsToStorage(page1Configs.value)
                }
                return result
            }

            return { success: true, message: '配置加载成功' }
        } catch (e) {
            console.error('Failed to load from Supabase:', e)
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
        // Getters
        getNavGroup,
        getPage1Config,
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
