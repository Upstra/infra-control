import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class TwoFADto {
  @ApiProperty({
    description: 'Code to verify 2FA',
    example: '123456',
    required: true,
  })
  @IsNotEmpty()
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

export class TwoFADisableResponseDto {
  @ApiProperty({
    description: 'Status of the 2FA disabling',
    example: true,
    required: true,
  })
  isDisabled: boolean;

  @ApiProperty({
    description: 'Confirmation message',
    example: '2FA has been disabled successfully.',
    required: true,
  })
  message: string;

  constructor(isDisabled: boolean) {
    this.isDisabled = isDisabled;
    this.message = isDisabled
      ? '2FA has been disabled successfully.'
      : 'Invalid code. 2FA is still active.';
  }
}
