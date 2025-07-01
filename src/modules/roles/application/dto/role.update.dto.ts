import { IsOptional, Length, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RoleUpdateDto {
  @ApiProperty()
  @IsOptional()
  @Length(3, 50)
  readonly name?: string;
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  readonly isAdmin?: boolean;
  @IsOptional()
  @IsBoolean()
  readonly canCreateServer?: boolean;
}
