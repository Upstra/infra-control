import { GithubGateway } from '../github.gateway';

describe('GithubGateway', () => {
  const repo = 'org/repo';

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.GITHUB_TOKEN;
  });

  it('returns mapped releases', async () => {
    const fetchMock = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          name: 'v1',
          tag_name: 'v1',
          published_at: '2024-01-01T00:00:00Z',
          author: { login: 'me' },
          body: 'note',
          html_url: 'url',
        },
      ],
    } as any);

    const gateway = new GithubGateway();
    const result = await gateway.getReleases(repo);

    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.github.com/repos/${repo}/releases`,
      { headers: { Accept: 'application/vnd.github+json' } },
    );
    expect(result).toEqual([
      {
        name: 'v1',
        tagName: 'v1',
        publishedAt: '2024-01-01T00:00:00Z',
        author: 'me',
        body: 'note',
        htmlUrl: 'url',
      },
    ]);
  });

  it('throws on non-ok response', async () => {
    jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => [],
    } as any);

    const gateway = new GithubGateway();
    await expect(gateway.getReleases(repo)).rejects.toThrow('GitHub error 404');
  });

  it('includes token header', async () => {
    process.env.GITHUB_TOKEN = 't';
    const fetchMock = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as any);

    const gateway = new GithubGateway();
    await gateway.getReleases(repo);

    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.github.com/repos/${repo}/releases`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: 'Bearer t',
        },
      },
    );
  });

  it('handles null author and missing body', async () => {
    jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          name: 'v2',
          tag_name: 'v2',
          published_at: '2024-01-02T00:00:00Z',
          author: null,
          body: undefined,
          html_url: 'u2',
        },
      ],
    } as any);

    const gateway = new GithubGateway();
    const result = await gateway.getReleases(repo);

    expect(result[0]).toEqual({
      name: 'v2',
      tagName: 'v2',
      publishedAt: '2024-01-02T00:00:00Z',
      author: null,
      body: '',
      htmlUrl: 'u2',
    });
  });
});
