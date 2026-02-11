import { NextRequest, NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/sync/github-client';

// GET /api/sync/config - Get sync configuration (without token)
export async function GET(request: NextRequest) {
  const config = {
    owner: process.env.GITHUB_REPO_OWNER || '',
    repo: process.env.GITHUB_REPO_NAME || '',
    branch: process.env.GITHUB_BRANCH || 'main',
    isEnabled: !!(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO_OWNER && process.env.GITHUB_REPO_NAME),
  };

  return NextResponse.json(config);
}

// POST /api/sync - Trigger sync
export async function POST(request: NextRequest) {
  try {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_REPO_OWNER;
    const repo = process.env.GITHUB_REPO_NAME;
    const branch = process.env.GITHUB_BRANCH || 'main';

    if (!token || !owner || !repo) {
      return NextResponse.json(
        { error: 'GitHub sync not configured' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, data } = body;

    const client = new GitHubClient({ token, owner, repo, branch });

    switch (action) {
      case 'validate': {
        const isValid = await client.validateConfig();
        return NextResponse.json({ valid: isValid });
      }

      case 'getFile': {
        const { path } = data;
        const file = await client.getFile(path);
        return NextResponse.json({ file });
      }

      case 'listFiles': {
        const { path } = data;
        const files = await client.listFiles(path);
        return NextResponse.json({ files });
      }

      case 'createFiles': {
        const { files, message } = data;
        const result = await client.createMultipleFiles(files, message);
        return NextResponse.json({ result });
      }

      case 'deleteFile': {
        const { path, sha, message } = data;
        await client.deleteFile(path, sha, message);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 }
    );
  }
}
