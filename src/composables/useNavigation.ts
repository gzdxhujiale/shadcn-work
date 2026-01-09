import { ref, computed } from 'vue'

// 导航状态
const currentMainNav = ref('工作台')
const currentSubNav = ref('待办清单')
const detailTitle = ref<string | null>(null) // 存储详情页标题（第三级面包屑）

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

    // 计算当前页面组件名称
    const currentPage = computed(() => {
        // 将中文标题映射到组件名
        const pageMap: Record<string, string> = {
            // 工作台
            '待办清单': 'TodoList',
            '历史记录': 'History',
            // 经营仓
            '公司经营仓': 'ReportCompany',
            '阿米巴经营仓': 'ReportAmeba',
            '店铺经营仓': 'ReportStore',
            // 自助分析
            '数据看板': 'SelfServiceBi',
            '对比分析': 'DashboardCompare',
            // 权限管理
            '用户管理': 'RbacUser',
            '角色管理': 'RbacRole',
            '权限管理': 'RbacPermission',
            '权限申请': 'RbacApply',
            '操作日志': 'RbacLog',
            // 系统设置
            '配置管理': 'DimensionManagement',
            '通知设置': 'NotificationSettings',
            // 项目/文档
            '数据字典': 'DataDictionary',
            '用户操作手册': 'UserManual',
        }

        return pageMap[currentSubNav.value] || 'TodoList'
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
