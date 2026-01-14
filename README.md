# AIGen UI

基于 Vue 3 + TypeScript + Vite + Shadcn-Vue 构建的财务数据管理平台

## 📋 项目概述

这是一个使用 [shadcn-vue](https://www.shadcn-vue.com/) 组件库构建的现代化企业级应用框架，支持：
- 🧭 **动态导航系统** - 多级面包屑和页面切换
- � **Supabase 认证** - 完整的用户注册/登录/重置密码流程
- ☁️ **云端配置同步** - 用户配置自动同步 Supabase，支持多端漫游
- �👥 **团队权限管理** - 基于角色的菜单权限控制
- 📊 **页面组件化** - 模块化的页面管理结构
- 🎯 **Teleport 传送门** - 灵活的 UI 组件位置控制



## 📁 项目结构

```
src/
├── components/
│   ├── pages/                    # 📄 页面组件目录
│   │   ├── workspace/            # 工作台相关页面
│   │   │   └── TodoList.vue      # 待办清单示例
│   │   ├── report/               # 报表相关页面 (待添加)
│   │   ├── rbac/                 # 权限管理页面 (待添加)
│   │   └── config/               # 系统配置页面 (待添加)
│   ├── ui/                       # shadcn-vue UI 组件
│   ├── AppSidebar.vue            # 应用侧边栏
│   ├── NavMain.vue               # 主导航组件
│   ├── NavProjects.vue           # 项目/文档导航
│   ├── NavUser.vue               # 用户信息组件
│   └── TeamSwitcher.vue          # 团队切换器
├── composables/
│   └── useNavigation.ts          # 导航状态管理
├── config/
│   └── sidebar.ts                # 侧边栏配置
└── App.vue                       # 主应用组件
```

---

## 📝 用户编程修改手册

### 一、添加新页面

#### 步骤 1：创建页面组件文件

在 `src/components/pages/` 对应分类目录下创建 `.vue` 文件：

```bash
# 示例：创建历史记录页面
src/components/pages/workspace/History.vue
```

#### 步骤 2：编写页面组件

```vue
<script setup lang="ts">
// 页面逻辑
</script>

<template>
  <div class="h-full p-6">
    <!-- 页面内容 -->
    <div class="bg-background rounded-lg border p-6">
      <h1>页面标题</h1>
    </div>
    
    <!-- 可选：使用 Teleport 在面包屑右侧显示内容 -->
    <Teleport to="#breadcrumb-actions" defer>
      <div class="flex items-center gap-2">
        <!-- 自定义操作按钮或统计数据 -->
      </div>
    </Teleport>
  </div>
</template>
```

#### 步骤 3：注册页面组件到 App.vue

```typescript
// 在 App.vue 中导入
import History from '@/components/pages/workspace/History.vue'

// 添加到 pageComponents 映射
const pageComponents: Record<string, any> = {
  TodoList,
  History,  // 新增
  // ...其他页面
}
```

#### 步骤 4：更新导航映射

在 `src/composables/useNavigation.ts` 的 `pageMap` 中添加映射：

```typescript
const pageMap: Record<string, string> = {
  '待办清单': 'TodoList',
  '历史记录': 'History',  // 新增：中文标题 -> 组件名
  // ...
}
```

---

### 二、修改侧边栏菜单

编辑 `src/config/sidebar.ts` 中的 `defaultSidebarConfig`：

#### 添加新的导航项

```typescript
{
  id: 'new-feature',
  title: '新功能',
  url: '#',
  icon: SomeIcon,
  isOpen: false,
  items: [
    { id: 'sub-1', title: '子菜单1', url: '#' },
    { id: 'sub-2', title: '子菜单2', url: '#' },
  ],
},
```

#### 配置团队权限

在 `teams` 数组中设置各团队可见的菜单：

```typescript
{
  name: '新团队',
  logo: SomeIcon,
  plan: '描述',
  permissions: {
    navMain: ['workspace', 'new-feature'],  // 可见的导航ID
    navItems: {
      'workspace': ['todo']  // 可见的子菜单ID
    },
    projects: ['data-dictionary']  // 可见的项目ID
  }
},
```

---

### 三、使用 Teleport 传送门

页面可以通过 Teleport 将内容传送到面包屑旁边的操作区域：

```vue
<template>
  <!-- 页面主内容 -->
  <div class="h-full">
    <!-- Teleport 到 header 右侧 -->
    <Teleport to="#breadcrumb-actions" defer>
      <div class="flex items-center gap-4">
        <Button>操作按钮</Button>
        <span class="text-sm">统计信息</span>
      </div>
    </Teleport>
    
    <!-- 实际页面内容 -->
    <div class="p-6">...</div>
  </div>
</template>
```

**注意：** 使用 `defer` 属性确保目标元素已挂载。

---

### 四、设置详情页（第三级面包屑）

当需要从列表页进入详情页时：

```typescript
import { useNavigation } from '@/composables/useNavigation'

const { setDetailTitle } = useNavigation()

// 进入详情页时设置标题
const goToDetail = (item: any) => {
  setDetailTitle(`订单 #${item.id}`)  // 显示为：工作台 > 待办清单 > 订单 #123
}

// 返回列表时清除
const goBack = () => {
  setDetailTitle(null)
}
```

---

### 五、添加新的 UI 组件

使用 shadcn-vue CLI 添加组件：

```bash
# 添加单个组件
npx shadcn-vue@latest add button

# 添加多个组件
npx shadcn-vue@latest add badge table dialog --yes
```

组件将自动安装到 `src/components/ui/` 目录。

---

## 🚀 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 类型检查
npm run type-check
```

---

## 📦 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 下一代前端构建工具
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Supabase** - 开源 Firebase 替代品 (Auth + DB)
- **Pinia** - Vue 的专属状态管理库
- **Shadcn-Vue** - 可定制的 Vue UI 组件库
- **Lucide Icons** - 精美的图标库

---

## 📌 Git 操作参考

```bash
# 重命名仓库后需要更新：
# package.json、index.html、package-lock.json 中的 name

# 1. 先删除现有的 origin
git remote remove origin

# 2. 再创建新仓库并设置 origin
gh repo create shadcn-work --public --source=. --remote=origin && git push -u origin main

# 3. 提交代码
git add . && git commit -m "" && git push origin main
```

---

## 许可证

MIT License
