import { Inject, Injectable } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { UpsResponseDto } from '../dto/ups.response.dto';
import { UpsListResponseDto } from '../dto';

@Injectable()
export class GetUpsListUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly repo: UpsRepositoryInterface,
  ) {}

  /**
   * Retrieve a paginated list of UPS.
   *
   * @param page - page number starting at 1
   * @param limit - number of UPS per page
   */
  async execute(page = 1, limit = 10): Promise<UpsListResponseDto> {
    const [upsWithCount, total] = await this.repo.paginateWithServerCount(page, limit);
    const dtos = upsWithCount.map(({ ups, serverCount }) => new UpsResponseDto(ups, serverCount));
    return new UpsListResponseDto(dtos, total, page, limit);
  }
}
