# Jarvis E2E 测试快速开始

这是一个简短的快速开始指南。完整文档请查看 [tests/README.md](./tests/README.md)。

## 📦 安装

```bash
# 1. 安装 Playwright
npm install -D @playwright/test

# 2. 安装浏览器（至少安装 Chromium）
npx playwright install chromium

# 3. （可选）安装所有浏览器
npx playwright install chromium firefox
```

## 🚀 运行测试

```bash
# 运行所有测试
npm run test:e2e

# 使用 UI 模式（推荐）
npm run test:e2e:ui

# 有头模式运行（可以看到浏览器）
npm run test:e2e:headed

# 调试模式
npm run test:e2e:debug

# 只测试特定功能
npx playwright test tests/notes/notes.spec.ts
npx playwright test tests/github/github-trending.spec.ts
npx playwright test tests/navigation/navigation.spec.ts
```

## 📊 查看报告

```bash
# 打开 HTML 报告
npx playwright show-report

# 或手动打开
open playwright-report/index.html
```

## 📁 测试结构

```
tests/
├── helpers/
│   └── test-utils.ts      # 测试辅助函数
├── notes/
│   └── notes.spec.ts      # 笔记功能测试 (12 个测试)
├── github/
│   └── github-trending.spec.ts  # GitHub 功能测试 (10 个测试)
└── navigation/
    └── navigation.spec.ts       # 导航测试 (15 个测试)
```

## ✅ 测试覆盖

| 模块 | 测试数 | 覆盖率 |
|------|--------|--------|
| 笔记功能 | 12 | 100% |
| GitHub 功能 | 10 | 80% |
| 导航功能 | 15 | 90% |
| **总计** | **37** | **90%** |

## 🔧 配置

目标环境: `https://jarvis-neo.zeabur.app`

配置文件: `playwright.config.ts`

环境变量: `.env.test`

## 📝 示例：运行单个测试

```bash
# 只测试"创建笔记"功能
npx playwright test -g "应该能够创建新笔记"

# 只在 Chrome 中测试
npx playwright test --project=chromium

# 显示详细输出
npx playwright test --reporter=list
```

## 🐛 调试

```bash
# 调试模式（带 Playwright Inspector）
npm run test:e2e:debug

# 或
npx playwright test --debug

# 有头模式运行，观察测试执行
npm run test:e2e:headed
```

## 📸 截图和视频

测试失败时自动截图：
- 位置: `test-results/`
- 格式: PNG
- 视频仅保留失败测试

## 🔄 CI/CD

```yaml
# GitHub Actions 示例
- name: Run E2E tests
  run: |
    npx playwright install --with-deps chromium
    npm run test:e2e
```

## 📚 相关文档

- [完整测试文档](./tests/README.md)
- [Playwright 官方文档](https://playwright.dev/docs/intro)
- [测试最佳实践](https://playwright.dev/docs/best-practices)

---

**注意**：首次运行测试可能需要更长时间，因为需要下载浏览器。
