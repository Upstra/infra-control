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

  constructor(isValid: boolean) {
    this.isValid = isValid;
  }
}
