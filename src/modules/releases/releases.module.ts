import { Module } from '@nestjs/common';
import { ReleasesController } from './application/controllers/releases.controller';
import { GetReleasesUseCase } from './application/use-cases/get-releases.use-case';
import { GithubGateway } from './infrastructure/github.gateway';

@Module({
  controllers: [ReleasesController],
  providers: [
    GetReleasesUseCase,
    { provide: 'GithubGatewayInterface', useClass: GithubGateway },
  ],
})
export class ReleasesModule {}
