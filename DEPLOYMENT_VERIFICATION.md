# 部署前验证机制

本文档说明如何在部署前自动检测构建问题，确保每次提交的代码都能成功部署。

---

## 🎯 目标

**在代码推送到远程仓库之前，就在本地发现并修复所有构建问题。**

---

## 🛡️ 三层防护机制

### 1️⃣ Pre-commit Hook（自动）

**触发时机：** 每次 `git commit` 时自动运行

**检查内容：**
- ✅ ESLint 代码规范检查
- ✅ TypeScript 类型检查
- ✅ Next.js 生产构建
- ✅ 验证 `.next/standalone` 输出（Docker 部署必需）
- ✅ 运行测试套件

**失败行为：** 自动阻止提交，显示错误信息

```bash
# 提交时自动运行
git commit -m "your message"
# Hook 会自动执行所有检查
```

---

### 2️⃣ 本地构建验证（手动）

**用途：** 在推送前手动运行完整的部署验证流程

**检查内容：**
- 所有 pre-commit 检查项
- Docker 镜像构建测试
- 清理和完整重建

```bash
# 运行完整验证
npm run verify

# 或者单独执行各步骤
npm run lint          # ESLint
npm run type-check    # TypeScript
npm run build         # Next.js 构建
npm run test          # 测试
npm run test:docker   # Docker 构建测试
```

---

### 3️⃣ Docker 部署测试（可选）

**用途：** 实际构建并运行 Docker 容器，验证生产环境

**检查内容：**
- Dockerfile 是否正确
- 容器是否能成功启动
- 应用是否在容器中正常运行

```bash
# 测试 Docker 构建
npm run test:docker

# 脚本会：
# 1. 构建 Docker 镜像
# 2. 启动测试容器
# 3. 验证容器运行状态
# 4. 自动清理测试资源
```

---

## 📋 日常工作流程

### 方案 A：快速迭代（使用 pre-commit hook）

```bash
# 1. 修改代码
vim some-file.ts

# 2. 尝试提交（hook 自动检查）
git add .
git commit -m "feat: add new feature"

# → 如果有错误，hook 会阻止提交并显示问题
# → 修复错误后再次提交
```

**优点：** 自动化，无需额外命令
**缺点：** 构建可能需要几秒钟

---

### 方案 B：推送前完整验证（推荐）

```bash
# 1. 开发和提交（可以暂时跳过 hook）
vim some-file.ts
git add .
git commit -m "feat: add new feature"
git commit --no-verify  # 跳过 hook（仅在需要时）

# 2. 推送前运行完整验证
npm run verify

# 3. 如果验证通过，推送代码
git push
```

**优点：** 更全面的检查，包括 Docker 测试
**缺点：** 需要手动运行命令

---

### 方案 C：关键部署前测试

```bash
# 1. 完成开发后
git add .
git commit -m "feat: major feature"

# 2. 运行 Docker 测试（最接近生产环境）
npm run test:docker

# 3. 测试通过后推送
git push
```

**优点：** 真实模拟部署环境
**缺点：** 需要安装 Docker，构建时间较长

---

## 🔧 脚本说明

### `.git/hooks/pre-commit`

Git pre-commit hook，在每次提交前自动运行。

**检查项：**
1. ESLint 代码规范
2. TypeScript 类型检查
3. Next.js 构建和 standalone 输出
4. 测试套件（如果存在）

**位置：** `.git/hooks/pre-commit`

---

### `scripts/verify-build.sh`

完整的构建验证脚本，模拟部署流程。

**功能：**
- 清理旧构建
- 安装/检查依赖
- 代码质量检查
- Next.js 构建
- 验证构建输出
- Docker 构建测试（如果安装了 Docker）
- 运行测试

**用法：**
```bash
npm run verify
# 或
./scripts/verify-build.sh
```

---

### `scripts/test-docker-build.sh`

Docker 构建和容器测试脚本。

**功能：**
- 构建 Docker 镜像
- 启动测试容器
- 验证容器运行
- 清理测试资源

**用法：**
```bash
npm run test:docker
# 或
./scripts/test-docker-build.sh
```

---

## 🚀 常见场景

### 场景 1：修改了 Next.js 配置

```bash
# 修改 next.config.js 后
git add next.config.js
git commit -m "fix: enable standalone output"

# Hook 会自动验证构建是否成功
```

