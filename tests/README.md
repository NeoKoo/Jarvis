# Jarvis E2E 测试文档

本文档描述了 Jarvis 应用的端到端（E2E）测试设置和执行指南。

## 📋 目录

- [概述](#概述)
- [测试覆盖](#测试覆盖)
- [环境要求](#环境要求)
- [安装步骤](#安装步骤)
- [运行测试](#运行测试)
- [测试结构](#测试结构)
- [编写新测试](#编写新测试)
- [CI/CD 集成](#cicd-集成)
- [故障排查](#故障排查)

---

## 概述

本测试套件使用 [Playwright](https://playwright.dev/) 框架，针对已部署的应用 `https://jarvis-neo.zeabur.app` 进行端到端测试。

### 测试特点

- ✅ 覆盖核心用户流程
- ✅ 跨浏览器测试（Chrome、Firefox、Safari）
- ✅ 移动端测试
- ✅ 自动截图和视频录制
- ✅ 详细的测试报告
- ✅ 并行执行支持

---

## 测试覆盖

### 1. 笔记功能 (`tests/notes/notes.spec.ts`)

| 测试用例 | 描述 |
|---------|------|
| 创建新笔记 | 填写标题、内容、标签并保存 |
| 编辑笔记 | 修改已有笔记的内容 |
| 删除笔记 | 删除笔记并验证移除 |
| 搜索笔记（标题） | 通过标题搜索笔记 |
| 搜索笔记（内容） | 通过内容搜索笔记 |
| 搜索笔记（标签） | 通过标签搜索笔记 |
| 导出单条笔记 | 导出笔记到剪贴板 |
| 导出所有笔记 | 批量导出所有笔记 |
| 取消操作 | 取消新建笔记 |
| 查看笔记详情 | 点击笔记查看详情 |
| 空状态 | 显示"暂无笔记"提示 |
| 标签管理 | 添加和删除标签 |

### 2. GitHub 热门仓库 (`tests/github/github-trending.spec.ts`)

| 测试用例 | 描述 |
|---------|------|
| 获取热门仓库 | 获取并显示 GitHub 趋势仓库 |
| 保存为笔记 | 将仓库信息保存到笔记知识库 |
| 刷新仓库 | 重新获取最新的热门仓库 |
| 查看仓库详情 | 跳转到 GitHub 页面 |
| 展开/收起描述 | 查看完整仓库描述 |
| 显示仓库信息 | Stars、Forks、更新时间等 |
| 加载状态 | 显示加载动画 |
| 重复保存 | 处理重复保存场景 |
| 所有者信息 | 显示仓库所有者头像和用户名 |
| 查看按钮 | 使用"查看仓库"按钮跳转 |

### 3. 导航和页面加载 (`tests/navigation/navigation.spec.ts`)

| 测试用例 | 描述 |
|---------|------|
| 主页加载 | 验证页面标题、时间、快捷操作 |
| 页面导航 | 从主页导航到各个功能页面 |
| 响应式设计 | 移动端、平板、桌面端显示 |
| 页面性能 | 首次内容绘制时间 |
| PWA 检测 | Service Worker 注册、manifest |
| 可访问性 | 页面标题、语言属性、键盘导航 |

---

## 环境要求

- Node.js 18+
- npm 或 yarn
- 现代浏览器（Chrome、Firefox、Safari）

---

## 安装步骤

### 1. 安装依赖

```bash
cd /Users/neo/Documents/Project/Jarvis
npm install -D @playwright/test
```

### 2. 安装浏览器

```bash
npx playwright install
```

如果需要安装所有浏览器：

```bash
npx playwright install --all-deps
```

### 3. 验证安装

```bash
npx playwright --version
```

应该显示类似：`Version 1.50.0`

---

## 运行测试

### 基础命令

```bash
# 运行所有测试（无头模式）
npm run test:e2e

# 使用 UI 模式查看测试执行
npm run test:e2e:ui

# 有头模式运行（可以看到浏览器）
npm run test:e2e:headed

# 调试模式
npm run test:e2e:debug
```

### 运行特定测试文件

```bash
# 只测试笔记功能
npx playwright test tests/notes/notes.spec.ts

# 只测试 GitHub 功能
npx playwright test tests/github/github-trending.spec.ts

# 只测试导航功能
npx playwright test tests/navigation/navigation.spec.ts
```

### 运行特定测试用例

```bash
# 运行包含特定标题的测试
npx playwright test -g "应该能够创建新笔记"

# 运行特定项目（浏览器）
npx playwright test --project=chromium
npx playwright test --project=webkit
```

### 查看测试报告

```bash
# 打开 HTML 报告
npx playwright show-report

# 或直接打开文件
open playwright-report/index.html
```

---

## 测试结构

```
tests/
├── helpers/
│   ├── setup.ts           # 全局测试设置
│   ├── teardown.ts        # 全局测试拆解
│   └── test-utils.ts      # 测试辅助函数
├── github/
│   └── github-trending.spec.ts  # GitHub 功能测试
├── navigation/
│   └── navigation.spec.ts       # 导航测试
└── notes/
    └── notes.spec.ts            # 笔记功能测试
```

### 测试辅助函数

`tests/helpers/test-utils.ts` 提供以下工具：

- `waitForPageLoad()` - 等待页面完全加载
- `clearAllNotes()` - 清空所有笔记（测试清理）
- `createMockNote()` - 创建测试笔记
- `takeScreenshot()` - 截图
- `waitForToast()` - 等待 Toast 提示
- `fillNoteForm()` - 填写笔记表单
- `navigateTo()` - 导航到指定页面
- `waitForLoading()` - 等待加载完成
- `ensureVisible()` - 确保元素可见
- `ensureHidden()` - 确保元素隐藏

---

## 编写新测试

### 测试模板

```typescript
import { test, expect } from '@playwright/test';
import { navigateTo, ensureVisible } from '../helpers/test-utils';

test.describe('功能名称', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/');
  });

  test('应该完成某项操作', async ({ page }) => {
    // 1. 执行操作
    await page.click('button');

    // 2. 验证结果
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

### 最佳实践

1. **使用辅助函数**：优先使用 `test-utils.ts` 中的辅助函数
2. **清晰的测试名称**：测试名称应该描述用户行为
3. **独立性**：每个测试应该独立运行，不依赖其他测试
4. **清理**：测试后清理数据（使用 `afterEach`）
5. **等待**：使用明确的等待而不是固定延迟
6. **选择器**：使用稳定的 selector（aria-label、data-testid）

### 推荐的选择器策略

```typescript
// ✅ 好：使用文本内容
await page.click('button:has-text("保存")');

// ✅ 好：使用 aria-label
await page.click('[aria-label="关闭"]');

// ✅ 好：使用 data-testid（需要在代码中添加）
await page.click('[data-testid="submit-button"]');

// ❌ 避免：使用 CSS 类（可能变化）
await page.click('.btn-primary');

// ❌ 避免：使用复杂的 XPath
await page.click('//div[@class="container"]/button[1]');
```

---

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## 故障排查

### 问题 1：测试超时

**错误信息**：`Test timeout of 30000ms exceeded`

**解决方案**：
```typescript
// 增加单个测试的超时时间
test('慢速测试', async ({ page }) => {
  test.setTimeout(60000); // 60 秒
  // 测试代码
});

// 或在 playwright.config.ts 中全局配置
use: {
  actionTimeout: 10000,
  navigationTimeout: 30000,
}
```

### 问题 2：元素未找到

**错误信息**：`Element not found`

**解决方案**：
```typescript
// 使用明确的等待
await page.waitForSelector('.my-element', { state: 'visible' });

// 或使用 locator 的 waitFor
await page.locator('.my-element').waitFor({ state: 'visible' });
```

### 问题 3：IndexedDB 操作失败

**错误信息**：IndexedDB 操作失败

**解决方案**：
```typescript
// 确保页面已完全加载
await waitForPageLoad(page);

// 或使用重试机制
await page.reload();
await waitForPageLoad(page);
```

### 问题 4：浏览器未安装

**错误信息**：`Executable doesn't exist`

**解决方案**：
```bash
npx playwright install
```

---

## 测试覆盖率目标

| 功能模块 | 目标覆盖率 | 当前状态 |
|---------|----------|---------|
| 笔记功能 | 100% | ✅ 12/12 |
| GitHub 功能 | 80% | ✅ 10/10 |
| 导航功能 | 90% | ✅ 15/15 |

---

## 相关文档

- [Playwright 官方文档](https://playwright.dev/docs/intro)
- [最佳实践指南](https://playwright.dev/docs/best-practices)
- [API 参考](https://playwright.dev/docs/api/class-playwright)

---

## 更新日志

### 2025-02-21
- ✅ 创建初始测试套件
- ✅ 实现笔记功能测试（12 个测试用例）
- ✅ 实现 GitHub 热门仓库测试（10 个测试用例）
- ✅ 实现导航和页面加载测试（15 个测试用例）
- ✅ 添加测试辅助函数库
- ✅ 配置多浏览器测试

---

**作者**: Claude Code
**最后更新**: 2025-02-21
