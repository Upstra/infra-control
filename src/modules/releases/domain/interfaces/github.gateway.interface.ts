import type { Release } from './release.interface';

export interface GithubGatewayInterface {
  /**
   * Retrieves the list of releases for a given GitHub repository.
   *
   * Fetches release data from the GitHub API for the specified repository.
   * If a `GITHUB_TOKEN` environment variable is set, it will be used for authentication.
   *
   * @param repo - The repository in the format "owner/repo" (e.g., "octocat/Hello-World").
   * @returns A promise that resolves to an array of `Release` objects containing release information.
   * @throws {Error} If the GitHub API request fails or returns a non-OK status.
   */
  getReleases(repo: string): Promise<Release[]>;
}
