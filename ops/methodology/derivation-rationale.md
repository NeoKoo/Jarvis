---
description: Why each configuration dimension was chosen — the reasoning behind initial system setup
category: derivation-rationale
created: 2025-02-20
status: active
type: methodology
---
# derivation rationale for software development knowledge system

This system was configured as a software development knowledge management system with support for SaaS and iOS projects.

## Configuration Choices

### Granularity: Moderate

**Why:** 按主题组织 - each development insight stands alone but naturally belongs to a topic area. Atomic granularity would over-decompose; coarse granularity would lose composability.

**Signal:** User stated "按主题组织" and produces 10-20 insights weekly that naturally cluster by theme.

### Organization: Flat

**Why:** Flat structure + 主题 MOCs. Folder-per-project would prevent cross-project learning. Wiki links handle grouping.

**Signal:** Software development benefits from cross-project pattern recognition.

### Linking: Explicit

**Why:** Wiki links connect related notes. 调试记录 needs to link to both problems and solutions. API 文档 needs to link to usage examples.

**Signal:** User emphasized "支持维基链接跳转" and connecting debugging experiences.

### Processing: Moderate

**Why:** Weekly 10-20 insights + auto-capture debugging. Not heavy extraction, but more than simple capture.

**Signal:** User's workflow involves "每周会整理 10-20 条开发心得" and wants auto-capture of debugging problems.

### Navigation: 2-tier

**Why:** Hub → project 主题. Two independent technical worlds (SaaS and iOS) with moderate volume (~500-1000 notes/year).

**Signal:** User manages "SaaS 或者 iOS app 应用" with two "完全独立" technical stacks.

### Schema: Moderate-Dense

**Why:** 7 note types with specific fields. API 文档 needs endpoint, method, parameters, response, 认证方式, 请求示例, 错误码说明. 代码片段 needs language, code, 说明, 相关技术, 使用场景.

**Signal:** User specified "API文档需要结构化一些" and needs "认证方式、请求示例、错误码说明".

### Automation: Full

**Why:** Claude Code platform with hooks and skills. Auto-capture debugging on session end + manual command.

**Signal:** User wants "能自动捕获每次调试的问题和解决方案" (both auto and manual triggers).

## Multi-Domain Structure

**SaaS 项目** and **iOS 项目** as independent domains because:

1. **Different technical stacks** — Web vs. mobile
2. **No shared context** — User stated "是完全独立的"
3. **Separate navigation** — Each domain has its own 主题

## Seven Note Types

The system supports 7 note types based on user needs:

1. **开发心得** — Weekly technical insights (10-20/week)
2. **API文档** — Full structure with endpoint, method, parameters, response, 认证方式, 请求示例, 错误码说明
3. **调试记录** — Auto-captured problems and solutions
4. **架构决策** — Technical choices with trade-offs
5. **代码片段** — Reusable code with explanations (supports all programming languages)
6. **调试流程** — Systematic debugging procedures
7. **第三方库手册** — Library integration and usage

## Auto-Capture Debugging

Two triggers as requested:
1. **调试会话结束** — Session-end hook automatically creates 调试记录
2. **手动 `/arscontexta:捕获调试`** — Manual command for explicit capture

Each debugging record includes:
- 问题描述
- 错误信息
- 解决方案
- 相关技术
- 复现步骤
- 时间戳
- 项目上下文

## Vocabulary Mapping

Universal terms transformed to domain-native:

| Universal | Domain Term |
|-----------|-------------|
| notes | 技术笔记 |
| inbox | 捕获区 |
| archive | 参考资料 |
| reduce | 提取 |
| reflect | 连接 |
| reweave | 更新 |
| verify | 验证 |
| MOC | 主题 |
| description | 摘要 |

## Platform

**Tier:** Claude Code (full automation)
**Skills:** All 26 skills with vocabulary transformation
**Hooks:** SessionStart (orient), PostToolUse (validate), Stop (session capture)

---

Topics:
- [[methodology]]
