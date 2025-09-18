# Luckin 3.x 架构重构计划

## 🎯 重构目标
- 消除代码重复，建立清晰的包边界
- 实现真正的依赖注入和服务管理
- 统一类型系统，提高可维护性
- 建立可扩展的组件架构
- 优化性能和开发体验

## 📦 新包结构设计

### 1. `@lgnixai/luckin-foundation` (核心基础设施)
- **职责**: 依赖注入、事件系统、生命周期管理、错误处理
- **导出**: Container, EventBus, LifecycleManager, LuckinError
- **依赖**: 无外部依赖

### 2. `@lgnixai/luckin-types` (统一类型定义)
- **职责**: 所有接口和类型定义的统一管理
- **导出**: 核心接口、UI接口、服务接口、事件类型
- **依赖**: 仅依赖 foundation

### 3. `@lgnixai/luckin-services` (服务层)
- **职责**: 业务服务实现（编辑器、主题、命令等）
- **导出**: EditorService, ThemeService, CommandService等
- **依赖**: foundation, types

### 4. `@lgnixai/luckin-ui-core` (UI核心)
- **职责**: 基础UI组件、Hooks、Context
- **导出**: 基础组件、UI Hooks、Provider
- **依赖**: foundation, types, services

### 5. `@lgnixai/luckin-components` (高级组件)
- **职责**: 复合组件（Workbench、Explorer、Editor等）
- **导出**: 业务组件
- **依赖**: ui-core, services

### 6. `@lgnixai/luckin-extensions` (扩展系统)
- **职责**: 插件系统、扩展管理
- **导出**: ExtensionManager, Plugin基类
- **依赖**: foundation, types, services

## 🔄 迁移策略
1. 创建新包结构
2. 逐步迁移代码，消除重复
3. 更新依赖关系
4. 删除legacy包
5. 更新文档和示例

## 📋 质量标准
- 每个包职责单一明确
- 依赖关系清晰，无循环依赖
- 完整的类型覆盖
- 统一的错误处理
- 完善的测试覆盖

## 🚀 实施步骤
1. ✅ 架构分析
2. 🔄 包结构重组
3. ⏳ 核心基础设施重构
4. ⏳ 服务层重构
5. ⏳ UI层重构
6. ⏳ 构建优化
7. ⏳ 文档更新