### 场景 2：添加新功能

```bash
# 开发功能
vim src/components/NewFeature.tsx

# 运行类型检查
npm run type-check

# 如果通过，提交
git add .
git commit -m "feat: add new feature"
```

### 场景 3：准备发布

```bash
# 完成所有开发后

# 运行完整验证
npm run verify

# 运行 Docker 测试
npm run test:docker

# 所有测试通过后推送
git push
```

---

## ⚙️ 配置选项

### 跳过 pre-commit hook

**仅在紧急情况下使用：**

```bash
git commit --no-verify -m "fix: urgent bug"
```

**注意：** 跳过 hook 可能导致有问题的代码被推送，不推荐。

---

### 调整 hook 检查内容

编辑 `.git/hooks/pre-commit` 文件，可以：

- 添加/移除检查项
- 修改错误处理逻辑
- 调整超时时间

**示例：移除测试检查**

```bash
# 注释掉测试部分
# if [ -d "__tests__" ]; then
#     npm test
# fi
```

---

## 📊 检查项详解

### 1. ESLint（`npm run lint`）

检查代码规范和潜在问题。

**常见错误：**
- 未使用的变量
- 代码格式问题
- 潜在的 bug

**修复方法：**
```bash
# 自动修复部分问题
npm run lint -- --fix

# 或使用 IDE 的 ESLint 集成
```

---

### 2. TypeScript（`npm run type-check`）

检查类型错误。

**常见错误：**
- 类型不匹配
- 缺少类型定义
- API 使用错误

**修复方法：**
- 添加类型注解
- 使用类型断言
- 更新类型定义

---

### 3. Next.js 构建（`npm run build`）

生成生产环境构建。

**关键输出：**
- `.next/standalone/` - Docker 部署必需
- `.next/static/` - 静态资源

**常见错误：**
- 导入路径错误
- 环境变量缺失
- 内存不足

---

### 4. Docker 构建

验证容器化部署。

**常见错误：**
- Dockerfile 语法错误
- 基础镜像不存在
- 文件路径错误

---

## 🎓 最佳实践

### 1. 开发过程中

```bash
# 开启 watch 模式，实时反馈
npm run dev           # 开发服务器
npm run test:watch    # 测试监视模式
```

### 2. 提交前

```bash
# 快速检查（不构建）
npm run lint
npm run type-check
```

### 3. 推送前

```bash
# 完整验证
npm run verify
```

### 4. 发布前

```bash
# Docker 测试
npm run test:docker
```

---

## 🐛 故障排查

### 问题：Pre-commit hook 不执行

**检查：**
```bash
# 确认 hook 有执行权限
ls -l .git/hooks/pre-commit

# 应该显示：-rwxr-xr-x
```

**修复：**
```bash
chmod +x .git/hooks/pre-commit
```

---

### 问题：构建超时

**原因：** 大项目构建可能需要几分钟

**解决：**
- 增加 Node.js 内存限制
- 使用 `--no-verify` 跳过 hook（不推荐）
- 优化项目构建速度

---

### 问题：Docker 构建失败

**检查：**
```bash
# 查看详细错误
docker build -t test .

# 检查 Dockerfile 语法
cat Dockerfile
```

**常见问题：**
- 基础镜像不存在
- 端口冲突
- 文件权限问题

---

## 📚 相关文档

- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Dockerfile 最佳实践](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Git Hooks 文档](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)

---

## 🎯 总结

| 机制 | 触发方式 | 检查范围 | 使用场景 |
|------|---------|---------|---------|
| **Pre-commit Hook** | 自动（每次提交） | 代码质量 + 构建 | 日常开发 |
| **验证脚本** | 手动（`npm run verify`） | 完整流程 + Docker | 推送前验证 |
| **Docker 测试** | 手动（`npm run test:docker`） | 生产环境模拟 | 发布前验证 |

**建议工作流：**

1. **日常开发** → Pre-commit hook 自动检查
2. **推送前** → 运行 `npm run verify`
3. **发布前** → 运行 `npm run test:docker`

这样可以确保每个阶段都有相应的质量保证，避免有问题的代码进入部署流程。

---

**记住：** 在本地发现问题比在生产环境中发现要好得多！
