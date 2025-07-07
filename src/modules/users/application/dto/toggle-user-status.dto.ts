import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ToggleUserStatusDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}