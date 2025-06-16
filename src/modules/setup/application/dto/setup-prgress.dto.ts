import { ApiProperty } from '@nestjs/swagger';
import { SetupStep } from './setup-status.dto';
import { IsOptional } from 'class-validator';

export class SetupProgressDto {
  @ApiProperty({
    description: 'Identifiant unique de la progression de la configuration',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'Étape du processus de configuration',
    example: 'initialization',
    enum: SetupStep,
  })
  step: SetupStep;
  @ApiProperty({
    description: "Date et heure de la dernière mise à jour de l'étape",
    example: '2025-10-01T12:00:00Z',
    type: String,
  })
  @IsOptional()
  completedAt?: string;
  @ApiProperty({
    description: "ID de l'utilisateur qui a effectué la dernière mise à jour",
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  completedBy: string;
  @ApiProperty({
    description: "Métadonnées supplémentaires liées à l'étape de configuration",
    example: { notes: 'Initial setup completed' },
    type: Object,
    required: false,
  })
  metadata?: Record<string, any>;
  constructor(
    step: SetupStep,
    completedAt: string,
    completedBy: string,
    metadata?: Record<string, any>,
  ) {
    this.step = step;
    this.completedAt = completedAt;
    this.completedBy = completedBy;
    this.metadata = metadata || {};
  }
}
