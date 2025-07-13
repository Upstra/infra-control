import { Injectable } from '@nestjs/common';
import {
  TemplateListResponseDto,
  TemplateResponseDto,
  TemplateType,
} from '../dto';
import { RedisSafeService } from '../../../redis/application/services/redis-safe.service';

@Injectable()
export class GetTemplatesUseCase {
  private readonly REDIS_KEY = 'setup:custom_templates';
  private readonly predefinedTemplates: TemplateResponseDto[] = [
    {
      id: 'template-small-dc',
      name: 'Small Data Center',
      description: 'Basic setup for small data center with 1 room and 2 UPS',
      type: TemplateType.PREDEFINED,
      configuration: {
        rooms: [{ name: 'Main Server Room', tempId: 'temp_room_1' }],
        upsList: [
          {
            name: 'UPS-Primary',
            tempId: 'temp_ups_1',
            roomId: 'temp_room_1',
            ip: '192.168.1.100',
          },
          {
            name: 'UPS-Backup',
            tempId: 'temp_ups_2',
            roomId: 'temp_room_1',
            ip: '192.168.1.101',
          },
        ],
        servers: [
          {
            name: 'WEB-01',
            tempId: 'temp_server_1',
            state: 'stopped',
            grace_period_on: 30,
            grace_period_off: 30,
            adminUrl: 'https://192.168.1.10',
            ip: '192.168.1.10',
            login: 'admin',
            password: '',
            type: 'esxi',
            priority: 1,
            roomId: 'temp_room_1',
            upsId: 'temp_ups_1',
          },
          {
            name: 'DB-01',
            tempId: 'temp_server_2',
            state: 'stopped',
            grace_period_on: 60,
            grace_period_off: 60,
            adminUrl: 'https://192.168.1.11',
            ip: '192.168.1.11',
            login: 'admin',
            password: '',
            type: 'esxi',
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
          { name: 'Primary Server Room', tempId: 'temp_room_1' },
          { name: 'Secondary Server Room', tempId: 'temp_room_2' },
        ],
        upsList: [
          {
            name: 'UPS-Room1-A',
            tempId: 'temp_ups_1',
            roomId: 'temp_room_1',
            ip: '192.168.1.100',
          },
          {
            name: 'UPS-Room1-B',
            tempId: 'temp_ups_2',
            roomId: 'temp_room_1',
            ip: '192.168.1.101',
          },
          {
            name: 'UPS-Room2-A',
            tempId: 'temp_ups_3',
            roomId: 'temp_room_2',
            ip: '192.168.1.102',
          },
          {
            name: 'UPS-Room2-B',
            tempId: 'temp_ups_4',
            roomId: 'temp_room_2',
            ip: '192.168.1.103',
          },
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
          { name: 'DC1-Production', tempId: 'temp_room_1' },
          { name: 'DC1-Development', tempId: 'temp_room_2' },
          { name: 'DC1-Disaster Recovery', tempId: 'temp_room_3' },
        ],
        upsList: [
          {
            name: 'DC1-PROD-UPS-01',
            tempId: 'temp_ups_1',
            roomId: 'temp_room_1',
          },
          {
            name: 'DC1-PROD-UPS-02',
            tempId: 'temp_ups_2',
            roomId: 'temp_room_1',
          },
          {
            name: 'DC1-DEV-UPS-01',
            tempId: 'temp_ups_3',
            roomId: 'temp_room_2',
          },
          {
            name: 'DC1-DR-UPS-01',
            tempId: 'temp_ups_4',
            roomId: 'temp_room_3',
          },
          {
            name: 'DC1-DR-UPS-02',
            tempId: 'temp_ups_5',
            roomId: 'temp_room_3',
          },
        ],
        servers: [],
      },
      createdAt: new Date('2024-01-01'),
    },
  ];

  constructor(private readonly redisService: RedisSafeService) {}

  async execute(): Promise<TemplateListResponseDto> {
    const customTemplatesJson = await this.redisService.safeGet(this.REDIS_KEY);
    const customTemplates: TemplateResponseDto[] = customTemplatesJson
      ? JSON.parse(customTemplatesJson)
      : [];

    return {
      templates: [...this.predefinedTemplates, ...customTemplates],
    };
  }
}
