---
description: How I process, connect, and maintain technical knowledge
type: moc
---

# methodology

## Principles

- **Prose-as-title** — Every 技术笔记 is a proposition titled as a complete sentence
- **Wiki links** — Connections as graph edges, not just references
- **主题** — Attention management hubs for navigating knowledge
- **Capture fast, process slow** — Zero-friction capture in 捕获区/, thoughtful extraction to 技术笔记/

## My Process

### 1. Capture (捕获区/)

Everything starts here. URLs, quick ideas, sources, debugging sessions. Zero friction.

### 2. 提取

Transform raw content into structured 技术笔记:

| Category | What I Extract |
|----------|----------------|
| 开发心得 | Technical insights, patterns, best practices |
| API 文档 | Endpoint, method, parameters, response, examples |
| 调试记录 | Problems, errors, solutions, root causes |
| 架构决策 | Technical choices, trade-offs, impact |
| 代码片段 | Reusable code with explanations |
| 调试流程 | Systematic debugging procedures |
| 第三方库手册 | Library integration and usage |

### 3. 连接

- **Forward connections** — What existing notes relate to this new one?
- **Backward connections** — What old notes need updating?
- **主题 updates** — Add to relevant 主题 with context phrases

### 4. 更新

Reweave old notes in light of new understanding. A note written last month was written with last month's knowledge.

### 5. 验证

Three checks:
- **Description quality** — Does 摘要 add information beyond the title?
- **Schema compliance** — All required fields present?
- **Health check** — No broken wiki links, no orphaned notes

## Auto-Capture Debugging

I automatically capture debugging problems through two triggers:

1. **调试会话结束** — Session-end hook creates 调试记录 with problem, error, solution, context
2. **Manual `/arscontexta:捕获调试`** — Explicit capture command at any time

Each debugging record includes:
- 问题描述
- 错误信息
- 解决方案
- 相关技术
- 复现步骤
- 时间戳
- 项目上下文

---

Topics:
- [[identity]]
- [[goals]]
