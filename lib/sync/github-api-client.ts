/**
 * GitHub API Client that uses Next.js API routes
 * This allows secure access to GitHub credentials from environment variables
 */

export interface GitHubFile {
  path: string;
  content: string;
  sha?: string;
}

export class GitHubApiClient {
  private baseUrl = '/api/sync';

  /**
   * Get sync configuration
   */
  async getConfig(): Promise<{
    owner: string;
    repo: string;
    branch: string;
    isEnabled: boolean;
  }> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) {
      throw new Error('Failed to get sync configuration');
    }
    return response.json();
  }

  /**
   * Validate GitHub connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate' }),
      });
      const data = await response.json();
      return data.valid;
    } catch {
      return false;
    }
  }

  /**
   * Get file content from repository
   */
  async getFile(path: string): Promise<GitHubFile | null> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getFile',
          data: { path },
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.file;
    } catch {
      return null;
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(path: string): Promise<string[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'listFiles',
          data: { path },
        }),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.files || [];
    } catch {
      return [];
    }
  }

  /**
   * Create or update multiple files
   */
  async createFiles(
    files: { path: string; content: string }[],
    message: string
  ): Promise<{ commitSha: string; fileSha: string }> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createFiles',
        data: { files, message },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create files');
    }

    const data = await response.json();
    return data.result;
  }

  /**
   * Delete a file
   */
  async deleteFile(path: string, sha: string, message: string): Promise<void> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deleteFile',
        data: { path, sha, message },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  }
}

// Singleton instance
export const githubApiClient = new GitHubApiClient();
