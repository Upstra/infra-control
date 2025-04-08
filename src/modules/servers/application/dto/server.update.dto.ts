import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IloUpdateDto } from '@/modules/ilos/application/dto/ilo.update.dto';

export class ServerUpdateDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly name?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly state?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly grace_period_on?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly grace_period_off?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly adminUrl?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly ip?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly login?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly password?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly type?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly priority?: number;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  readonly groupId?: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  readonly roomId?: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  readonly upsId?: string;

  @ApiProperty({ type: IloUpdateDto })
  @IsOptional()
  readonly ilo?: IloUpdateDto;
}
