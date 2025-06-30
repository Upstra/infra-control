import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GetReleasesUseCase } from '../use-cases/get-releases.use-case';

@ApiTags('Releases')
@Controller('releases')
export class ReleasesController {
  constructor(private readonly getReleasesUseCase: GetReleasesUseCase) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Get project releases' })
  async getReleases(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.getReleasesUseCase.execute(Number(page), Number(limit));
  }
}
