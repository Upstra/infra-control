import { Inject, Injectable } from '@nestjs/common';
import { HistoryRepositoryInterface } from '../../domain/interfaces/history.repository.interface';
import { EntityTypesResponseDto } from '../dto/entity-types.response.dto';

@Injectable()
export class GetHistoryEntityTypesUseCase {
  constructor(
    @Inject('HistoryRepositoryInterface')
    private readonly repo: HistoryRepositoryInterface,
  ) {}

  async execute(): Promise<EntityTypesResponseDto> {
    const entityTypes = await this.repo.findDistinctEntityTypes();
    return new EntityTypesResponseDto(entityTypes);
  }
}
