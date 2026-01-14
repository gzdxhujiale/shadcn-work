# 用户编程操作手册 (User Programming Manual)

本文档旨在指导开发者如何基于现有的配置化架构（以 `Withdraw.vue` 为例）快速扩展和维护页面功能，特别是如何新增筛选条件（输入框、下拉框、时间段选择）。

---

## 核心架构说明

目前的筛选区域采用 **配置驱动 (Configuration Driven)** 的设计模式。这意味着 UI 的渲染是由数据配置决定的，而不是硬编码在 HTML 模板中。

主要涉及三个核心部分：
1. **选项常量**：定义下拉框的内容。
2. **响应式状态 (`filters`)**：存储用户当前选择或输入的值。
3. **筛选配置 (`filterConfigs`)**：定义界面上显示哪些控件、什么类型以及它们的标签。

---

## 快速上手：如何新增筛选条件

假设我们需要新增一个筛选条件：**“支付渠道”** (Payment Channel)。

### 第一步：定义选项常量 (仅适用于下拉框)

如果新增的是下拉框，首先在 `<script setup>` 顶部定义选项数组。

```typescript
// ... 其他常量
const PAY_CHANNEL_OPTIONS = ['全部', '微信', '支付宝', '银行卡']
```

### 第二步：在 `filters` 中声明状态

在 `reactive` 定义的 `filters` 对象中添加一个新的字段，用于存储该筛选条件的值。关键是 `key` 的命名（例如 `payChannel`）。

```typescript
const filters = reactive({
  // ... 原有字段
  userId: '',
  // ...
  
  // [新增] 支付渠道，默认为 '全部'
  payChannel: '全部', 
})
```

> **注意**：
> - 文本输入框 (Input) 默认值建议为空字符串 `''`。
> - 下拉框 (Select) 默认值建议为 `'全部'`。
> - 时间段 (DateRange) 默认值建议为 `undefined`，但在类型定义中需要注意（见下文）。

### 第三步：在 `filterConfigs` 中添加配置

在 `filterConfigs` 数组中添加一个配置对象。这个对象决定了控件在界面上的显示位置和类型。

```typescript
const filterConfigs: FilterConfig[] = [
  // ... 原有配置
  
  // [新增] 支付渠道配置
  { 
    key: 'payChannel',          // 必须与 filters 中的 key 一致
    type: 'select',             // 类型支持: 'input' | 'select' | 'date-range'
    label: '支付渠道',           // 界面显示的标签名
    options: PAY_CHANNEL_OPTIONS // 下拉框的选项数据
  },
]
```

**完成以上三步后，界面上就已经会出现新的筛选框了！**

---

### 第四步：关联数据过滤逻辑

为了让筛选真正生效（即不仅仅是显示控件，而是能过滤表格数据），需要在 `filteredData` 计算属性中添加对应的判断逻辑。

找到 `filteredData` 的定义处：

```typescript
const filteredData = computed(() => {
  return withdrawData.value.filter((item) => {
    // ... 原有逻辑
    
    // [新增] 支付渠道筛选逻辑
    // 假设 item 数据中有一个字段叫 payMethod 对应支付渠道
    if (filters.payChannel !== '全部' && item.payMethod !== filters.payChannel) {
      return false
    }
    
    return true
  })
})
```

---

## 进阶：新增时间段筛选

新增时间段筛选（如“审核时间”）稍有不同，主要在于类型的处理。

1. **更新 `filters`**：
   ```typescript
   import type { DateRange } from 'radix-vue'
   
   const filters = reactive({
     // ...
     auditTime: undefined as DateRange | undefined, // 必须显式声明类型
   })
   ```

2. **更新 `filterConfigs`**：
   ```typescript
   { 
     key: 'auditTime', 
     type: 'date-range', 
     label: '审核时间' 
   }
   ```

3. **更新过滤逻辑**：
   在 `filteredData` 中，你需要使用 `date-fns` 或其他库来比较时间。
   ```typescript
   // 伪代码示例
   if (filters.auditTime?.start && filters.auditTime?.end) {
     const itemDate = new Date(item.auditTime)
     // 注意处理时区和日期比较边界
     if (itemDate < filters.auditTime.start || itemDate > filters.auditTime.end) {
       return false
     }
   }
   ```

