import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

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
