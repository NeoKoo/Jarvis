/**
 * GitHub API Client for Jarvis Sync Module
 * Handles file operations, commits, and repository management
 */

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
}

export interface GitHubFile {
  path: string;
  content: string;
  sha?: string;
}

export interface GitHubCommitResult {
  commitSha: string;
  fileSha: string;
}

export class GitHubClient {
  private config: GitHubConfig;
  private baseUrl = 'https://api.github.com';

  constructor(config: GitHubConfig) {
    this.config = {
      branch: 'main',
      ...config,
    };
  }

  /**
   * Get repository information
   */
  async getRepo(): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get the current commit SHA for the branch
   */
  async getBranchRef(): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/git/refs/heads/${this.config.branch}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get branch ref: ${response.statusText}`);
    }

    const data = await response.json();
    return data.object.sha;
  }

  /**
   * Get file content from repository
   */
  async getFile(path: string): Promise<GitHubFile | null> {
    const response = await fetch(
      `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}?ref=${this.config.branch}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get file: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      path: data.path,
      content: atob(data.content),
      sha: data.sha,
    };
  }

  /**
   * List files in a directory
   */
  async listFiles(path: string): Promise<string[]> {
    const response = await fetch(
      `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}?ref=${this.config.branch}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }

    const data = await response.json();
    return data
      .filter((item: any) => item.type === 'file')
      .map((item: any) => item.name);
  }

  /**
   * Create or update a file
   */
  async createOrUpdateFile(
    path: string,
    content: string,
    message: string,
    currentSha?: string
  ): Promise<GitHubCommitResult> {
    const base64Content = btoa(unescape(encodeURIComponent(content)));

    const body: any = {
      message,
      content: base64Content,
      branch: this.config.branch,
    };

    if (currentSha) {
      body.sha = currentSha;
    }

    const response = await fetch(
      `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create/update file: ${error.message}`);
    }

    const data = await response.json();
    return {
      commitSha: data.commit.sha,
      fileSha: data.content.sha,
    };
  }

  /**
   * Delete a file
   */
  async deleteFile(path: string, sha: string, message: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          message,
          sha,
          branch: this.config.branch,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }
  }

  /**
   * Create multiple files in a single commit using a tree
   */
  async createMultipleFiles(
    files: { path: string; content: string }[],
    message: string
  ): Promise<GitHubCommitResult> {
    // Get the latest commit SHA
    const latestCommitSha = await this.getBranchRef();

    // Get the tree SHA from the latest commit
    const commitResponse = await fetch(
      `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/git/commits/${latestCommitSha}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!commitResponse.ok) {
      throw new Error('Failed to get latest commit');
    }

    const commitData = await commitResponse.json();
    const baseTreeSha = commitData.tree.sha;

    // Create blobs for each file
    const blobShas = await Promise.all(
      files.map(async (file) => {
        const base64Content = btoa(unescape(encodeURIComponent(file.content)));
        const blobResponse = await fetch(
          `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/git/blobs`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.config.token}`,
              Accept: 'application/vnd.github.v3+json',
            },
            body: JSON.stringify({
              content: base64Content,
              encoding: 'base64',
            }),
          }
        );

        if (!blobResponse.ok) {
          throw new Error(`Failed to create blob for ${file.path}`);
        }

        const blobData = await blobResponse.json();
        return { path: file.path, sha: blobData.sha };
      })
    );

    // Create a new tree
    const treeResponse = await fetch(
      `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/git/trees`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: blobShas.map((blob) => ({
            path: blob.path,
            mode: '100644',
            type: 'blob',
            sha: blob.sha,
          })),
        }),
      }
    );

    if (!treeResponse.ok) {
      throw new Error('Failed to create tree');
    }

    const treeData = await treeResponse.json();

    // Create a new commit
    const newCommitResponse = await fetch(
      `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/git/commits`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          message,
          tree: treeData.sha,
          parents: [latestCommitSha],
        }),
      }
    );

    if (!newCommitResponse.ok) {
      throw new Error('Failed to create commit');
    }

    const newCommitData = await newCommitResponse.json();

    // Update the branch reference
    const refResponse = await fetch(
      `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/git/refs/heads/${this.config.branch}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          sha: newCommitData.sha,
        }),
      }
    );

    if (!refResponse.ok) {
      throw new Error('Failed to update branch reference');
    }

    return {
      commitSha: newCommitData.sha,
      fileSha: treeData.sha,
    };
  }

  /**
   * Validate the configuration
   */
  async validateConfig(): Promise<boolean> {
    try {
      await this.getRepo();
      return true;
    } catch {
      return false;
    }
  }
}
