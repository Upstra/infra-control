import { ApiProperty } from '@nestjs/swagger';

export class VmPowerOffDto {
  @ApiProperty()
  at: string;

  @ApiProperty({ enum: ['ha', 'upstra', 'manual'] })
  cause: 'ha' | 'upstra' | 'manual';

  @ApiProperty({ type: String, nullable: true })
  by: string | null;
}
