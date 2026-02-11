# 🚀 GitHub 同步快速开始

## ⚡ 快速配置（5分钟）

### 1. 获取 GitHub Token

访问 https://github.com/settings/tokens

- 点击 **Generate new token** → **Generate new token (classic)**
- 名称：`jarvis-sync`
- 权限：✅ **repo**
- 复制生成的 token

### 2. 配置环境变量

创建 `.env.local` 文件：

```bash
# GitHub Token
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# GitHub 仓库
GITHUB_REPO_OWNER=your_username
GITHUB_REPO_NAME=jarvis-data
GITHUB_BRANCH=main
```

### 3. 重启服务器

```bash
npm run dev
```

### 4. 验证配置

访问 http://localhost:3000/settings

应该看到 ✅ **已连接** 状态

---

## 📝 测试同步

1. 进入 **笔记** 页面，创建测试笔记
2. 返回 **设置** 页面
3. 点击 **立即同步**
4. 检查 GitHub 仓库，应该看到 `notes/` 文件夹

---

## ❓ 常见问题

**Q: 设置页面显示 "需要在环境变量中配置"？**

A:
1. 检查 `.env.local` 文件是否存在
2. 检查环境变量是否正确
3. 重启服务器：`npm run dev`

**Q: 连接失败？**

A:
1. 验证 Token 是否正确
2. 确认 Token 有 `repo` 权限
3. 检查仓库名称是否正确

---

## 🔒 安全提示

- ⚠️ **永远不要**将 `.env.local` 提交到 Git
- ⚠️ **不要**与他人分享你的 Token
- ✅ 定期轮换 Token

详细文档请查看：[GITHUB_SYNC_CONFIG.md](./GITHUB_SYNC_CONFIG.md)
