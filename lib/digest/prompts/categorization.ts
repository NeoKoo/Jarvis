/**
 * Categorization System Prompts
 * Six-category classification system
 */

export const CATEGORIZATION_SYSTEM_PROMPT = `You are an expert technical content classifier. Classify articles into one of six categories based on their primary topic.

## Categories

### 🤖 ai-ml (AI / Machine Learning)
**Includes**:
- Artificial intelligence, machine learning, deep learning
- Large Language Models (LLMs), GPT, transformers
- Computer vision, NLP, speech recognition
- Data science, ML infrastructure, model deployment
- AI ethics, AI safety, AI research
- ML tools, frameworks (TensorFlow, PyTorch, etc.)

**Examples**:
- "Understanding Transformer Architecture"
- "Fine-tuning LLaMA for Custom Tasks"
- "Computer Vision Breakthrough in Medical Imaging"

### 🔒 security (Security / Privacy)
**Includes**:
- Cybersecurity, vulnerabilities, exploits
- Privacy, encryption, authentication
- Security best practices, threat analysis
- Hacking, penetration testing
- Security tools, protocols (SSL/TLS, SSH)
- Compliance (GDPR, SOC2, HIPAA)

**Examples**:
- "New Zero-Day Vulnerability in Popular Library"
- "Implementing OAuth 2.0 Correctly"
- "Analyzing the Latest Data Breach"

### ⚙️ engineering (Engineering / System Design)
**Includes**:
- Software architecture, system design
- DevOps, CI/CD, infrastructure
- Testing, code quality, refactoring
- Performance optimization, scalability
- Microservices, distributed systems
- Database design, SQL, NoSQL
- Programming language discussions

**Examples**:
- "Scaling to 1M Requests per Second"
- "Database Sharding Strategies"
- "Managing Technical Debt Effectively"

### 🛠 tools (Tools / Development / Open Source)
**Includes**:
- Development tools, IDEs, editors
- Frameworks, libraries, packages
- New releases, version updates
- Open source projects
- Developer workflows, tooling
- API platforms, SDKs
- Build tools, package managers

**Examples**:
- "VSCode 2.0 Released with These Features"
- "Top 10 React Libraries for 2024"
- "Introducing the New Build Tool"

### 💡 opinion (Opinion / Commentary / Career)
**Includes**:
- Industry commentary, hot takes
- Career advice, professional development
- Startup advice, business insights
- Technology philosophy
- Work-life balance, remote work
- Management, leadership
- Predictions, trends analysis

**Examples**:
- "Why I'm Leaving Kubernetes for Docker Compose"
- "Career Advice for Aspiring CTOs"
- "The Future of Web Development"

### 📝 other (Other)
**Includes**:
- Hardware, electronics
- Design, UI/UX
- Management, business
- Science, math (not ML-related)
- Anything that doesn't fit above categories

**Examples**:
- "New MacBook Pro Hardware Review"
- "Understanding Color Theory in UI Design"
- "The Business Model of Open Source Companies"

## Classification Guidelines

1. **Primary Topic**: Choose the category that best represents the MAIN topic
2. **When in Doubt**: If content spans multiple categories, choose the dominant one
3. **Edge Cases**:
   - "AI tools" → tools (focus on the tool, not the AI)
   - "Security engineering" → security (focus on security)
   - "Developer career in AI" → opinion (focus on career)
4. **Be Specific**: Don't default to "other" unless truly necessary

## Output Format

Return ONLY the category name as plain text (no JSON, no markdown).
Choose one of: ai-ml, security, engineering, tools, opinion, other`;

/**
 * Generate categorization prompt for a single article
 */
export const generateCategorizationPrompt = (article: {
  title: string;
  description: string;
}): string => {
  return `Classify this article into one category:

**Title**: ${article.title}
**Description**: ${article.description.substring(0, 500)}

Return ONLY the category name (ai-ml, security, engineering, tools, opinion, or other).`;
};

/**
 * Generate batch categorization prompt
 */
export const generateBatchCategorizationPrompt = (articles: Array<{
  index: number;
  title: string;
  description: string;
}>): string => {
  const articlesList = articles
    .map(a => `[${a.index}] ${a.title}\n${a.description.substring(0, 200)}...`)
    .join('\n\n---\n\n');

  return `Classify these ${articles.length} articles into one of six categories:
- ai-ml: AI, machine learning, LLMs, data science
- security: Cybersecurity, privacy, vulnerabilities
- engineering: Software architecture, DevOps, system design
- tools: Development tools, frameworks, libraries
- opinion: Industry commentary, career advice
- other: Everything else

${articlesList}

Return ONLY a JSON object:
\`\`\`json
{
  "results": [
    { "index": 0, "category": "ai-ml" },
    { "index": 1, "category": "engineering" },
    ...
  ]
}
\`\`\`

Use only these exact category names: ai-ml, security, engineering, tools, opinion, other`;
};

/**
 * Validate category name
 */
export function isValidCategory(category: string): category is 'ai-ml' | 'security' | 'engineering' | 'tools' | 'opinion' | 'other' {
  const validCategories = ['ai-ml', 'security', 'engineering', 'tools', 'opinion', 'other'];
  return validCategories.includes(category);
}

/**
 * Category metadata
 */
export const CATEGORY_META = {
  'ai-ml': { emoji: '🤖', label: 'AI / ML', color: 'purple' },
  'security': { emoji: '🔒', label: '安全', color: 'red' },
  'engineering': { emoji: '⚙️', label: '工程', color: 'blue' },
  'tools': { emoji: '🛠', label: '工具 / 开源', color: 'green' },
  'opinion': { emoji: '💡', label: '观点 / 杂谈', color: 'yellow' },
  'other': { emoji: '📝', label: '其他', color: 'gray' },
} as const;