---

## 常见问题

**Q: 为什么我加了配置，输入框没出来？**
A: 请检查 `filterConfigs` 是否正确添加了对象，且没有语法错误。

**Q: 为什么下拉框选了没反应？**
A: 检查 `filters` 对象中是否定义了对应的 `key`。如果没有定义，Vue 无法进行双向绑定。

**Q: 为什么会有 TypeScript 类型报错？**
A: 由于 `filters` 同时存储字符串和日期对象，有时在模板中直接使用 `filters[key]` 会导致类型推断错误。建议使用我们封装好的辅助函数：
- `getStringValue(key)`：用于 Input 和 Select。
- `getDateRangeValue(key)`：用于 DateRange。
- `setDateRangeValue(key, val)` / `setStringValue(key, val)`：用于更新值。

---

## 2026-01-12 更新：低代码配置与新型筛选组件

本次更新引入了可视化的配置管理页面 (`Settings.vue`) 和新的树形选择组件 (`FilterTreeSelect.vue`)，大大简化了页面开发流程。

### 1. 使用 Settings 页面进行可视化配置

现在，您可以直接在运行时的 `Settings` 页面（侧边栏配置入口）进行页面的配置，所有配置将自动同步到云端数据库 (Supabase)，实现多用户隔离的持久化存储。

**工作流：**

1.  **可视化编辑**：在 Settings 页面选择对应的导航项。
2.  **实时预览**：添加/编辑筛选条件、修改表格列配置，页面会自动保存到本地存储 (`localStorage`) 并实时生效。
3.  **保存到云端**：配置满意后，点击页面顶部面包屑区域的 **"保存"** 按钮，将当前配置同步到 Supabase 云数据库。
4.  **多端加载**：用户登录后，系统会自动优先从云端加载配置，确保在不同设备上拥有一致的体验。

**配置加载优先级：**
`Supabase 云端配置` > `localStorage 本地缓存` > `代码默认配置 (page1.ts)`

**导入/导出功能：**
- **导出**：将当前配置导出为 JSON 文件，用于备份或分享。
- **导入**：加载 JSON 配置文件，系统会提示确认覆盖，确认后将自动同步保存到云端。

### 2. 新增 TreeSelect (树形下拉框) 筛选类型

我们新增了 `tree-select` 类型，用于处理层级数据的筛选。

#### 配置结构 (`FilterConfig`)

在 `FilterConfig` 接口中，新增了 `treeOptions` 字段：

```typescript
export interface TreeNode {
    value: string
    label: string
    children?: TreeNode[]
}

export interface FilterConfig {
    // ...
    type: 'input' | 'select' | 'date-range' | 'tree-select' // 新增 tree-select
    treeOptions?: TreeNode[]                                // 仅用于 tree-select 类型
}
```

#### 在 Settings 中配置 TreeSelect

在添加/编辑筛选项时：
1.  **类型**选择 "树形下拉框"。
2.  **树形选项配置 (JSON)**：在文本框中输入符合 `TreeNode[]` 结构的 JSON 数据。

**JSON 示例：**
```json
[
  {
    "value": "1",
    "label": "一级部门 A",
    "children": [
      {
        "value": "1-1",
        "label": "二级部门 A-1",
        "children": []
      }
    ]
  },
  {
    "value": "2",
    "label": "一级部门 B"
  }
]
```

### 3. 组件实现细节

*   **FilterTreeSelect.vue**：基于 `Popover` 实现，支持无限层级递归渲染，但建议层级不要超过 3 层以保证体验。
*   **TreeSelect UI**：支持节点展开/折叠，选中状态会有 Check 图标提示。如果不选择，默认显示 Placeholder 或第一个节点的 Label（逻辑可定制）。

### 4. 数据流变动

*   **ConfigStore**：现在全权管理页面配置，支持从 `localStorage` 恢复状态。
*   **Page1.vue**：完全响应式地根据 `ConfigStore` 中的配置渲染 UI，包括动态加载 `FilterTreeSelect` 组件。
