import { ApiProperty } from '@nestjs/swagger';

export class PresenceViewDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  online: boolean;

  @ApiProperty({ enum: ['active', 'idle'], nullable: true })
  status: 'active' | 'idle' | null;

  @ApiProperty({ type: String, nullable: true, example: '/ups' })
  route: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Onduleurs' })
  title: string | null;

  @ApiProperty({ type: String, nullable: true })
  lastActivityAt: string | null;
}
