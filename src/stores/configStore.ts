import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { defaultSidebarConfig } from '@/config/sidebar'
import { page1Configs as defaultPage1Configs } from '@/config/page1'

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
    TreeNode
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
    TreeNode
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

    // 同步 sidebar 配置到源码 (仅更新 title 和 template)
    async function syncSidebarConfig(): Promise<boolean> {
        const filename = 'sidebar.ts'
        let content = await readSourceFile(filename)
        if (!content) return false

        let hasChanges = false

        // 遍历内存中的所有导航项，检查并更新源码
        for (const group of navGroups.value) {
            for (const mainItem of group.items) {
                // 更新主导航项 (如果需要)
                if (mainItem.id) {
                    // TODO: 如果主导航项支持修改，可以在这里添加逻辑
                }

                if (mainItem.items) {
                    for (const subItem of mainItem.items) {
                        if (!subItem.id) continue

                        // 使用正则查找对应的 ID 块
                        // 匹配模式：id: 'xxx', 后面跟着任意字符，直到 }
                        // 注意：这只是一个简单的匹配，假设代码格式比较标准
                        const idPattern = new RegExp(`id:\\s*['"]${subItem.id}['"][\\s\\S]*?\\}`, 'g')
                        const match = idPattern.exec(content)

                        if (match) {
                            let block = match[0]
                            let blockChanged = false

                            console.log(`[Sync] Found block for ID ${subItem.id}:`, block)

                            // 1. 检查并更新 Title
                            const titlePattern = /(title:\s*['"])(.*?)(['"])/
                            const titleMatch = titlePattern.exec(block)
                            if (titleMatch && titleMatch[2] !== subItem.title) {
                                console.log(`[Sync] Updating title for ${subItem.id}: ${titleMatch[2]} -> ${subItem.title}`)
                                block = block.replace(titlePattern, `$1${subItem.title}$3`)
                                blockChanged = true
                            }

                            // 2. 检查并更新 Template
                            const templatePattern = /(template:\s*['"])(.*?)(['"])/
                            const templateMatch = templatePattern.exec(block)

                            if (templateMatch) {
                                // 如果存在 template 字段，更新它
                                const currentTemplate = templateMatch[2]
                                const newTemplate = subItem.template || ''

                                console.log(`[Sync] Found template for ${subItem.id}: '${currentTemplate}', New: '${newTemplate}'`)

                                if (currentTemplate !== newTemplate) {
                                    console.log(`[Sync] Updating template for ${subItem.id}`)
                                    block = block.replace(templatePattern, `$1${newTemplate}$3`)
                                    blockChanged = true
                                }
                            } else if (subItem.template) {
                                console.log(`[Sync] Adding template for ${subItem.id}: ${subItem.template}`)
                                // 如果不存在 template 字段，但内存中有值，则添加
                                // 重新在 block (可能是更新过 title 后的) 中查找 title 位置用于插入
                                const currentTitleMatch = titlePattern.exec(block)
                                if (currentTitleMatch) {
                                    block = block.replace(titlePattern, `$1${currentTitleMatch[2]}$3, template: '${subItem.template}'`)
                                    blockChanged = true
                                }
                            }

                            // 如果块有变化，更新原始内容
                            if (blockChanged) {
                                content = content.replace(match[0], block)
                                hasChanges = true
                            }
                        } else {
                            console.warn(`[Sync] Could not find block for ID ${subItem.id} in sidebar.ts`)
                        }
                    }
                }
            }
        }

        // 如果没有变化，直接返回成功
        if (!hasChanges) return true

        // 写入更新后的内容
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
                code += ` },\n`
            })
            code += `            ],\n`
            code += `        },\n`

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
                code += ` },\n`
            })
            code += `            ],\n`
            code += `        },\n`

            // actions
            if (config.actions && config.actions.length > 0) {
                code += `        actions: [\n`
                config.actions.forEach(action => {
                    code += `            { key: '${action.key}', label: '${action.label}'`
                    if (action.variant) code += `, variant: '${action.variant}'`
                    if (action.className) code += `,\n                className: '${action.className}'`
                    code += ` },\n`
                })
                code += `        ],\n`
            }

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
    }
})
