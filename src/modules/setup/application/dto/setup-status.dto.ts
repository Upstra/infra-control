import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';

/**
 * Enum representing the different steps in the setup process.
 * Each step corresponds to a specific part of the initial configuration.
 */
export enum SetupStep {
  WELCOME = 'welcome',
  CREATE_ROOM = 'create-room',
  CREATE_UPS = 'create-ups',
  CREATE_SERVER = 'create-server',
  VM_DISCOVERY = 'vm-discovery',
  COMPLETE = 'complete',
}

/**
 * DTO representing the current status of the setup process.
 * Used to provide information about the setup state to the client.
 */
export class SetupStatusDto {
  @ApiProperty({
    description: "Indique si c'est la première configuration de l'application",
    example: true,
  })
  @IsBoolean()
  isFirstSetup: boolean;

  @ApiProperty({
    description: 'Indique si au moins un utilisateur admin existe',
    example: false,
  })
  @IsBoolean()
  hasAdminUser: boolean;

  @ApiProperty({
    description: 'Indique si au moins une salle a été créée',
    example: false,
  })
  @IsBoolean()
  hasRooms: boolean;

  @ApiProperty({
    description: 'Indique si au moins un onduleur a été configuré',
    example: false,
  })
  @IsBoolean()
  hasUps: boolean;

  @ApiProperty({
    description: 'Indique si au moins un serveur a été ajouté',
    example: false,
  })
  @IsBoolean()
  hasServers: boolean;

  @ApiProperty({
    description: 'Étape actuelle du processus de configuration',
    enum: SetupStep,
    example: SetupStep.CREATE_ROOM,
  })
  @IsEnum(SetupStep)
  currentStep: SetupStep;

  @ApiProperty({
    description:
      "Indique si l'utilisateur actuel est admin (seulement pour l'endpoint authentifié)",
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isCurrentUserAdmin?: boolean;

  @ApiProperty({
    description: 'Indique si la découverte des VMs a été effectuée',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  hasSearchedForVms?: boolean;

  @ApiProperty({
    description: "Nombre total d'étapes dans le setup",
    example: 5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  totalSteps?: number;

  @ApiProperty({
    description: "Index de l'étape actuelle (0-based)",
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  currentStepIndex?: number;
}
