# 🧪 快速测试指南

## ✅ 服务器状态
- **URL**: http://localhost:3000
- **状态**: 运行中
- **GitHub 同步**: 已加载

---

## 📋 测试步骤（5分钟）

### 步骤 1: 配置 GitHub Token (2分钟)

1. **获取 Token**
   ```
   访问: https://github.com/settings/tokens
   点击: Generate new token → Generate new token (classic)
   名称: jarvis-test
   权限: ✅ repo (Full control)
   复制生成的 token
   ```

2. **在应用中配置**
   - 打开: http://localhost:3000/settings
   - 找到 "GitHub 同步" 卡片
   - 填写:
     - Token: `ghp_xxxxx...`
     - 仓库所有者: 你的 GitHub 用户名
     - 仓库名称: `jarvis-data-test`
   - 点击 "测试连接"
   - ✅ 看到 "连接成功！"

### 步骤 2: 创建测试数据 (1分钟)

1. 打开: http://localhost:3000/notes
2. 点击 "新建笔记"
3. 创建 2 条测试笔记

### 步骤 3: 测试同步 (1分钟)

1. 返回: http://localhost:3000/settings
2. 点击 "立即同步"
3. ✅ 看到: `同步成功！笔记: ↑2 ↓0`

### 步骤 4: 验证 GitHub (1分钟)

1. 打开你的 GitHub 仓库
2. 检查是否有:
   ```
   notes/
     └── 2025-02/
       ├── xxxxx.md
       └── xxxxx.md
   ```

---

## 🐛 浏览器控制台测试

打开浏览器控制台 (F12)，粘贴以下代码:

```javascript
// 快速测试同步状态
(async () => {
  const { useSyncStore } = await import('/stores/sync-store.ts');
  const state = useSyncStore.getState();

  console.log('🔍 GitHub 同步状态:');
  console.log('✅ 已配置:', state.isEnabled);
  console.log('📦 仓库:', state.config?.owner + '/' + state.config?.repo);
  console.log('⏰ 上次同步:', state.lastSyncAt);
  console.log('🔄 自动同步:', state.autoSync);

  if (!state.isEnabled) {
    console.log('⚠️ 请先在设置页面配置 GitHub 同步');
  } else {
    console.log('✅ 一切就绪！');
  }
})();
```

---

## 📊 预期结果

| 测试项 | 预期结果 | 检查方法 |
|--------|----------|----------|
| 配置页面 | 显示 GitHub 同步卡片 | 访问 /settings |
| 连接测试 | "连接成功！" | 点击测试连接按钮 |
| 数据上传 | ↑数字显示 | 同步后查看提示 |
| GitHub 仓库 | 出现 notes/ 文件夹 | 访问 GitHub 仓库 |

---

## ❓ 常见问题

**Q: 连接失败？**
```
A: 检查:
  1. Token 是否正确复制
  2. Token 是否有 repo 权限
  3. 仓库名称是否正确
```

**Q: 同步后看不到文件？**
```
A: 尝试:
  1. 刷新 GitHub 仓库页面
  2. 检查浏览器控制台错误
  3. 确认网络连接正常
```

**Q: 自动同步不工作？**
```
A: 确认:
  1. 设置中已启用 "自动同步"
  2. 添加新笔记后等待几秒
  3. 检查浏览器控制台
```

---

## 🧹 清理测试数据

测试完成后:
1. 在 GitHub 删除测试仓库
2. 在应用设置中点击 "断开连接"
3. 或清除浏览器数据

---

## 📝 完整测试报告模板

```
测试日期: __________
测试者: __________

[ ] 配置页面正常显示
[ ] 连接测试成功
[ ] 笔记上传成功
[ ] 任务上传成功
[ ] GitHub 仓库文件正确
[ ] 自动同步功能正常

遇到的问题:
________________________________________
________________________________________

总体评价: ⭐⭐⭐⭐⭐
```
