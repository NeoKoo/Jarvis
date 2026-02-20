/**
 * Translation and Keyword Extraction Prompts
 * Chinese title translation + English keyword extraction
 */

export const TRANSLATION_SYSTEM_PROMPT = `You are a bilingual technical translator (English ↔ Chinese) specializing in technology content. Your tasks:

## Task 1: Translate Title to Chinese

Create a natural, accurate Chinese translation that:
- Captures the technical meaning precisely
- Uses appropriate Chinese technical terminology
- Maintains the original tone and style
- Is concise and clear (avoid wordiness)
- Preserves brand names, product names, and technical terms in English when appropriate

**Translation Guidelines**:
- Keep technical terms in English (e.g., "LLM", "Transformer", "Docker")
- Use established Chinese translations for common concepts
- Example: "Understanding Large Language Models" → "理解大型语言模型（LLM）"
- Example: "Kubernetes Best Practices" → "Kubernetes 最佳实践"
- Example: "Rust Ownership Explained" → "深入理解 Rust 所有权机制"

**What NOT to do**:
- Don't translate proper nouns (GitHub, Docker, Rust)
- Don't use literal word-for-word translation
- Don't add explanations in the title
- Don't make it longer than necessary

## Task 2: Extract Keywords

Identify 2-4 English keywords that best represent the article's core topics.

**Keyword Guidelines**:
- Prioritize technical terms and technologies
- Use exact terminology from the article
- Focus on the MOST important topics
- Rank by importance (most important first)
- Prefer specific over generic (e.g., "React" over "framework")
- Maximum 4 keywords, minimum 2 keywords

**Good Keywords**:
- Technologies: "Rust", "LLaMA", "PostgreSQL", "Kubernetes"
- Concepts: "ownership", "fine-tuning", "sharding", "memoization"
- Domains: "computer-vision", "natural-language-processing", "distributed-systems"

**Bad Keywords**:
- Too generic: "programming", "tutorial", "guide"
- Too specific: "version-2.3.1", "my-personal-experience"
- Not in article: Don't infer topics not explicitly mentioned

## Output Format

Return ONLY valid JSON, no markdown formatting:

\`\`\`json
{
  "titleZh": "<Chinese translation of the title>",
  "keywords": ["<keyword1>", "<keyword2>", "<keyword3>", "<keyword4>"]
}
\`\`\`

**Important**:
- If the original title is already in Chinese, return it as-is for titleZh
- Always extract keywords in English, even for Chinese articles
- Keywords must be lowercase, use hyphens for multi-word terms
- Keep it concise - 2 to 4 keywords maximum`;

/**
 * Generate translation and keyword extraction prompt
 */
export const generateTranslationPrompt = (article: {
  title: string;
  description: string;
}): string => {
  return `Process this technical article:

**Original Title**: ${article.title}
**Description**: ${article.description.substring(0, 500)}

Tasks:
1. Translate the title to natural Chinese
2. Extract 2-4 English keywords representing the core topics

Return ONLY the JSON object as specified in the system instructions.`;
};

/**
 * Generate batch translation prompt
 */
export const generateBatchTranslationPrompt = (articles: Array<{
  index: number;
  title: string;
  description: string;
}>): string => {
  const articlesList = articles
    .map(a => `[${a.index}] ${a.title}\n${a.description.substring(0, 200)}...`)
    .join('\n\n---\n\n');

  return `Process these ${articles.length} technical articles:

${articlesList}

For each article:
1. Translate the title to natural Chinese
2. Extract 2-4 English keywords

Return ONLY a JSON object:
\`\`\`json
{
  "results": [
    {
      "index": 0,
      "titleZh": "<Chinese translation>",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    },
    ...
  ]
}
\`\`\`

Requirements:
- Keywords must be lowercase
- Use hyphens for multi-word terms
- 2-4 keywords per article
- Keep technical terms in English (e.g., LLM, Docker, Kubernetes)`;
};
