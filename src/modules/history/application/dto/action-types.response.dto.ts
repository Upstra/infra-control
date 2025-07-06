import { ApiProperty } from '@nestjs/swagger';

export class ActionTypesResponseDto {
  @ApiProperty({
    description: 'Actions related to creation',
    example: ['CREATE', 'REGISTER'],
  })
  create: string[];

  @ApiProperty({
    description: 'Actions related to updates',
    example: ['UPDATE', 'ROLE_ASSIGNED', 'ROLE_REMOVED'],
  })
  update: string[];

  @ApiProperty({
    description: 'Actions related to deletion',
    example: ['DELETE'],
  })
  delete: string[];

  @ApiProperty({
    description: 'Actions related to authentication',
    example: ['LOGIN', 'LOGOUT', 'LOGIN_FAILED', '2FA_ENABLED', '2FA_DISABLED'],
  })
  auth: string[];

  @ApiProperty({
    description: 'Actions related to server operations',
    example: ['START', 'RESTART', 'SHUTDOWN'],
  })
  server: string[];
}