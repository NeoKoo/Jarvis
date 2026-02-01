import { Note } from '@/types';

/**
 * Convert a single note to Markdown format
 * @param note - The note to convert
 * @returns Markdown formatted string
 */
export function exportNoteAsMarkdown(note: Note): string {
  let markdown = `# ${note.title}\n\n`;
  markdown += `${note.content}\n\n`;

  if (note.tags && note.tags.length > 0) {
    markdown += `**标签**：`;
    markdown += note.tags.map(tag => `#${tag}`).join(' ');
    markdown += `\n`;
  }

  return markdown;
}

/**
 * Convert multiple notes to Markdown format with separators
 * @param notes - Array of notes to convert
 * @returns Markdown formatted string with separators
 */
export function exportNotesAsMarkdown(notes: Note[]): string {
  if (notes.length === 0) return '';

  return notes
    .map((note, index) => {
      const markdown = exportNoteAsMarkdown(note);
      // Don't add separator after the last note
      return index < notes.length - 1 ? `${markdown}\n---\n` : markdown;
    })
    .join('\n');
}

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
