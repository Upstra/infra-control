import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TwoFADto {
  @ApiProperty({
    description: 'Code to verify 2FA',
    example: '123456',
    required: true,
  })
  @IsString()
  code: string;
}

export class TwoFAResponseDto {
  @ApiProperty({
    description: 'Status of the verification',
    example: true,
    required: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Access token for the user',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true,
  })
  accessToken: string;

  constructor(isValid: boolean, accessToken: string) {
    this.isValid = isValid;
    this.accessToken = accessToken;
  }
}
