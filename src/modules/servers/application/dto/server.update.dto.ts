import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IloUpdateDto } from '../../../ilos/application/dto/ilo.update.dto';
import { IsPriority } from '../../../groups/application/validators/priority.validator';

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

  @ApiProperty({
    description: 'Server priority (1-999). Must be unique across all servers',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsPriority()
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
