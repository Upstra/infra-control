import type { Release } from '../domain/interfaces/release.interface';

export const createMockRelease = (overrides?: Partial<Release>): Release => ({
  name: 'v1.0',
  tagName: 'v1.0',
  publishedAt: new Date().toISOString(),
  author: 'tester',
  body: '## Notes',
  htmlUrl: 'https://github.com/org/repo/releases/v1.0',
  ...overrides,
});
