import { RSSItem } from '@/types';

/**
 * Enhanced RSS/Atom parser with better error handling
 * Supports both RSS 2.0 and Atom formats
 */
export function parseRSS(xml: string, sourceName: string, category: string): RSSItem[] {
  const items: RSSItem[] = [];

  try {
    // Check for parser errors (some XML parsers embed error messages)
    if (xml.includes('<parsererror')) {
      throw new Error('XML parser error detected in feed');
    }

    // Detect format: Atom vs RSS
    const isAtom = xml.includes('<entry>') || xml.includes('<feed ');

    if (isAtom) {
      return parseAtom(xml, sourceName, category);
    } else {
      return parseRSS2(xml, sourceName, category);
    }
  } catch (error) {
    console.error(`Error parsing RSS from ${sourceName}:`, error);
    return [];
  }
}

/**
 * Parse Atom format feeds
 */
function parseAtom(xml: string, sourceName: string, category: string): RSSItem[] {
  const items: RSSItem[] = [];

  // Extract all <entry> elements
  const entryPattern = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
  let entryMatch;

  while ((entryMatch = entryPattern.exec(xml)) !== null) {
    const entryXml = entryMatch[1];

    try {
      const title = extractContent(entryXml, 'title');
      const link = extractAtomLink(entryXml);
      const pubDate = getTagContent(entryXml, 'published') ||
                      getTagContent(entryXml, 'updated');
      const description = stripHtml(
        getTagContent(entryXml, 'summary') ||
        getTagContent(entryXml, 'content')
      );

      if (title && link) {
        items.push({
          title: stripHtml(title),
          link,
          pubDate: parseDate(pubDate) || new Date(),
          description: description.substring(0, 500),
          source: sourceName,
          category,
        });
      }
    } catch (error) {
      // Skip malformed entries
      continue;
    }
  }

  return items;
}

/**
 * Parse RSS 2.0 format feeds
 */
function parseRSS2(xml: string, sourceName: string, category: string): RSSItem[] {
  const items: RSSItem[] = [];

  // Extract all <item> elements
  const itemPattern = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let itemMatch;

  while ((itemMatch = itemPattern.exec(xml)) !== null) {
    const itemXml = itemMatch[1];

    try {
      const title = extractContent(itemXml, 'title');
      const link = getTagContent(itemXml, 'link') ||
                   getTagContent(itemXml, 'guid');
      const pubDate = getTagContent(itemXml, 'pubDate') ||
                      getTagContent(itemXml, 'dc:date') ||
                      getTagContent(itemXml, 'date');
      const description = stripHtml(
        getTagContent(itemXml, 'description') ||
        getTagContent(itemXml, 'content:encoded')
      );

      if (title && link) {
        items.push({
          title: stripHtml(title),
          link,
          pubDate: parseDate(pubDate) || new Date(),
          description: description.substring(0, 500),
          source: sourceName,
          category,
        });
      }
    } catch (error) {
      // Skip malformed items
      continue;
    }
  }

  return items;
}

/**
 * Extract text content from XML tag, handling CDATA
 */
function getTagContent(xml: string, tagName: string): string {
  // Try matching with CDATA wrapper first
  const cdataPattern = new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`, 'i');
  const cdataMatch = xml.match(cdataPattern);
  if (cdataMatch) {
    return cdataMatch[1];
  }

  // Try normal tag matching
  const tagPattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const tagMatch = xml.match(tagPattern);
  if (tagMatch) {
    return tagMatch[1];
  }

  return '';
}

/**
 * Extract content with CDATA removal
 */
function extractContent(xml: string, tagName: string): string {
  const content = getTagContent(xml, tagName);
  return extractCDATA(content);
}

/**
 * Remove CDATA wrapper if present
 */
function extractCDATA(text: string): string {
  return text.replace(/^<!\[CDATA\[|\]\]>$/g, '').trim();
}

/**
 * Extract Atom link (handles rel="alternate")
 */
function extractAtomLink(xml: string): string {
  // Try to find link with rel="alternate" first
  const altLinkPattern = /<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i;
  const altMatch = xml.match(altLinkPattern);
  if (altMatch) {
    return altMatch[1];
  }

  // Fall back to any link with href attribute
  const linkPattern = /<link[^>]*href=["']([^"']+)["']/i;
  const linkMatch = xml.match(linkPattern);
  if (linkMatch) {
    return linkMatch[1];
  }

  // Fall back to <link>content</link> format
  const linkContent = getTagContent(xml, 'link');
  if (linkContent) {
    return linkContent;
  }

  return '';
}

/**
 * Parse date string to Date object
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Try standard parsing
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d;
  }

  // Try RFC 822 format: "Mon, 01 Jan 2024 00:00:00 GMT"
  const rfc822Match = dateStr.match(/(\d{1,2})\s+(\w{3})\s+(\d{4})/);
  if (rfc822Match) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

/**
 * Strip HTML tags and decode entities
 */
export function stripHtml(html: string): string {
  return html
    // Remove script and style tags with their content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove all other tags
    .replace(/<[^>]*>/g, '')
    // Decode HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Decode numeric entities
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validate RSS feed XML
 */
export function validateFeed(xml: string): boolean {
  if (!xml || xml.length < 10) {
    return false;
  }

  // Check for parser errors
  if (xml.includes('<parsererror')) {
    return false;
  }

  // Check for RSS or Atom root elements
  const hasRSSRoot = xml.includes('<rss') || xml.includes('<RSS');
  const hasAtomRoot = xml.includes('<feed ') || xml.includes('<feed>');
  const hasItems = xml.includes('<item>') || xml.includes('<entry>');

  return (hasRSSRoot || hasAtomRoot) && hasItems;
}
