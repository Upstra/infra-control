import { validate } from 'class-validator';
import { ServerCreationDto } from '../server.creation.dto';
import { createMockServerCreationDto } from '@/modules/servers/__mocks__/servers.mock';
import { v4 as uuidv4 } from 'uuid';

describe('ServerCreationDto - vCenter validation', () => {
  const validUUIDs = {
    roomId: uuidv4(),
    groupId: uuidv4(),
    upsId: uuidv4(),
  };
  describe('vCenter servers', () => {
    it('should pass validation without priority for vCenter', async () => {
      const dto = Object.assign(new ServerCreationDto(), createMockServerCreationDto({
        type: 'vcenter',
        priority: undefined,
        ilo: undefined,
        ...validUUIDs,
      }));

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with priority for vCenter', async () => {
      const dto = Object.assign(new ServerCreationDto(), createMockServerCreationDto({
        type: 'vcenter',
        priority: 10,
        ilo: undefined,
        ...validUUIDs,
      }));

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid priority for vCenter', async () => {
      const dto = Object.assign(new ServerCreationDto(), createMockServerCreationDto({
        type: 'vcenter',
        priority: 1000,
        ilo: undefined,
        ...validUUIDs,
      }));

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('priority');
      expect(errors[0].constraints?.isConditionalPriority).toContain('between 1 and 999');
    });
  });

  describe('non-vCenter servers', () => {
    it('should fail validation without priority for ESXi', async () => {
      const dto = Object.assign(new ServerCreationDto(), createMockServerCreationDto({
        type: 'esxi',
        priority: undefined,
        ...validUUIDs,
      }));

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('priority');
      expect(errors[0].constraints?.isConditionalPriority).toContain('required');
    });

    it('should pass validation with valid priority for ESXi', async () => {
      const dto = Object.assign(new ServerCreationDto(), createMockServerCreationDto({
        type: 'esxi',
        priority: 10,
        ...validUUIDs,
      }));

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without priority for vmware', async () => {
      const dto = Object.assign(new ServerCreationDto(), createMockServerCreationDto({
        type: 'vmware',
        priority: undefined,
        ...validUUIDs,
      }));

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('priority');
      expect(errors[0].constraints?.isConditionalPriority).toContain('required');
    });
  });
});