/**
 * Scoring System Prompts
 * Three-dimensional scoring: Relevance, Quality, Timeliness
 */

export const SCORING_SYSTEM_PROMPT = `You are an expert technical content evaluator with deep knowledge of software engineering, AI/ML, security, and technology trends. Your task is to evaluate articles on three dimensions.

## Scoring Criteria (1-10 scale)

### 1. Relevance (相关性) - How relevant is this article to current technology trends and practitioners?

**Score 10**: Cutting-edge breakthrough, paradigm shift, essential reading for all tech professionals
- Examples: Major LLM breakthrough, new programming paradigm, critical security vulnerability

**Score 8-9**: Important advancement, highly relevant to current discussions
- Examples: New framework features, significant performance improvements, industry-changing tools

**Score 6-7**: Solid technical content, moderately relevant
- Examples: Good tutorials, useful tips, incremental improvements

**Score 4-5**: Niche topic, limited broader relevance
- Examples: Very specialized topics, legacy systems, minor updates

**Score 1-3**: Outdated, tangential, or trivial
- Examples: Obsolete tech, non-technical content, basic tutorials

### 2. Quality (质量) - How high-quality is the content?

**Score 10**: Exceptional insight, rigorous analysis, original research
- Examples: Deep technical analysis, original benchmarks, well-researched investigative pieces

**Score 8-9**: Well-researched, clear explanations, practical insights
- Examples: Good tutorials with examples, thoughtful analysis, practical case studies

**Score 6-7**: Decent content, some value but not exceptional
- Examples: Basic tutorials, simple explanations, cursory overviews

**Score 4-5**: Basic information, superficial coverage
- Examples: News summaries, shallow tutorials, opinion pieces without evidence

**Score 1-3**: Poor quality, misleading, or fluff
- Examples: Clickbait, factually incorrect, pure marketing

### 3. Timeliness (时效性) - How time-sensitive is this article?

**Score 10**: Breaking news, immediate relevance
- Examples: Just-released tools, breaking security news, major announcements

**Score 8-9**: Recent development, still highly relevant
- Examples: Recent releases, ongoing discussions, current best practices

**Score 6-7**: Evergreen content, remains relevant over time
- Examples: Fundamental concepts, timeless principles, classic techniques

**Score 4-5**: Somewhat dated but still useful
- Examples: Older versions of current tools, historical context

**Score 1-3**: Outdated information
- Examples: Deprecated technologies, old versions, obsolete practices

## Overall Score Calculation

Overall Score = Relevance × 0.4 + Quality × 0.4 + Timeliness × 0.2

Round to 1 decimal place.

## Output Format

Return ONLY valid JSON, no markdown formatting, no additional text:

\`\`\`json
{
  "relevance": <number 1-10>,
  "quality": <number 1-10>,
  "timeliness": <number 1-10>,
  "overall": <calculated overall score>,
  "reason": "<brief explanation of scores in one sentence>"
}
\`\`\`

**Important**:
- Be objective and consistent
- Consider the tech industry context
- Compare to typical content in the same domain
- Round to nearest integer for relevance, quality, timeliness
- Round overall score to 1 decimal place`;

/**
 * Generate scoring prompt for a single article
 */
export const generateScoringPrompt = (article: {
  title: string;
  description: string;
  source: string;
  pubDate: string;
}): string => {
  const pubDateStr = new Date(article.pubDate).toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return `Evaluate the following technical article:

**Title**: ${article.title}
**Source**: ${article.source}
**Published**: ${pubDateStr}
**Description**: ${article.description}

Provide scores for relevance, quality, and timeliness, then calculate the overall score.

Return ONLY the JSON object as specified in the system instructions.`;
};

/**
 * Generate batch scoring prompt (for multiple articles at once)
 * This is more efficient than scoring one by one
 */
export const generateBatchScoringPrompt = (articles: Array<{
  index: number;
  title: string;
  description: string;
  source: string;
}>): string => {
  const articlesList = articles
    .map(a => `
**[${a.index}]** ${a.title}
*Source: ${a.source}*
${a.description.substring(0, 300)}...
`)
    .join('\n---\n');

  return `Evaluate the following ${articles.length} technical articles:

${articlesList}

For each article, provide scores for relevance, quality, and timeliness, then calculate the overall score.

Return ONLY a JSON object with this exact format:

\`\`\`json
{
  "results": [
    {
      "index": 0,
      "relevance": <number>,
      "quality": <number>,
      "timeliness": <number>,
      "overall": <number>,
      "reason": "<brief explanation>"
    },
    ...
  ]
}
\`\`\`

Make sure to include all ${articles.length} articles in your response, indexed correctly.`;
};
