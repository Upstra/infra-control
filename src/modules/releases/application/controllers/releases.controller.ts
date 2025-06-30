import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetReleasesUseCase } from '../use-cases/get-releases.use-case';

@ApiTags('Releases')
@Controller('releases')
export class ReleasesController {
  constructor(private readonly getReleasesUseCase: GetReleasesUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Get project releases' })
  async getReleases() {
    return this.getReleasesUseCase.execute();
  }
}
