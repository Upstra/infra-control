import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExecuteGroupShutdownUseCase } from '../execute-group-shutdown.use-case';
import { GroupRepository } from '../../../infrastructure/repositories/group.repository';
import { Group } from '../../../domain/entities/group.entity';
import { GroupType } from '../../../domain/enums/group-type.enum';
import { GroupShutdownDto } from '../../dto/group-shutdown.dto';
import { Vm } from '../../../../vms/domain/entities/vm.entity';
import { Server } from '../../../../servers/domain/entities/server.entity';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

describe('ExecuteGroupShutdownUseCase', () => {
  let useCase: ExecuteGroupShutdownUseCase;
  let groupRepository: jest.Mocked<GroupRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecuteGroupShutdownUseCase,
        {
          provide: GroupRepository,
          useValue: {
            findById: jest.fn(),
            executeInTransaction: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Vm),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Server),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: LogHistoryUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ExecuteGroupShutdownUseCase>(
      ExecuteGroupShutdownUseCase,
    );
    groupRepository = module.get(GroupRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const groupId = 'test-group-id';
    const userId = 'test-user-id';

    it('should throw NotFoundException when group does not exist', async () => {
      groupRepository.findById.mockResolvedValue(null);

      const dto: GroupShutdownDto = { gracePeriod: 300, force: false };

      await expect(useCase.execute(groupId, dto, userId)).rejects.toThrow(
        new NotFoundException(`Group with id "${groupId}" not found`),
      );

      expect(groupRepository.findById).toHaveBeenCalledWith(groupId);
    });

    describe('VM Group Shutdown', () => {
      const mockGroup = Object.assign(new Group(), {
        id: groupId,
        name: 'Test VM Group',
        type: GroupType.VM,
      });

      beforeEach(() => {
        groupRepository.findById.mockResolvedValue(mockGroup);
      });

      it('should shutdown all VMs in the group', async () => {
        const mockVms = [
          Object.assign(new Vm(), {
            id: '1',
            name: 'VM1',
            state: 'running',
            priority: 1,
            groupId,
          }),
          Object.assign(new Vm(), {
            id: '2',
            name: 'VM2',
            state: 'running',
            priority: 2,
            groupId,
          }),
          Object.assign(new Vm(), {
            id: '3',
            name: 'VM3',
            state: 'stopped',
            priority: 3,
            groupId,
          }),
        ];

        groupRepository.executeInTransaction.mockImplementation(
          async (callback) => {
            const mockManager = {
              find: jest.fn().mockResolvedValue(mockVms),
              save: jest.fn().mockImplementation((vm) => Promise.resolve(vm)),
            };
            return callback(mockManager);
          },
        );

        jest.spyOn(useCase as any, 'wait').mockResolvedValue(undefined);

        const dto: GroupShutdownDto = {};
        await useCase.execute(groupId, dto, userId);

        expect(groupRepository.executeInTransaction).toHaveBeenCalled();
      });

      it('should use custom grace period', async () => {
        const mockVm = Object.assign(new Vm(), {
          id: '1',
          name: 'VM1',
          state: 'running',
          priority: 1,
          groupId,
        });

        const waitSpy = jest
          .spyOn(useCase as any, 'wait')
          .mockResolvedValue(undefined);

        groupRepository.executeInTransaction.mockImplementation(
          async (callback) => {
            const mockManager = {
              find: jest.fn().mockResolvedValue([mockVm]),
              save: jest.fn().mockResolvedValue(mockVm),
            };
            await callback(mockManager);
            expect(mockManager.save).toHaveBeenCalledWith(
              expect.objectContaining({ id: '1', state: 'stopped' }),
            );
          },
        );

        const dto: GroupShutdownDto = { gracePeriod: 600 };
        await useCase.execute(groupId, dto, userId);

        expect(waitSpy).toHaveBeenCalledWith(600 * 1000);
      });

      it('should throw BadRequestException on error when force is false', async () => {
        jest.spyOn(useCase as any, 'wait').mockResolvedValue(undefined);

        groupRepository.executeInTransaction.mockRejectedValue(
          new Error('Save failed'),
        );

        const dto: GroupShutdownDto = { force: false };

        await expect(useCase.execute(groupId, dto, userId)).rejects.toThrow(
          new BadRequestException(
            'Shutdown failed: Save failed. Use force=true to ignore errors.',
          ),
        );
      });

      it('should continue on error when force is true', async () => {
        const mockVms = [
          Object.assign(new Vm(), {
            id: '1',
            name: 'VM1',
            state: 'running',
            priority: 1,
            groupId,
          }),
          Object.assign(new Vm(), {
            id: '2',
            name: 'VM2',
            state: 'running',
            priority: 2,
            groupId,
          }),
        ];

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(useCase as any, 'wait').mockResolvedValue(undefined);

        groupRepository.executeInTransaction.mockImplementation(
          async (callback) => {
            const mockManager = {
              find: jest.fn().mockResolvedValue(mockVms),
              save: jest
                .fn()
                .mockRejectedValueOnce(new Error('Save failed'))
                .mockResolvedValueOnce(mockVms[1]),
            };
            try {
              await callback(mockManager);
            } catch {}
          },
        );

        const dto: GroupShutdownDto = { force: true };
        await useCase.execute(groupId, dto, userId);

        consoleSpy.mockRestore();
      });
    });

    describe('Server Group Shutdown', () => {
      const mockGroup = Object.assign(new Group(), {
        id: groupId,
        name: 'Test Server Group',
        type: GroupType.SERVER,
      });

      beforeEach(() => {
        groupRepository.findById.mockResolvedValue(mockGroup);
      });

      it('should shutdown servers and their VMs', async () => {
        const mockServers = [
          Object.assign(new Server(), {
            id: 's1',
            name: 'Server1',
            state: 'running',
            priority: 1,
            groupId,
          }),
          Object.assign(new Server(), {
            id: 's2',
            name: 'Server2',
            state: 'stopped',
            priority: 2,
            groupId,
          }),
        ];

        const mockVms = [
          Object.assign(new Vm(), {
            id: 'v1',
            name: 'VM1',
            state: 'running',
            serverId: 's1',
            priority: 1,
          }),
          Object.assign(new Vm(), {
            id: 'v2',
            name: 'VM2',
            state: 'stopped',
            serverId: 's1',
            priority: 2,
          }),
        ];

        jest.spyOn(useCase as any, 'wait').mockResolvedValue(undefined);

        groupRepository.executeInTransaction.mockImplementation(
          async (callback) => {
            const mockManager = {
              find: jest.fn((entity, options) => {
                if (entity === Server) {
                  return Promise.resolve(mockServers);
                } else if (entity === Vm) {
                  if (options.where.serverId === 's1') {
                    return Promise.resolve(mockVms);
                  }
                  return Promise.resolve([]);
                }
                return Promise.resolve([]);
              }),
              save: jest
                .fn()
                .mockImplementation((item) => Promise.resolve(item)),
            };
            await callback(mockManager);

            expect(mockManager.save).toHaveBeenCalledWith(
              expect.objectContaining({ id: 'v1', state: 'stopped' }),
            );

            expect(mockManager.save).toHaveBeenCalledWith(
              expect.objectContaining({ id: 's1', state: 'stopped' }),
            );
          },
        );

        const dto: GroupShutdownDto = { gracePeriod: 300 };
        await useCase.execute(groupId, dto, userId);
      });

      it('should handle server shutdown errors with force=true', async () => {
        const mockServer = Object.assign(new Server(), {
          id: 's1',
          name: 'Server1',
          state: 'running',
          priority: 1,
          groupId,
        });

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(useCase as any, 'wait').mockResolvedValue(undefined);

        groupRepository.executeInTransaction.mockImplementation(
          async (callback) => {
            const mockManager = {
              find: jest.fn((entity) => {
                if (entity === Server) {
                  return Promise.resolve([mockServer]);
                }
                return Promise.resolve([]);
              }),
              save: jest
                .fn()
                .mockRejectedValue(new Error('Server save failed')),
            };
            try {
              await callback(mockManager);
            } catch {}
          },
        );

        const dto: GroupShutdownDto = { force: true };
        await useCase.execute(groupId, dto, userId);

        consoleSpy.mockRestore();
      });

      it('should respect VM grace periods when shutting down servers', async () => {
        const mockServer = Object.assign(new Server(), {
          id: 's1',
          name: 'Server1',
          state: 'running',
          priority: 1,
          groupId,
        });

        const mockVm = Object.assign(new Vm(), {
          id: 'v1',
          name: 'VM1',
          state: 'running',
          serverId: 's1',
          priority: 1,
        });

        const waitSpy = jest
          .spyOn(useCase as any, 'wait')
          .mockResolvedValue(undefined);

        groupRepository.executeInTransaction.mockImplementation(
          async (callback) => {
            const mockManager = {
              find: jest.fn((entity, options) => {
                if (entity === Server) {
                  return Promise.resolve([mockServer]);
                } else if (entity === Vm && options.where.serverId === 's1') {
                  return Promise.resolve([mockVm]);
                }
                return Promise.resolve([]);
              }),
              save: jest
                .fn()
                .mockImplementation((item) => Promise.resolve(item)),
            };
            await callback(mockManager);
          },
        );

        const dto: GroupShutdownDto = { gracePeriod: 300 };
        await useCase.execute(groupId, dto, userId);

        expect(waitSpy).toHaveBeenCalledWith(120 * 1000);
        expect(waitSpy).toHaveBeenCalledWith(300 * 1000);
      });
    });

    describe('default values', () => {
      it('should use default grace period when not provided', async () => {
        const mockGroup = Object.assign(new Group(), {
          id: groupId,
          name: 'Test Group',
          type: GroupType.VM,
        });

        groupRepository.findById.mockResolvedValue(mockGroup);

        groupRepository.executeInTransaction.mockImplementation(
          async (callback) => {
            const mockManager = {
              find: jest.fn().mockResolvedValue([]),
              save: jest.fn(),
            };
            await callback(mockManager);
          },
        );

        const dto: GroupShutdownDto = {};
        await useCase.execute(groupId, dto, userId);

        expect(groupRepository.executeInTransaction).toHaveBeenCalled();
      });

      it('should use default force value when not provided', async () => {
        const mockGroup = Object.assign(new Group(), {
          id: groupId,
          name: 'Test Group',
          type: GroupType.VM,
        });

        groupRepository.findById.mockResolvedValue(mockGroup);

        jest.spyOn(useCase as any, 'wait').mockResolvedValue(undefined);

        groupRepository.executeInTransaction.mockRejectedValue(
          new Error('Save failed'),
        );

        const dto: GroupShutdownDto = {};

        await expect(useCase.execute(groupId, dto, userId)).rejects.toThrow(
          new BadRequestException(
            'Shutdown failed: Save failed. Use force=true to ignore errors.',
          ),
        );
      });
    });
  });

  describe('wait', () => {
    it('should wait for specified time', async () => {
      const waitTime = 1000;
      const startTime = Date.now();

      jest.useRealTimers();

      const waitPromise = useCase['wait'](waitTime);

      await waitPromise;

      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(waitTime - 50);
      expect(endTime - startTime).toBeLessThanOrEqual(waitTime + 100);
    });
  });
});
