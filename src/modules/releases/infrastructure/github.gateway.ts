import { Injectable } from '@nestjs/common';
import type { GithubGatewayInterface } from '../domain/interfaces/github.gateway.interface';
import type { Release } from '../domain/interfaces/release.interface';

@Injectable()
export class GithubGateway implements GithubGatewayInterface {
  async getReleases(repo: string): Promise<Release[]> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const res = await fetch(`https://api.github.com/repos/${repo}/releases`, {
      headers,
    });
    if (!res.ok) {
      throw new Error(`GitHub error ${res.status}`);
    }
    const data = (await res.json()) as any[];
    return data.map((r) => ({
      name: r.name,
      tagName: r.tag_name,
      publishedAt: r.published_at,
      author: r.author ? r.author.login : null,
      body: r.body || '',
      htmlUrl: r.html_url,
    }));
  }
}
