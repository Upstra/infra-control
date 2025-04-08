import { ApiProperty } from '@nestjs/swagger';

export class TwoFADto {
  @ApiProperty({
    description: 'Code to verify 2FA',
    example: '123456',
    required: true,
  })
  code: string;
  @ApiProperty({
    description: 'Secret key for 2FA',
    example: 'JBSWY3DPEHPK3PXP',
    required: true,
  })
  secret: string;
}
