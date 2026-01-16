import { ref, computed, h } from 'vue'
import {
    AudioWaveform,
    Command,
    type LucideIcon,
} from 'lucide-vue-next'

// ============================================
// 类型定义
// ============================================

import type { Page1Config } from './page1'

export interface NavSubItem {
    id: string
    title: string
    url: string
    badge?: string // 可选徽章
    template?: 'Page1' | 'Page2' | '' // 使用的页面模板
    component?: Page1Config // 内嵌页面配置 (Phase 2)
}


export interface NavMainItem {
    id: string
    title: string
    url: string
    icon?: LucideIcon
    /**
     * @deprecated 请使用 isOpen 代替
     */
    isActive?: boolean
    /**
     * 一级菜单是否默认展开
     */
    isOpen?: boolean
    items?: NavSubItem[]
}

export interface NavGroup {
    id?: string
    label: string
    showLabel?: boolean
    items: NavMainItem[]
}

export interface ProjectItem {
    id: string
    name: string
    url: string
    icon: LucideIcon
}

export interface ProjectGroup {
    id?: string
    label: string
    showLabel?: boolean
    projects: ProjectItem[]
    showMoreButton?: boolean
}

export interface TeamPermissions {
    navMain: 'all' | string[]
    projects: 'all' | string[]
    /**
     * 细粒度控制某个导航下的子项
     * 格式: { 导航id: [子项id数组] }
     */
    navItems?: Record<string, string[]>
}

export interface TeamItem {
    name: string
    logo: LucideIcon
    plan: string
    permissions: TeamPermissions
}

export interface UserInfo {
    name: string
    email: string
    avatar: string
}

export interface SidebarConfig {
    user: UserInfo
    teams: TeamItem[]
    navGroups: NavGroup[]
    projectGroups: ProjectGroup[]
}

// ============================================
// 默认配置数据
// ============================================

// Custom Logo Component
const AIGenLogo = (props: any) => h('img', { src: import.meta.env.BASE_URL + 'ai.svg', ...props, style: 'width: 100%; height: 100%; object-fit: contain;' })

export const defaultSidebarConfig: SidebarConfig = {
    user: {
        name: ' ',
        email: ' ',
        avatar: '/avatars/shadcn.jpg',
    },

    teams: [
        {
            name: 'AIGen UI',
            logo: AIGenLogo, // Using custom logo
            plan: 'online',
            permissions: {
                navMain: 'all',
                projects: 'all'
            }
        },
        {
            name: 'A部门',
            logo: AudioWaveform,
            plan: 'online',
            permissions: {
                navMain: ['workspace', 'report', 'dashboard'],
                projects: ['data-dictionary', 'user-manual']
            }
        },
        {
            name: 'B部门',
            logo: Command,
            plan: 'online',
            permissions: {
                navMain: ['rbac', 'settings'],
                projects: ['user-manual']
            }
        },
        {
            name: 'C部门',
            logo: Command,
            plan: 'online',
            permissions: {
                navMain: ['report', 'dashboard'],
                navItems: {
                    'report': ['company']
                },
                projects: []
            }
        },
    ],

    // navGroups 默认为空数组 - 配置从云端加载
    navGroups: [],

    projectGroups: [
        {
            label: ' ',
            showLabel: false,
            showMoreButton: false,
            projects: [

            ],
        },
    ],
}

// ============================================
// 配置管理函数
// ============================================

/**
 * 合并用户配置与默认配置
 */
export function mergeSidebarConfig(
    customConfig: Partial<SidebarConfig>
): SidebarConfig {
    return {
        ...defaultSidebarConfig,
        ...customConfig,
        // 深度合并数组类型的字段
        navGroups: customConfig.navGroups ?? defaultSidebarConfig.navGroups,
        projectGroups: customConfig.projectGroups ?? defaultSidebarConfig.projectGroups,
        teams: customConfig.teams ?? defaultSidebarConfig.teams,
    }
}

/**
 * 创建导航项
 */
/**
 * 创建导航项
 */
export function createNavItem(
    id: string,
    title: string,
    url: string,
    icon?: LucideIcon,
    subItems?: NavSubItem[],
    isActive = false
): NavMainItem {
    return {
        id,
        title,
        url,
        icon,
        isActive,
        items: subItems,
    }
}

/**
 * 创建导航分组
 */
