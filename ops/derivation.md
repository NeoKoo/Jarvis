---
description: How this knowledge system was derived -- enables architect and reseed commands
created: 2025-02-20
engine_version: "1.0.0"
---

# System Derivation

## Configuration Dimensions
| Dimension | Position | Conversation Signal | Confidence |
|-----------|----------|--------------------|--------------------|
| Granularity | Moderate | "按主题组织" - 每条开发心得独立但归属于主题 | High |
| Organization | Flat | 软件开发推荐平坦结构，维基链接避免文件夹重组破坏链接 | High |
| Linking | Explicit | "调试经验需要关联问题和解决方案，API 文档需要关联使用场景" | High |
| Processing | Moderate | "每周整理10-20条" + 自动捕获调试问题 | High |
| Navigation | 2-tier | "两个完全独立的技术世界" + 主题组织 | High |
| Maintenance | Condition-based | 软件开发标准配置 | Default |
| Schema | Moderate-Dense | "API文档需要结构化" + 7种笔记类型 | High |
| Automation | Full | Claude Code 平台 | High |

## Personality Dimensions
| Dimension | Position | Signal |
|-----------|----------|--------|
| Warmth | Neutral | 技术文档，保持专业 |
| Opinionatedness | Neutral | 技术知识管理，无倾向性 |
| Formality | Professional | 技术文档保持专业性 |
| Emotional Awareness | Task-focused | 技术领域，任务聚焦 |

## Vocabulary Mapping
| Universal Term | Domain Term | Category |
|---------------|-------------|----------|
| notes | 技术笔记 | folder |
| inbox | 捕获区 | folder |
| archive | 参考资料 | folder |
| note (type) | 开发心得, API文档, 调试记录, 架构决策, 代码片段, 调试流程, 第三方库手册 | note type |
| reduce | 提取 | process phase |
| reflect | 连接 | process phase |
| reweave | 更新 | process phase |
| verify | 验证 | process phase |
| validate | 校验 | process phase |
| rethink | 重新审视 | process phase |
| MOC | 主题 | navigation |
| description | 摘要 | schema field |
| topics | 主题分类 | schema field |

## Platform
- Tier: Claude Code
- Automation level: full
- Automation: full (default)

## Active Feature Blocks
- [x] wiki-links -- always included (kernel)
- [x] maintenance -- always included (always)
- [x] self-evolution -- always included (always)
- [x] session-rhythm -- always included (always)
- [x] templates -- always included (always)
- [x] ethical-guardrails -- always included (always)
- [x] processing-pipeline -- moderate processing with auto-capture
- [x] schema -- moderate-dense schema for 7 note types
- [x] mocs -- 2-tier navigation
- [x] multi-domain -- SaaS and iOS as separate domains
- [ ] semantic-search -- not enabled (keyword search sufficient for this scale)
- [ ] personality -- neutral-helpful default

## Coherence Validation Results
- Hard constraints checked: 3. Violations: none
- Soft constraints checked: 7. Auto-adjusted: none. User-confirmed: none
- Compensating mechanisms active: none

## Failure Mode Risks
- Collector's Fallacy (HIGH) - 每周10-20条心得，捕获区可能积累过快
- Orphan Drift (MEDIUM) - 7种笔记类型，需要确保维基链接连接
- Schema Erosion (MEDIUM) - 多种schema需要模板和验证
- Productivity Porn (LOW) - 技术笔记服务于开发，不是元工作

## Generation Parameters
- Folder names: 技术笔记, 捕获区, 参考资料, self, templates, ops
- Skills to generate: all 26 with vocabulary transformation (捕获调试, 提取, 连接, 更新, 验证, etc.)
- Hooks to generate: orient, capture, validate, commit, session-capture
- Templates to create: 7 types (开发心得, API文档, 调试记录, 架构决策, 代码片段, 调试流程, 第三方库手册)
- Topology: single-agent with auto-capture debugging

## Note Type Details
1. **开发心得** - 每周10-20条，按主题组织
2. **API文档** - 结构化字段（endpoint, method, parameters, response, 认证方式, 请求示例, 错误码说明）
3. **调试记录** - 自动捕获（问题描述, 错误信息, 解决方案, 相关技术, 复现步骤, 时间戳）
4. **架构决策** - 背景, 决策内容, 技术选型, trade-offs, 影响范围
5. **代码片段** - language, code, 说明, 相关技术, 使用场景（支持所有编程语言）
6. **调试流程** - 目标, 步骤, 工具, 注意事项
7. **第三方库手册** - 库名, 版本, 核心功能, 集成方式, 常见问题

## Domain Structure
- **SaaS项目** - 后端开发, 前端开发, DevOps, API文档集合
- **iOS项目** - SwiftUI, UIKit, 网络与存储, Apple API
- **通用技术** - 代码片段库, 调试流程, 架构设计, 第三方库

## Auto-Capture Debugging
- Trigger 1: 调试会话结束时自动总结
- Trigger 2: 手动命令 `/arscontexta:捕获调试`
- Auto-extract: 错误信息, 问题上下文, 时间戳, 项目上下文
- Auto-link: 连接到相关技术主题
