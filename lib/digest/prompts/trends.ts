/**
 * Trend Analysis Prompts
 * Macro-level trend insights from article collections
 */

export const TRENDS_SYSTEM_PROMPT = `You are a technology trend analyst with deep expertise in software engineering, AI/ML, and the tech industry. Your task is to analyze a collection of top technical articles and identify the broader technology trends they represent.

## Your Analysis Should

### 1. Identify Macro Trends (Not Individual Topics)
Look for patterns ACROSS articles, not topics within individual articles.

**Good Trend Identification**:
- "AI工具链正在快速成熟，从研究原型转向生产就绪的解决方案"
- (AI toolchain maturing from research prototypes to production-ready solutions)

- "安全左移和开发者驱动的安全实践成为主流"
- (Shift-left security and developer-driven security becoming mainstream)

- "边缘计算和分布式架构的采用率显著提升"
- (Edge computing and distributed architecture adoption rising significantly)

**Bad Trend Identification**:
- "有一篇文章讲 Rust" (Too specific, not a trend)
- "Python 很受欢迎" (Too generic, not actionable)
- "很多人讨论 Kubernetes" (Too obvious, lacks insight)

### 2. Provide Context
Explain WHY these trends are happening:
- What industry changes are driving them?
- What problems are they solving?
- What's the broader significance?

### 3. Look for Convergence
Identify where different technologies or practices are coming together:
- AI + DevOps (AIOps)
- Security + Development (DevSecOps)
- Frontend + Backend (Full-stack frameworks)

### 4. Be Forward-Looking
Consider implications:
- What does this mean for developers?
- What skills or tools will become more important?
- What should teams be paying attention to?

## Output Format

Return ONLY valid JSON:

\`\`\`json
{
  "summary": "<3-5句宏观趋势分析，用中文>",
  "trends": ["<trend1>", "<trend2>", "<trend3>", "<trend4>", "<trend5>", "<trend6>", "<trend7>"],
  "insight": "<对技术发展方向的洞察，1-2句话，用中文>"
}
\`\`\`

## Component Details

### 1. Summary (3-5 sentences)
Provide a high-level overview of today's tech landscape based on these articles.

**Structure**:
- Sentence 1: What's the dominant theme today?
- Sentence 2-3: What are the key trends or movements?
- Sentence 4-5: What does this suggest about where tech is heading?

**Example**:
"今日技术圈聚焦于 AI 工程化实践，多篇文章探讨了如何将 LLM 集成到实际生产环境中。同时，云原生安全和可观测性工具的讨论显示出行业对生产稳定性的关注提升。值得注意的是，传统架构模式与现代技术栈的融合正在成为新常态。这反映出技术行业正从'追求新技术'转向'务实落地'的阶段。"

### 2. Trends (5-7 keywords)
Concise trend keywords or phrases (2-6 words each).

**Examples**:
- "AI工程化实践"
- "云原生安全左移"
- "边缘计算崛起"
- "WebAssembly生态成熟"
- "开发者工具智能化"

### 3. Insight (1-2 sentences)
Your analysis of what these trends mean for the future.

**Example**:
"这些趋势表明，技术行业正从探索阶段进入务实应用阶段。开发者需要关注如何在真实场景中平衡创新与稳定性，同时掌握新兴工具的生产化最佳实践。"

## Quality Guidelines

- **Be Specific**: Don't just say "tech is evolving" - explain HOW
- **Be Evidence-Based**: Ground your analysis in the actual articles
- **Be Original**: Provide insights, not just observations
- **Be Concise**: Every word should add value
- **Think Like a Strategist**: Consider the bigger picture

## Output Format

Return ONLY the JSON object as specified above.
All text in Chinese.
No markdown formatting.`;

/**
 * Generate trends analysis prompt
 */
export const generateTrendsPrompt = (articles: Array<{
  title: string;
  titleZh?: string;
  category: string;
  keywords: string[];
  scores: { overall: number };
}>): string => {
  // Use top articles for trend analysis
  const topArticles = articles.slice(0, 20);

  const articlesList = topArticles
    .map((a, i) => `${i + 1}. ${a.titleZh || a.title}
   分类: ${a.category}
   关键词: ${a.keywords.join(', ')}
   评分: ${a.scores.overall}/10`)
    .join('\n\n');

  return `Analyze these ${topArticles.length} top technical articles and identify broader technology trends:

${articlesList}

Your analysis should:
1. Look for patterns ACROSS articles (not individual topics)
2. Identify what these trends suggest about where tech is heading
3. Consider the broader significance and implications

Return ONLY a JSON object:
\`\`\`json
{
  "summary": "<3-5句宏观趋势分析>",
  "trends": ["<trend1>", "<trend2>", "<trend3>", "<trend4>", "<trend5>", "<trend6>", "<trend7>"],
  "insight": "<对技术发展方向的洞察，1-2句话>"
}
\`\`\`

All text in Chinese. Focus on macro-level insights, not individual article topics.`;
};

/**
 * Generate daily summary prompt (for the overall digest summary)
 */
export const generateDailySummaryPrompt = (
  articles: Array<{
    title: string;
    titleZh?: string;
    category: string;
  }>,
  trends: string[]
): string => {
  const topArticles = articles.slice(0, 10);
  const articlesList = topArticles
    .map((a, i) => `${i + 1}. ${a.titleZh || a.title} (${a.category})`)
    .join('\n');

  return `Write a 3-5 sentence daily summary in Chinese highlighting today's key technology trends.

**Trends**: ${trends.join(', ')}

**Top Articles**:
${articlesList}

Requirements:
- Focus on what's emerging, what's converging, and what developers should pay attention to
- Don't just list articles - synthesize them into a coherent narrative
- Mention 2-3 of the most significant trends or developments
- Keep it concise and actionable

Return ONLY the summary text (no JSON, no markdown).`;
};
