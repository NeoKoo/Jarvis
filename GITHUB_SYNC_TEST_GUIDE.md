# GitHub 同步功能测试指南

## 测试前准备

### 1. 创建测试仓库
在 GitHub 上创建一个新仓库（例如 `jarvis-data-test`）

### 2. 创建 Personal Access Token
1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 设置名称：`jarvis-test`
4. 勾选权限：✅ `repo` (Full control of private repositories)
5. 点击生成并复制 token

---

## 测试步骤

### 测试 1: 配置连接
1. 打开浏览器访问 http://localhost:3000
2. 点击导航栏进入「设置」页面
3. 找到「GitHub 同步」卡片
4. 填写：
   - **Personal Access Token**: `ghp_xxxxx...`
   - **仓库所有者**: 你的 GitHub 用户名
   - **仓库名称**: `jarvis-data-test`
5. 点击「测试连接」
6. ✅ 应该看到 "连接成功！"
7. 点击「保存配置」

### 测试 2: 同步笔记
1. 进入「笔记」页面
2. 创建几条测试笔记：
   - "测试笔记 1": 一些内容...
   - "测试笔记 2": 其他内容...
3. 返回「设置」页面
4. 点击「立即同步」按钮
5. ✅ 应该看到提示：`同步成功！笔记: ↑2 ↓0`

### 测试 3: 验证 GitHub 仓库
1. 打开你的 GitHub 仓库
2. 应该看到：
   ```
   jarvis-data-test/
   ├── notes/
   │   └── 2025-02/
   │       ├── {uuid}-1.md
   │       └── {uuid}-2.md
   └── .jarvis-sync.json
   ```
3. 点击查看笔记文件，应该是 Markdown 格式

### 测试 4: 下载远程数据
1. 在 GitHub 上手动创建一个笔记：
   ```bash
   # 在仓库中创建文件
   mkdir -p notes/2025-02
   echo '---
id: manual-note-1
tags: ["test"]
createdAt: 2025-02-11T00:00:00.000Z
updatedAt: 2025-02-11T00:00:00.000Z
isAiGenerated: false
---

# 手动创建的笔记

这是从 GitHub 手动创建的测试笔记
' > notes/2025-02/manual-note-1.md
   ```
2. 在应用中点击「立即同步」
3. ✅ 进入「笔记」页面，应该能看到新下载的笔记

### 测试 5: 同步任务
1. 进入「任务」页面
2. 创建几个测试任务
3. 返回「设置」点击「立即同步」
4. ✅ 应该看到：`同步成功！任务: ↑X ↓0`
5. GitHub 仓库中应该出现 `tasks/2025-02/` 目录

### 测试 6: 自动同步
1. 在设置中启用「自动同步」
2. 进入「笔记」页面
3. 添加新笔记
4. 检查 GitHub 仓库，应该自动更新

### 测试 7: 冲突处理（高级）
1. 在应用中编辑一个笔记
2. 同时在 GitHub 上修改同一个笔记
3. 在应用中点击「立即同步」
4. ✅ 应该检测到冲突并使用本地版本

---

## 预期结果

### 成功标志
- ✅ 所有文件正确上传到 GitHub
- ✅ 文件格式正确（Markdown for notes, JSON for tasks）
- ✅ 同步元数据文件 `.jarvis-sync.json` 正确更新
- ✅ 自动同步功能正常工作

### 常见问题

**问题：连接失败**
- 检查 token 是否正确
- 检查仓库名称和所有者是否正确
- 确认 token 有 `repo` 权限

**问题：同步后看不到文件**
- 检查网络连接
- 打开浏览器控制台查看错误
- 确认 GitHub 仓库可访问

**问题：自动同步不工作**
- 确认已在设置中启用自动同步
- 检查浏览器 localStorage 是否有配置
- 刷新页面后重试

---

## 测试完成后

清理测试数据：
1. 在 GitHub 删除测试仓库
2. 在应用设置中点击「断开连接」
3. 或清除应用数据

---

## API 调试

在浏览器控制台中运行：

```javascript
// 检查同步状态
const { useSyncStore } = await import('/stores/sync-store.ts');
const state = useSyncStore.getState();
console.log('Sync Config:', state.config);
console.log('Is Enabled:', state.isEnabled);
console.log('Last Sync:', state.lastSyncAt);

// 手动触发同步
await state.sync(notes, tasks);
```
