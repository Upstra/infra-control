import { Inject, Injectable } from '@nestjs/common';
import type { GithubGatewayInterface } from '../../domain/interfaces/github.gateway.interface';
import type { Release } from '../../domain/interfaces/release.interface';
import { ReleaseResponseDto } from '../dto/release.response.dto';
import { ReleaseListResponseDto } from '../dto/release.list.response.dto';

export interface Changelog {
  frontend: ReleaseListResponseDto;
  backend: ReleaseListResponseDto;
}

/**
 * Use case for retrieving paginated release information for both frontend and backend repositories.
 *
 * This class fetches release data from the configured frontend and backend repositories using the injected
 * `GithubGatewayInterface`. It supports pagination via the `page` and `limit` parameters.
 *
 * @remarks
 * - The repository names are read from the environment variables `FRONT_REPO` and `BACK_REPO`.
 * - The releases are fetched in parallel for performance.
 * - The result contains paginated lists for both frontend and backend releases.
 *
 * @example
 * ```typescript
 * const releases = await getReleasesUseCase.execute(1, 10);
 * console.log(releases.frontend.items); // Paginated frontend releases
 * console.log(releases.backend.items);  // Paginated backend releases
 * ```
 *
 * @param page - The page number to retrieve (defaults to 1).
 * @param limit - The number of releases per page (defaults to 10).
 * @returns A promise that resolves to a `Changelog` object containing paginated release lists for frontend and backend.
 */
@Injectable()
export class GetReleasesUseCase {
  constructor(
    @Inject('GithubGatewayInterface')
    private readonly gateway: GithubGatewayInterface,
  ) {}

  async execute(page = 1, limit = 10): Promise<Changelog> {
    const frontRepo = process.env.FRONT_REPO ?? '';
    const backRepo = process.env.BACK_REPO ?? '';
    const [frontReleases, backReleases] = await Promise.all([
      this.gateway.getReleases(frontRepo),
      this.gateway.getReleases(backRepo),
    ]);

    const build = (releases: Release[]): ReleaseListResponseDto => {
      const start = (page - 1) * limit;
      const items = releases
        .slice(start, start + limit)
        .map((r) => new ReleaseResponseDto(r));
      return new ReleaseListResponseDto(items, releases.length, page, limit);
    };

    return {
      frontend: build(frontReleases),
      backend: build(backReleases),
    };
  }
}
