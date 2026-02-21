import { NextResponse } from 'next/server';

interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  url: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    login: string;
    avatarUrl: string;
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    // 构建搜索查询
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dateFilter = `created:>${lastWeek.toISOString().split('T')[0]}`;

    const languageQuery = language ? `language:${language} ` : '';
    const query = `${languageQuery}${dateFilter} stars:>10`;

    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${limit}`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
        next: {
          revalidate: 3600, // 缓存 1 小时
        },
      }
    );

    if (!response.ok) {
      throw new Error('GitHub API request failed');
    }

    const data = await response.json();

    // 转换数据格式
    const repositories: GitHubRepository[] = data.items.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || '暂无描述',
      language: repo.language || 'Unknown',
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      url: repo.html_url,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      owner: {
        login: repo.owner.login,
        avatarUrl: repo.owner.avatar_url,
      },
    }));

    return NextResponse.json({
      success: true,
      repositories,
    });
  } catch (error) {
    console.error('Error fetching GitHub trending repositories:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trending repositories',
        repositories: [],
      },
      { status: 500 }
    );
  }
}
