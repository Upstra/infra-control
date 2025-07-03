import { ToggleCascadeUseCase } from '../toggle-cascade.use-case';
import { Repository } from 'typeorm';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';
import { createMockGroupServer } from '@/modules/groups/__mocks__/group.server.mock';
import { createMockGroupVm } from '@/modules/groups/__mocks__/group.vm.mock';
import { GroupServerResponseDto } from '../../dto/group.server.response.dto';
import { GroupVmResponseDto } from '../../dto/group.vm.response.dto';
import { GroupServer } from '@/modules/groups/domain/entities/group.server.entity';
import { GroupVm } from '@/modules/groups/domain/entities/group.vm.entity';
import { NotFoundException } from '@nestjs/common';

describe('ToggleCascadeUseCase', () => {
  let useCase: ToggleCascadeUseCase;
  let groupServerRepository: jest.Mocked<Repository<GroupServer>>;
  let groupVmRepository: jest.Mocked<Repository<GroupVm>>;
  let logHistoryUseCase: jest.Mocked<LogHistoryUseCase>;

  beforeEach(() => {
    groupServerRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;

    groupVmRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;

    logHistoryUseCase = {
      executeStructured: jest.fn(),
    } as any;

    useCase = new ToggleCascadeUseCase(
      groupServerRepository,
      groupVmRepository,
      logHistoryUseCase,
    );
  });

  describe('Server Groups', () => {
    it('should toggle cascade for server group from true to false', async () => {
      const group = createMockGroupServer({
        id: 'group-1',
        cascade: true,
      });

      groupServerRepository.findOne.mockResolvedValue(group);
      groupServerRepository.save.mockImplementation(
        async (g) => g as GroupServer,
      );

      const result = await useCase.execute(
        'server',
        'group-1',
        false,
        'user-123',
      );

      expect(group.cascade).toBe(false);
      expect(groupServerRepository.save).toHaveBeenCalledWith(group);
      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith({
        entity: 'group_server',
        entityId: 'group-1',
        action: 'UPDATE',
        userId: 'user-123',
        oldValue: { cascade: true },
        newValue: { cascade: false },
        metadata: { field: 'cascade' },
      });
      expect(result).toEqual(new GroupServerResponseDto(group));
    });

    it('should toggle cascade for server group from false to true', async () => {
      const group = createMockGroupServer({
        id: 'group-2',
        cascade: false,
      });

      groupServerRepository.findOne.mockResolvedValue(group);
      groupServerRepository.save.mockImplementation(
        async (g) => g as GroupServer,
      );

      const result = await useCase.execute(
        'server',
        'group-2',
        true,
        'user-123',
      );

      expect(group.cascade).toBe(true);
      expect(result).toEqual(new GroupServerResponseDto(group));
    });

    it('should throw GroupNotFoundException for non-existent server group', async () => {
      groupServerRepository.findOne.mockResolvedValue(null);

      await expect(
        useCase.execute('server', 'non-existent', true, 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('VM Groups', () => {
    it('should toggle cascade for VM group', async () => {
      const group = createMockGroupVm({
        id: 'vm-group-1',
        cascade: true,
      });

      groupVmRepository.findOne.mockResolvedValue(group);
      groupVmRepository.save.mockImplementation(async (g) => g as GroupVm);

      const result = await useCase.execute(
        'vm',
        'vm-group-1',
        false,
        'user-123',
      );

      expect(group.cascade).toBe(false);
      expect(groupVmRepository.save).toHaveBeenCalledWith(group);
      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith({
        entity: 'group_vm',
        entityId: 'vm-group-1',
        action: 'UPDATE',
        userId: 'user-123',
        oldValue: { cascade: true },
        newValue: { cascade: false },
        metadata: { field: 'cascade' },
      });
      expect(result).toEqual(new GroupVmResponseDto(group));
    });

    it('should throw GroupNotFoundException for non-existent VM group', async () => {
      groupVmRepository.findOne.mockResolvedValue(null);

      await expect(
        useCase.execute('vm', 'non-existent', true, 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  it('should throw error for invalid group type', async () => {
    await expect(
      useCase.execute('invalid' as any, 'group-1', true, 'user-123'),
    ).rejects.toThrow();
  });
});
