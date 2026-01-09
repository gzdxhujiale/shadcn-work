import { ref, computed } from 'vue'
import {
    AudioWaveform,
    Command,
    GalleryVerticalEnd,
    SquareTerminal,
    type LucideIcon,
} from 'lucide-vue-next'

// ============================================
// 类型定义
// ============================================

export interface NavSubItem {
    id: string
    title: string
    url: string
    badge?: string // 可选徽章
    component?: string // 对应的页面组件名称，未指定则显示占位页
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

export const defaultSidebarConfig: SidebarConfig = {
    user: {
        name: ' ',
        email: ' ',
        avatar: '/avatars/shadcn.jpg',
    },

    teams: [
        {
            name: '创新中台',
            logo: GalleryVerticalEnd,
            plan: 'online',
            permissions: {
                navMain: 'all',
                projects: 'all'
            }
        },
        {
            name: '财务部',
            logo: AudioWaveform,
            plan: '财务BI',
            permissions: {
                navMain: ['workspace', 'report', 'dashboard'],
                projects: ['data-dictionary', 'user-manual']
            }
        },
        {
            name: 'IT部',
            logo: Command,
            plan: '运维管理',
            permissions: {
                navMain: ['rbac', 'settings'],
                projects: ['user-manual']
            }
        },
        {
            name: '公司经营分析',
            logo: Command,
            plan: '数据分析',
            permissions: {
                navMain: ['report', 'dashboard'],
                navItems: {
                    'report': ['company']
                },
                projects: []
            }
        },
    ],

    navGroups: [
        {
            label: '平台',
            showLabel: false,
            items: [
                {
                    id: 'workspace',
                    title: '提现管理',
                    url: '#',
                    icon: SquareTerminal,
                    isOpen: true, // 设置为 true 则默认展开
                    items: [
                        { id: '1', title: '提现', url: '#', component: 'Withdraw' },
                        { id: '2', title: '提现币商代发薪资', url: '#' },
                        { id: '3', title: '公会薪资转账', url: '#' },
                        { id: '4', title: '提现黑名单', url: '#' },
                        { id: '5', title: '离线打款', url: '#' },
                        { id: '6', title: '在线打款', url: '#' },
                        { id: '7', title: '大款订单', url: '#' },
                        { id: '8', title: '结算核减', url: '#' },
                        { id: '9', title: 'payonner账户管理', url: '#' },
                        { id: '10', title: '账号黑名单', url: '#' },
                        { id: '11', title: '稳定币白名单', url: '#' },
                    ],
                },
            ],
        },
    ],

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

// 从配置中获取默认导航
const firstNavGroup = defaultSidebarConfig.navGroups[0]
const firstMainNav = firstNavGroup?.items[0]
const firstSubNav = firstMainNav?.items?.[0]

// 导航状态（模块级别的单例状态）
const currentMainNav = ref(firstMainNav?.title ?? '')
const currentSubNav = ref(firstSubNav?.title ?? '')
const detailTitle = ref<string | null>(null)

/**
 * 导航状态管理 Composable
 * 用于管理当前选中的导航项和面包屑
 */
export function useNavigation() {
    // 设置当前导航
    const setNavigation = (mainNav: string, subNav: string) => {
        currentMainNav.value = mainNav
        currentSubNav.value = subNav
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

    // 计算当前页面组件名称 - 从配置中动态查找
    const currentPage = computed(() => {
        // 遍历所有导航组查找当前子导航对应的组件
        for (const group of defaultSidebarConfig.navGroups) {
            for (const mainItem of group.items) {
                const subItem = mainItem.items?.find(item => item.title === currentSubNav.value)
                if (subItem?.component) {
                    return subItem.component
                }
            }
        }
        // 未配置 component 则返回子导航标题（会触发 PlaceholderPage）
        return currentSubNav.value
    })

    return {
        currentMainNav,
        currentSubNav,
        detailTitle,
        breadcrumbs,
        currentPage,
        setNavigation,
        setDetailTitle,
    }
}
