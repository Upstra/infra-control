import { Test, TestingModule } from '@nestjs/testing';
import { MigrationDestinationsController } from '../migration-destinations.controller';
import { GenerateMigrationPlanWithDestinationUseCase } from '../../use-cases/generate-migration-plan-with-destination.use-case';
import { GetMigrationDestinationsUseCase } from '../../use-cases/get-migration-destinations.use-case';
import { RemoveMigrationDestinationUseCase } from '../../use-cases/remove-migration-destination.use-case';
import { GetVmsForMigrationUseCase } from '../../use-cases/get-vms-for-migration.use-case';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RoleGuard } from '@/core/guards/role.guard';
import {
  SetMigrationDestinationsDto,
  MigrationDestinationDto,
  VmsForMigrationResponseDto,
} from '../../dto/migration-destination.dto';

describe('MigrationDestinationsController', () => {
  let controller: MigrationDestinationsController;

  const mockGenerateMigrationPlanWithDestination = {
    execute: jest.fn(),
  };

  const mockGetMigrationDestinations = {
    execute: jest.fn(),
  };

  const mockRemoveMigrationDestination = {
    execute: jest.fn(),
  };

  const mockGetVmsForMigration = {
    execute: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockRoleGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MigrationDestinationsController],
      providers: [
        {
          provide: GenerateMigrationPlanWithDestinationUseCase,
          useValue: mockGenerateMigrationPlanWithDestination,
        },
        {
          provide: GetMigrationDestinationsUseCase,
          useValue: mockGetMigrationDestinations,
        },
        {
          provide: RemoveMigrationDestinationUseCase,
          useValue: mockRemoveMigrationDestination,
        },
        {
          provide: GetVmsForMigrationUseCase,
          useValue: mockGetVmsForMigration,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RoleGuard)
      .useValue(mockRoleGuard)
      .compile();

    controller = module.get<MigrationDestinationsController>(
      MigrationDestinationsController,
    );

    jest.clearAllMocks();
  });

  describe('getMigrationDestinationsList', () => {
    it('should return migration destinations list', async () => {
      const expectedResponse = {
        destinations: [
          {
            sourceServer: {
              id: 'server-1',
              name: 'esxi-01',
              vmwareHostMoid: 'host-123',
            },
            destinationServer: {
              id: 'server-2',
              name: 'esxi-02',
              vmwareHostMoid: 'host-456',
            },
          },
        ],
        yamlPath: '/home/upstra/ups_manager/plans/migration.yml',
      };

      mockGetMigrationDestinations.execute.mockResolvedValue(expectedResponse);

      const result = await controller.getMigrationDestinationsList();

      expect(mockGetMigrationDestinations.execute).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('setMigrationDestinations', () => {
    it('should configure migration destinations successfully', async () => {
      const destinations: MigrationDestinationDto[] = [
        {
          sourceServerId: 'server-1',
          destinationServerId: 'server-2',
        },
      ];
      const dto: SetMigrationDestinationsDto = { destinations };

      mockGenerateMigrationPlanWithDestination.execute.mockResolvedValue(
        undefined,
      );

      const result = await controller.setMigrationDestinations(dto);

      expect(
        mockGenerateMigrationPlanWithDestination.execute,
      ).toHaveBeenCalledWith(destinations);
      expect(result).toEqual({
        message: 'Migration destinations configured successfully',
        yamlPath: '/home/upstra/ups_manager/plans/migration.yml',
      });
    });
  });

  describe('removeMigrationDestination', () => {
    it('should remove migration destination successfully', async () => {
      const sourceServerId = 'server-1';

      mockRemoveMigrationDestination.execute.mockResolvedValue(undefined);

      const result =
        await controller.removeMigrationDestination(sourceServerId);

      expect(mockRemoveMigrationDestination.execute).toHaveBeenCalledWith(
        sourceServerId,
      );
      expect(result).toEqual({
        message: 'Migration destination removed successfully',
        sourceServerId,
      });
    });
  });

  describe('getVmsForMigration', () => {
    it('should return VMs grouped by servers for migration', async () => {
      const expectedResponse: VmsForMigrationResponseDto = {
        servers: [
          {
            server: {
              id: 'server-1',
              name: 'esxi-01',
              vmwareHostMoid: 'host-123',
            },
            vms: [
              {
                id: 'vm-1',
                name: 'web-server-01',
                moid: 'vm-1001',
                state: 'powered_on',
                priority: 1,
                grace_period_on: 30,
                grace_period_off: 60,
              },
            ],
          },
        ],
        totalServers: 1,
        totalVms: 1,
      };

      mockGetVmsForMigration.execute.mockResolvedValue(expectedResponse);

      const result = await controller.getVmsForMigration();

      expect(mockGetVmsForMigration.execute).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });

    it('should handle empty VMs response', async () => {
      const expectedResponse: VmsForMigrationResponseDto = {
        servers: [],
        totalServers: 0,
        totalVms: 0,
      };

      mockGetVmsForMigration.execute.mockResolvedValue(expectedResponse);

      const result = await controller.getVmsForMigration();

      expect(mockGetVmsForMigration.execute).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });
  });
});
