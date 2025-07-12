import { Test, TestingModule } from '@nestjs/testing';
import { GetTemplatesUseCase } from '../get-templates.use-case';
import { TemplateType } from '../../dto';

describe('GetTemplatesUseCase', () => {
  let useCase: GetTemplatesUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GetTemplatesUseCase],
    }).compile();

    useCase = module.get<GetTemplatesUseCase>(GetTemplatesUseCase);
  });

  describe('execute', () => {
    it('should return predefined templates', async () => {
      const result = await useCase.execute();

      expect(result.templates).toBeDefined();
      expect(result.templates.length).toBeGreaterThan(0);
    });

    it('should return templates with correct structure', async () => {
      const result = await useCase.execute();

      result.templates.forEach((template) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('type');
        expect(template).toHaveProperty('configuration');
        expect(template).toHaveProperty('createdAt');

        expect(template.type).toBe(TemplateType.PREDEFINED);
        expect(template.configuration).toHaveProperty('rooms');
        expect(template.configuration).toHaveProperty('upsList');
        expect(template.configuration).toHaveProperty('servers');
      });
    });

    it('should include small data center template', async () => {
      const result = await useCase.execute();

      const smallDcTemplate = result.templates.find(
        (t) => t.id === 'template-small-dc',
      );

      expect(smallDcTemplate).toBeDefined();
      expect(smallDcTemplate!.name).toBe('Small Data Center');
      expect(smallDcTemplate!.configuration.rooms).toHaveLength(1);
      expect(smallDcTemplate!.configuration.upsList).toHaveLength(2);
      expect(smallDcTemplate!.configuration.servers).toHaveLength(2);
    });

    it('should include medium data center template', async () => {
      const result = await useCase.execute();

      const mediumDcTemplate = result.templates.find(
        (t) => t.id === 'template-medium-dc',
      );

      expect(mediumDcTemplate).toBeDefined();
      expect(mediumDcTemplate!.name).toBe('Medium Data Center');
      expect(mediumDcTemplate!.configuration.rooms).toHaveLength(2);
      expect(mediumDcTemplate!.configuration.upsList).toHaveLength(4);
      expect(mediumDcTemplate!.configuration.servers).toHaveLength(0);
    });

    it('should include enterprise data center template', async () => {
      const result = await useCase.execute();

      const enterpriseDcTemplate = result.templates.find(
        (t) => t.id === 'template-enterprise-dc',
      );

      expect(enterpriseDcTemplate).toBeDefined();
      expect(enterpriseDcTemplate!.name).toBe('Enterprise Data Center');
      expect(enterpriseDcTemplate!.configuration.rooms).toHaveLength(3);
      expect(enterpriseDcTemplate!.configuration.upsList).toHaveLength(5);
      expect(enterpriseDcTemplate!.configuration.servers).toHaveLength(0);
    });

    it('should use proper temporary IDs for relationships', async () => {
      const result = await useCase.execute();

      const smallDcTemplate = result.templates.find(
        (t) => t.id === 'template-small-dc',
      );

      // Check UPS room references
      smallDcTemplate!.configuration.upsList.forEach((ups) => {
        expect(ups.roomId).toMatch(/^temp_room_\d+$/);
      });

      // Check server room and UPS references
      smallDcTemplate!.configuration.servers.forEach((server) => {
        expect(server.roomId).toMatch(/^temp_room_\d+$/);
        expect(server.upsId).toMatch(/^temp_ups_\d+$/);
      });
    });
  });
});