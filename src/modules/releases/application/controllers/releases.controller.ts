import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GetReleasesUseCase } from '../use-cases/get-releases.use-case';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';

/**
 * Controller responsible for handling release-related endpoints.
 *
 * @remarks
 * This controller provides endpoints to retrieve project releases.
 * It is protected by JWT authentication and supports pagination.
 *
 * @class
 * @name ReleasesController
 * @tag Releases
 * @route /releases
 */
@ApiTags('Releases')
@Controller('releases')
export class ReleasesController {
  constructor(private readonly getReleasesUseCase: GetReleasesUseCase) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Get project releases' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  /**
   * Retrieves a paginated list of project releases.
   *
   * @remarks
   * This endpoint returns releases for the current project.
   * Pagination is supported via the `page` and `limit` query parameters.
   * Authentication via JWT is required.
   *
   * @param page - The page number for pagination (default: '1').
   * @param limit - The number of items per page (default: '10').
   * @returns A promise resolving to the paginated list of releases.
   *
   * @throws {UnauthorizedException} If the user is not authenticated.
   *
   * @example
   * // GET /releases?page=2&limit=5
   * [
   *   { id: 6, name: "v1.5.0", ... },
   *   { id: 7, name: "v1.6.0", ... }
   * ]
   */
  async getReleases(@Query('page') page = '1', @Query('limit') limit = '10') {
    return this.getReleasesUseCase.execute(Number(page), Number(limit));
  }
}
