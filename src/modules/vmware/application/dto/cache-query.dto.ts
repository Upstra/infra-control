import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CacheQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  force?: boolean;
}
