import { Injectable, Inject } from '@nestjs/common';
import {
  TemplateListResponseDto,
  TemplateResponseDto,
  TemplateType,
} from '../dto';
import { TemplateRepositoryInterface } from '../../domain/interfaces/template.repository.interface';

@Injectable()
export class GetTemplatesUseCase {
  constructor(
    @Inject('TemplateRepositoryInterface')
    private readonly templateRepository: TemplateRepositoryInterface,
  ) {}
  private readonly predefinedTemplates: TemplateResponseDto[] = [
    {
      id: 'template-small-dc',
      name: 'Small Data Center',
      description: 'Basic setup for small data center with 1 room and 2 UPS',
      type: TemplateType.PREDEFINED,
      configuration: {
        rooms: [{ name: 'Main Server Room' }],
        upsList: [
          { name: 'UPS-Primary', roomId: 'temp_room_1', ip: '192.168.1.100' },
          { name: 'UPS-Backup', roomId: 'temp_room_1', ip: '192.168.1.101' },
        ],
        servers: [
          {
            name: 'WEB-01',
            state: 'stopped',
            grace_period_on: 30,
            grace_period_off: 30,
            adminUrl: 'https://192.168.1.10',
            ip: '192.168.1.10',
            login: 'admin',
            password: '',
            type: 'physical',
            priority: 1,
            roomId: 'temp_room_1',
            upsId: 'temp_ups_1',
          },
          {
            name: 'DB-01',
            state: 'stopped',
            grace_period_on: 60,
            grace_period_off: 60,
            adminUrl: 'https://192.168.1.11',
            ip: '192.168.1.11',
            login: 'admin',
            password: '',
            type: 'physical',
            priority: 2,
            roomId: 'temp_room_1',
            upsId: 'temp_ups_2',
          },
        ],
      },
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 'template-medium-dc',
      name: 'Medium Data Center',
      description:
        'Setup for medium data center with 2 rooms and redundant UPS',
      type: TemplateType.PREDEFINED,
      configuration: {
        rooms: [
          { name: 'Primary Server Room' },
          { name: 'Secondary Server Room' },
        ],
        upsList: [
          { name: 'UPS-Room1-A', roomId: 'temp_room_1', ip: '192.168.1.100' },
          { name: 'UPS-Room1-B', roomId: 'temp_room_1', ip: '192.168.1.101' },
          { name: 'UPS-Room2-A', roomId: 'temp_room_2', ip: '192.168.1.102' },
          { name: 'UPS-Room2-B', roomId: 'temp_room_2', ip: '192.168.1.103' },
        ],
        servers: [],
      },
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 'template-enterprise-dc',
      name: 'Enterprise Data Center',
      description: 'Large scale setup with multiple rooms and full redundancy',
      type: TemplateType.PREDEFINED,
      configuration: {
        rooms: [
          { name: 'DC1-Production' },
          { name: 'DC1-Development' },
          { name: 'DC1-Disaster Recovery' },
        ],
        upsList: [
          { name: 'DC1-PROD-UPS-01', roomId: 'temp_room_1' },
          { name: 'DC1-PROD-UPS-02', roomId: 'temp_room_1' },
          { name: 'DC1-DEV-UPS-01', roomId: 'temp_room_2' },
          { name: 'DC1-DR-UPS-01', roomId: 'temp_room_3' },
          { name: 'DC1-DR-UPS-02', roomId: 'temp_room_3' },
        ],
        servers: [],
      },
      createdAt: new Date('2024-01-01'),
    },
  ];

  async execute(): Promise<TemplateListResponseDto> {
    const customTemplates = await this.templateRepository.findAll();
    
    const customTemplateDtos: TemplateResponseDto[] = customTemplates.map(
      (template) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        type: template.type,
        configuration: template.configuration,
        createdAt: template.createdAt,
        createdBy: template.createdBy,
      }),
    );

    return {
      templates: [...this.predefinedTemplates, ...customTemplateDtos],
    };
  }
}
