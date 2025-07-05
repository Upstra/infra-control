import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import { DashboardWidgetDto } from './dashboard-layout.dto';

export class DashboardTemplateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Operations Dashboard' })
  name: string;

  @ApiProperty({ example: 'Template optimized for operational teams' })
  description: string;

  @ApiProperty({ example: '/templates/ops-preview.png' })
  preview?: string;

  @ApiProperty({ type: [DashboardWidgetDto] })
  widgets: DashboardWidgetDto[];
}

export class DashboardTemplateListResponseDto {
  @ApiProperty({ type: [DashboardTemplateResponseDto] })
  templates: DashboardTemplateResponseDto[];
}

export class CreateLayoutFromTemplateDto {
  @ApiProperty()
  @IsUUID()
  templateId: string;

  @ApiProperty({ example: 'My Operations Dashboard' })
  @IsString()
  name: string;
}
