import type { Release } from './release.interface';

export interface GithubGatewayInterface {
  getReleases(repo: string): Promise<Release[]>;
}
