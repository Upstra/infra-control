import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import type { Release } from '../../domain/interfaces/release.interface';

export class ReleaseResponseDto {
  @ApiProperty()
  @IsString()
  readonly name: string;

  @ApiProperty()
  @IsString()
  readonly tagName: string;

  @ApiProperty()
  @IsString()
  readonly publishedAt: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  readonly author: string | null;

  @ApiProperty()
  @IsString()
  readonly body: string;

  @ApiProperty()
  @IsString()
  readonly htmlUrl: string;

  constructor(release: Release) {
    this.name = release.name;
    this.tagName = release.tagName;
    this.publishedAt = release.publishedAt;
    this.author = release.author;
    this.body = release.body;
    this.htmlUrl = release.htmlUrl;
  }
}
