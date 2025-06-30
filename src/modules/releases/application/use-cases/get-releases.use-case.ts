import { Inject, Injectable } from '@nestjs/common';
import type { GithubGatewayInterface } from '../../domain/interfaces/github.gateway.interface';
import type { Release } from '../../domain/interfaces/release.interface';

export interface Changelog {
  frontend: Release[];
  backend: Release[];
}

@Injectable()
export class GetReleasesUseCase {
  constructor(
    @Inject('GithubGatewayInterface')
    private readonly gateway: GithubGatewayInterface,
  ) {}

  async execute(): Promise<Changelog> {
    const frontRepo = process.env.FRONT_REPO ?? '';
    const backRepo = process.env.BACK_REPO ?? '';
    const [frontend, backend] = await Promise.all([
      this.gateway.getReleases(frontRepo),
      this.gateway.getReleases(backRepo),
    ]);
    return { frontend, backend };
  }
}
