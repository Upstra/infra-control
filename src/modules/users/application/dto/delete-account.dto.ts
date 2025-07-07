import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum DeletionReason {
  ADMIN_ACTION = 'admin_action',
  USER_REQUEST = 'user_request',
  POLICY_VIOLATION = 'policy_violation',
  INACTIVE_ACCOUNT = 'inactive_account',
  OTHER = 'other',
}

export class DeleteAccountDto {
  @ApiProperty({
    enum: DeletionReason,
    default: DeletionReason.ADMIN_ACTION,
    required: false,
    description: 'Reason for deleting the account',
  })
  @IsOptional()
  @IsEnum(DeletionReason)
  reason?: DeletionReason = DeletionReason.ADMIN_ACTION;

  @ApiProperty({
    required: false,
    description: 'Additional details about the deletion',
  })
  @IsOptional()
  @IsString()
  details?: string;
}

export class DeleteAccountResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;
}