export function createNavGroup(label: string, items: NavMainItem[], id?: string): NavGroup {
    return { id, label, items }
}

/**
 * 创建项目项
 */
export function createProjectItem(
    id: string,
    name: string,
    url: string,
    icon: LucideIcon
): ProjectItem {
    return { id, name, url, icon }
}

/**
 * 创建项目分组
 */
export function createProjectGroup(
    label: string,
    projects: ProjectItem[],
    showMoreButton = true,
    id?: string
): ProjectGroup {
    return { id, label, projects, showMoreButton }
}

// ============================================
// 导航状态管理
// ============================================

// 导航状态（模块级别的单例状态）
const currentMainNav = ref('')
const currentSubNav = ref('')
const _currentNavId = ref('')
const detailTitle = ref<string | null>(null)

// 外部注入的 navGroups 引用（来自 configStore，避免循环依赖）
const _navGroupsRef = ref<NavGroup[] | null>(null)

/**
 * 初始化导航状态（在配置加载后调用）
 */
export function initNavigation(navGroups: NavGroup[]) {
    if (!navGroups || navGroups.length === 0) return

    const firstNavGroup = navGroups[0]
    const firstMainNav = firstNavGroup?.items[0]
    const firstSubNav = firstMainNav?.items?.[0]

    if (firstMainNav) {
        currentMainNav.value = firstMainNav.title
        if (firstSubNav) {
            currentSubNav.value = firstSubNav.title
            _currentNavId.value = firstSubNav.id
        }
    }
}

/**
 * 设置 navGroups 引用（由 configStore 调用）
 */
export function setNavGroupsRef(navGroups: NavGroup[]) {
    _navGroupsRef.value = navGroups
}

/**
 * 导航状态管理 Composable
 * 用于管理当前选中的导航项和面包屑
 */
export function useNavigation() {
    // 设置当前导航
    const setNavigation = (mainNav: string, subNav: string, navId?: string) => {
        currentMainNav.value = mainNav
        currentSubNav.value = subNav
        if (navId) {
            _currentNavId.value = navId
        } else {
            // 如果没有传 navId，尝试从配置中查找（使用云端配置）
            const navGroups = _navGroupsRef.value || []
            for (const group of navGroups) {
                for (const mainItem of group.items) {
                    const subItem = mainItem.items?.find(item => item.title === subNav)
                    if (subItem) {
                        _currentNavId.value = subItem.id
                        return
                    }
                }
            }
        }
    }

    // 设置详情标题（用于第三级面包屑）
    const setDetailTitle = (title: string | null) => {
        detailTitle.value = title
    }

    // 计算面包屑数据
    const breadcrumbs = computed(() => ({
        main: currentMainNav.value,
        sub: currentSubNav.value,
        detail: detailTitle.value,
    }))

    // 当前导航项 ID
    const currentNavId = computed(() => _currentNavId.value)

    // 计算当前页面模板 - 从配置中动态查找
    // 注意：需要从外部注入 configStore 的 navGroups 引用以避免循环依赖
    // 这里先从默认配置查找，configStore 会在加载后更新
    const currentTemplate = computed(() => {
        // 从 _navGroupsRef 查找（由 configStore 注入的云端配置）
        if (_navGroupsRef.value) {
            for (const group of _navGroupsRef.value) {
                for (const mainItem of group.items) {
                    const subItem = mainItem.items?.find((item: NavSubItem) => item.id === _currentNavId.value)
                    if (subItem?.template) {
                        return subItem.template
                    }
                    // Phase 2: Support component field (implies Page1)
                    if (subItem?.component) {
                        return 'Page1'
                    }
                }
            }
        }
        // 未配置 template 则返回 undefined
        return undefined
    })

    // 计算当前页面组件名称 - 保留兼容（如果有模板则返回模板名）
    const currentPage = computed(() => {
        // 特殊页面处理（如 Settings）
        if (_currentNavId.value === 'settings') {
            return 'Settings'
        }
        if (currentTemplate.value) {
            return currentTemplate.value
        }
        // 未配置则返回子导航标题（会触发 PlaceholderPage）
        return currentSubNav.value
    })

    return {
        currentMainNav,
        currentSubNav,
        currentNavId,
        detailTitle,
        breadcrumbs,
        currentPage,
        currentTemplate,
        setNavigation,
        setDetailTitle,
    }
}
