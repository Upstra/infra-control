import { Inject, Injectable } from '@nestjs/common';
import type { GithubGatewayInterface } from '../../domain/interfaces/github.gateway.interface';
import type { Release } from '../../domain/interfaces/release.interface';
import { ReleaseResponseDto } from '../dto/release.response.dto';
import { ReleaseListResponseDto } from '../dto/release.list.response.dto';

export interface Changelog {
  frontend: ReleaseListResponseDto;
  backend: ReleaseListResponseDto;
}

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
