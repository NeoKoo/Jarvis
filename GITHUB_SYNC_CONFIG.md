# GitHub 同步配置指南

## 概述

GitHub 同步功能现在使用**环境变量**配置，更加安全且适合生产环境部署。

---

## 快速配置（3步）

### 步骤 1: 创建 GitHub Token

1. 访问：https://github.com/settings/tokens
2. 点击 **Generate new token** → **Generate new token (classic)**
3. 设置名称：`jarvis-sync`
4. 勾选权限：✅ **repo** (Full control of private repositories)
5. 点击底部 **Generate token** 按钮
6. **复制生成的 token**（格式：`ghp_xxxxxxxxx...`）

### 步骤 2: 配置环境变量

在项目根目录创建 `.env.local` 文件（如果不存在）：

```bash
# 复制示例配置
cp .env.local.example .env.local
```

然后编辑 `.env.local` 文件，添加以下配置：

```bash
# GitHub Personal Access Token
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# GitHub 仓库配置
GITHUB_REPO_OWNER=your_github_username
GITHUB_REPO_NAME=jarvis-data
GITHUB_BRANCH=main
```

**配置说明：**

| 变量 | 说明 | 示例 |
|------|------|------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | `ghp_1234567890abcdef` |
| `GITHUB_REPO_OWNER` | 仓库所有者（你的 GitHub 用户名） | `johndoe` |
| `GITHUB_REPO_NAME` | 仓库名称 | `jarvis-data` |
| `GITHUB_BRANCH` | 分支名称（可选，默认 main） | `main` |

### 步骤 3: 重启服务器

```bash
# 停止当前服务器
# Ctrl + C

# 重新启动
npm run dev
```

---

## 验证配置

1. 打开浏览器访问：http://localhost:3000/settings
2. 找到 **GitHub 同步** 卡片
3. 应该看到：
   - ✅ **已连接** 状态
   - 仓库名称：`your_username/jarvis-data`

如果看到 **"需要在环境变量中配置"**，说明：
- 环境变量未设置
- 或服务器未重启

---

## 生产环境部署

### Docker 部署

在 `docker-compose.yml` 或启动命令中添加环境变量：

```yaml
version: '3.8'
services:
  jarvis:
    image: your-registry/jarvis:latest
    environment:
      - GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
      - GITHUB_REPO_OWNER=your_username
      - GITHUB_REPO_NAME=jarvis-data
      - GITHUB_BRANCH=main
    ports:
      - "3000:3000"
```

### Zeabur / Railway / Vercel

在部署平台的环境变量设置中添加：

```
GITHUB_TOKEN = ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_REPO_OWNER = your_username
GITHUB_REPO_NAME = jarvis-data
GITHUB_BRANCH = main
```

---

## 安全最佳实践

### ✅ 推荐

1. **永远不要**将 `.env.local` 提交到 Git
2. 使用不同的 Token 用于开发和生产
3. 定期轮换 Token
4. 为 Token 设置过期时间
5. 使用专用的 GitHub 仓库存储数据

### ❌ 避免

1. 在代码中硬编码 Token
2. 将 Token 提交到公开仓库
3. 使用拥有过多权限的 Token
4. 与他人共享 Token

---

## 故障排查

### 问题：显示 "需要在环境变量中配置"

**原因：** 环境变量未设置或服务器未重启

**解决：**
```bash
# 检查环境变量文件是否存在
ls -la .env.local

# 检查文件内容
cat .env.local | grep GITHUB

# 重启服务器
npm run dev
```

### 问题：连接失败

**原因：** Token 无效或仓库不存在

**解决：**
1. 验证 Token 是否正确复制
2. 确认 Token 有 `repo` 权限
3. 确认仓库名称和所有者正确
4. 尝试在浏览器中访问 GitHub 仓库

### 问题：同步后看不到文件

**原因：** 网络问题或 API 限制

**解决：**
1. 检查网络连接
2. 打开浏览器控制台查看错误
3. 确认 GitHub 仓库可访问

---

## 数据存储结构

同步成功后，你的 GitHub 仓库将包含：

```
jarvis-data/
├── notes/                    # 笔记（Markdown 格式）
│   └── 2025-02/
│       ├── note-1.md
│       └── note-2.md
├── tasks/                    # 任务（JSON 格式）
│   └── 2025-02/
│       └── task-1.json
└── .jarvis-sync.json         # 同步元数据
```

---

## 高级配置

### 使用组织仓库

```bash
GITHUB_REPO_OWNER=myorganization
GITHUB_REPO_NAME=jarvis-data
```

### 使用自定义分支

```bash
GITHUB_BRANCH=sync-branch
```

### 多实例同步

**重要：** 不要同时运行多个实例并启用自动同步，这可能导致冲突。

建议：
1. 每个设备使用不同的仓库
2. 或只在主设备启用自动同步，其他设备手动同步

---

## API 端点

同步功能使用以下内部 API：

- `GET /api/sync` - 获取配置状态
- `POST /api/sync` - 执行同步操作

**注意：** 这些 API 端点仅供内部使用，不需要手动调用。

---

## 更新日志

### v2.0.0 (2025-02-11)
- ✅ GitHub Token 改为环境变量配置
- ✅ 移除 UI 中的 Token 输入
- ✅ 添加服务器端 API 路由
- ✅ 提升安全性
- ✅ 更适合生产环境部署
