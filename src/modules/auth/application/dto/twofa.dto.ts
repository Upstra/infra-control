import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

  @ApiPropertyOptional({
    description: 'Access token for the user',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  accessToken: string;

  @ApiPropertyOptional({
    description: 'Message indicating the status of the verification',
    example: '2FA is valid.',
    required: false,
  })
  message?: string;

  constructor(isValid: boolean, accessToken?: string | null, message?: string) {
    this.isValid = isValid;
    this.accessToken = accessToken ?? null;
    if (message) this.message = message;
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

export class TwoFaGenerateQrCodeResponseDto {
  @ApiProperty({
    description: 'Base32 encoded secret key for manual entry in 2FA apps',
    example: 'JBSWY3DPEHPK3PXP',
    required: true,
  })
  setupKey: string;

  @ApiProperty({
    description: 'QR code image URL (base64) for scanning with 2FA apps',
    example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAAB... (truncated for brevity)',
    required: true,
  })
  qrCode: string;

  constructor(setupKey: string, qrCode: string) {
    this.setupKey = setupKey;
    this.qrCode = qrCode;
  }
}
