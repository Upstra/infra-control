import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { GroupDtoInterface } from '@/modules/groups/application/interfaces/group.dto.interface';

export class GroupServerDto implements GroupDtoInterface {
  @ApiProperty()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsNumber()
  priority?: number;

  @ApiProperty()
  @IsNumber()
  serverId?: number;
}
