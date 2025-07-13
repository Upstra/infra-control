import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IloCreationDto } from '../../../ilos/application/dto/ilo.creation.dto';

/**
 * DTO utilisé pour la création d'un serveur.
 * Il contient toutes les informations nécessaires pour instancier un serveur dans le système.
 */
export class ServerCreationDto {
  @ApiProperty({
    description: 'Nom du serveur',
    example: 'My Server',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  readonly name!: string;

  @ApiProperty({
    description: 'État actuel du serveur',
    example: 'UP',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  readonly state!: string;

  @ApiProperty({
    description:
      'Durée de la période de grâce lorsque le serveur est allumé (en secondes)',
    example: 10,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  readonly grace_period_on!: number;

  @ApiProperty({
    description:
      'Durée de la période de grâce lorsque le serveur est éteint (en secondes)',
    example: 10,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  readonly grace_period_off!: number;

  @ApiProperty({
    description: 'URL d’administration du serveur',
    example: 'https://admin.example.com',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  readonly adminUrl!: string;

  @ApiProperty({
    description: 'Adresse IP du serveur',
    example: '192.168.1.10',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  readonly ip!: string;

  @ApiProperty({
    description: 'Identifiant de connexion administrateur',
    example: 'admin',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  readonly login!: string;

  @ApiProperty({
    description: 'Mot de passe associé au compte administrateur',
    example: 'supersecretpassword',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  readonly password!: string;

  @ApiProperty({
    description: 'Type de serveur (ex: esxi, vcenter, etc.)',
    example: 'esxi',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  readonly type!: string;

  @ApiProperty({
    description:
      'Priorité du serveur dans son groupe ou rack (plus c’est bas, plus la priorité est haute)',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  readonly priority!: number;

  @ApiProperty({
    description: 'UUID de la salle où le serveur est localisé',
    example: '3f6f5a9a-b0b3-4c6e-ae92-1f3c3b5e7d17',
    required: true,
  })
  @IsNotEmpty()
  @IsUUID()
  readonly roomId!: string;

  @ApiProperty({
    description: 'UUID optionnel du groupe auquel le serveur est rattaché',
    example: '7a2b9f0f-9b8d-42d5-b1f5-3cbde8b43ac2',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  readonly groupId?: string;

  @ApiProperty({
    description:
      'UUID optionnel de l’UPS (alimentation sans interruption) liée au serveur',
    example: '1bb27f71-3c5c-4d3e-8b2f-28cdb1a0d2e2',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  readonly upsId?: string;

  @ApiProperty({
    description: 'Données d’initialisation de l’Ilo associée au serveur',
    type: () => IloCreationDto,
    required: false,
  })
  @IsOptional()
  ilo?: IloCreationDto;
}
