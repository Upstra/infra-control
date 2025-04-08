import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IloCreationDto } from '@/modules/ilos/application/dto/ilo.creation.dto';

export class ServerCreationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly state!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly grace_period_on!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly grace_period_off!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly adminUrl!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly ip!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly login!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly password!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly type!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly priority!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly roomId!: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  readonly groupId?: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  readonly upsId?: string;

  @ApiProperty({ type: () => IloCreationDto })
  @IsNotEmpty()
  readonly ilo?: IloCreationDto;
}
