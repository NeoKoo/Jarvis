# Qwen API 错误修复文档

## 问题描述

部署后出现大量 Qwen API 错误：
- **错误信息**：`Either "prompt" or "messages" must exist and cannot both be none`
- **HTTP 状态码**：502 Bad Gateway
- **影响接口**：`/api/github/save-to-note` 和 `/api/daily-digest`

## 根本原因

1. **缺少配置验证** - 在调用 Qwen API 之前没有验证 API key 是否配置
2. **空消息风险** - 某些边缘情况下可能传递空的 `messages` 数组
3. **错误处理不足** - 没有充分的降级处理机制

## 修复内容

### 1. AI Pipeline 增强 (`lib/digest/ai-pipeline.ts`)

**添加的验证函数：**

```typescript
// 验证 Qwen 配置
function validateQwenConfig(): boolean {
  const isConfigured = qwenClient.isConfigured();
  if (!isConfigured) {
    console.error('[AI Pipeline] QWEN_API_KEY is not configured');
    return false;
  }
  return true;
}

// 验证消息有效性
function validateMessages(messages: Message[]): boolean {
  if (!messages || messages.length === 0) {
    console.error('[AI Pipeline] No messages provided');
    return false;
  }

  const hasValidContent = messages.some(msg => msg.content && msg.content.trim().length > 0);
  if (!hasValidContent) {
    console.error('[AI Pipeline] All messages have empty content');
    return false;
  }

  return true;
}
```

**修改的函数：**
- `processArticleWithAI()` - 添加配置和消息验证
- `processArticlesBatch()` - 添加配置和消息验证，失败时返回 fallback
- `generateArticleSummary()` - 添加配置检查
- `generateRecommendationReason()` - 添加配置检查
- `generateTrends()` - 添加配置检查
- `generateDailySummary()` - 添加配置检查

### 2. GitHub Save-to-Note 路由 (`app/api/github/save-to-note/route.ts`)

**修复内容：**
- 在调用 Qwen API 之前检查配置
- 如果未配置，直接使用基础笔记格式（不调用 AI）
- 添加消息内容验证

### 3. Daily Digest Save-Article 路由 (`app/api/daily-digest/save-article/route.ts`)

**修复内容：**
- 在调用 Qwen API 之前检查配置
- 如果未配置，使用基础笔记格式
- 添加消息内容验证

## 降级策略

当 Qwen API 不可用时，所有功能都会优雅降级：

### Daily Digest
```typescript
// 返回基础格式文章，不进行 AI 处理
return createBasicDigest(rawArticles);
```

### GitHub Save-to-Note
```typescript
// 保存基础笔记，不使用 AI 增强
const basicNote = {
  title: `${repository.fullName} - GitHub 仓库笔记`,
  content: `# ${repository.fullName}\n...`,
  isAiGenerated: false,
};
```

### Save Article
```typescript
// 保存基础笔记格式
const basicNote = {
  title: article.title,
  content: `# ${article.title}\n...`,
  isAiGenerated: false,
};
```

## 测试验证

### 1. 本地测试

```bash
# 运行 Qwen API 连接测试
npx tsx test-qwen-api.ts

# 运行修复验证脚本
chmod +x scripts/test-api-fix.sh
./scripts/test-api-fix.sh
```

### 2. 部署测试

部署后访问：
- http://your-domain/settings - 检查环境变量配置
- http://your-domain/ - 检查 Daily Digest 是否正常加载
- 点击 GitHub 仓库保存 - 检查是否正常工作

## 环境变量配置

确保以下环境变量已正确配置：

```bash
# .env.local 或生产环境变量
QWEN_API_KEY=sk-your-real-api-key-here
QWEN_API_BASE_URL=https://dashscope.aliyuncs.com/api/v1
```

## 错误日志改进

修复后，错误日志会更清晰：

```
[AI Pipeline] QWEN_API_KEY is not configured
[AI Pipeline] Using fallback articles
[GitHub Save] Qwen not configured, using basic note
[Article Save] Qwen not configured, using basic note
```

而不是：
```
Either "prompt" or "messages" must exist and cannot both be none
```

## 预防措施

为避免类似问题，所有新的 AI API 调用应：

1. ✅ **验证配置** - 调用前检查 `isConfigured()`
2. ✅ **验证参数** - 确保所有必需参数存在且非空
3. ✅ **添加降级** - 提供 fallback 方案
4. ✅ **详细日志** - 记录足够的调试信息
5. ✅ **超时控制** - 设置合理的超时时间
6. ✅ **重试机制** - 使用指数退避重试

## 相关文件

修改的文件：
- `lib/digest/ai-pipeline.ts`
- `app/api/github/save-to-note/route.ts`
- `app/api/daily-digest/save-article/route.ts`

测试文件：
- `test-qwen-api.ts`
- `scripts/test-api-fix.sh`

文档：
- `docs/QWEN_API_FIX.md` (本文档)

## 更新日期

2026-02-20

## 作者

Claude Code (Sonnet 4.5)
