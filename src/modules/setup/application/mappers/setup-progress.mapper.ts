import { Injectable } from '@nestjs/common';
import { SetupProgressDto } from '../dto/setup-prgress.dto';
import { SetupProgress } from '../../domain/entities/setup-progress.entity';

@Injectable()
export class SetupProgressMapper {
  /**
   * Convert a {@link SetupProgress} entity into its DTO representation.
   */
  static toDto(setupProgress: SetupProgress): SetupProgressDto {
    return {
      step: setupProgress.step,
      completedAt: setupProgress.completedAt.toISOString(),
      completedBy: setupProgress.completedBy,
      metadata: setupProgress.metadata,
    };
  }

  /**
   * Convert a {@link SetupProgressDto} back into a domain entity.
   */
  static fromDto(dto: SetupProgressDto): SetupProgress {
    return {
      id: dto.id,
      step: dto.step,
      completedAt: new Date(dto.completedAt),
      completedBy: dto.completedBy,
      metadata: dto.metadata || {},
    };
  }
}
