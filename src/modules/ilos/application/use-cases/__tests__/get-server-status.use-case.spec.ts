import { GetServerStatusUseCase } from '../get-server-status.use-case';
import { IloServerStatus } from '../../dto/ilo-status.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GetServerWithIloUseCase } from '@/modules/servers/application/use-cases/get-server-with-ilo.use-case';
import { VmwareService } from '@/modules/vmware/domain/services/vmware.service';

describe('GetServerStatusUseCase', () => {
  let useCase: GetServerStatusUseCase;
  let mockVmwareService: jest.Mocked<VmwareService>;
  let mockGetServerWithIloUseCase: jest.Mocked<GetServerWithIloUseCase>;

  const mockServer = {
    id: 'server-1',
    ip: '192.168.1.5',
    login: 'vcenter-user',
    password: 'vcenter-pass',
    ilo: {
      id: 'ilo-1',
      ip: '192.168.1.100',
      login: 'admin',
      password: 'password123',
      name: 'iLO Server 1',
    },
    name: 'Test Server',
    type: 'esxi',
    priority: 1,
    state: 'UP',
    roomId: 'room-1',
    vmwareHostMoid: 'host-123',
    upsId: 'ups-1',
    groupId: 'group-1',
    iloId: 'ilo-1',
  };

  beforeEach(() => {
    mockVmwareService = {
      getServerMetrics: jest.fn(),
    } as unknown as jest.Mocked<VmwareService>;

    mockGetServerWithIloUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetServerWithIloUseCase>;

    useCase = new GetServerStatusUseCase(
      mockVmwareService,
      mockGetServerWithIloUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should get server status successfully', async () => {
    mockGetServerWithIloUseCase.execute.mockResolvedValue(mockServer as any);
    mockVmwareService.getServerMetrics.mockResolvedValue({
      powerState: 'poweredOn',
      overallStatus: 'green',
      rebootRequired: false,
      cpuUsagePercent: 15.5,
      ramUsageMB: 32768,
      uptime: 86400,
      boottime: '2023-11-01T12:00:00.000Z',
    });

    const result = await useCase.execute('server-1');

    expect(result).toEqual({
      status: IloServerStatus.ON,
      ip: '192.168.1.100',
      serverId: 'server-1',
      serverName: 'Test Server',
      serverType: 'esxi',
      vmwareHostMoid: 'host-123',
      serverState: 'UP',
      serverPriority: 1,
      upsId: 'ups-1',
      roomId: 'room-1',
      groupId: 'group-1',
      iloId: 'ilo-1',
      metrics: {
        cpuUsage: 15.5,
        memoryUsage: 32768,
        powerState: 'poweredOn',
        uptime: 86400,
      },
    });
    expect(mockGetServerWithIloUseCase.execute).toHaveBeenCalledWith(
      'server-1',
    );
    expect(mockVmwareService.getServerMetrics).toHaveBeenCalledWith(
      'host-123',
      {
        host: '192.168.1.5',
        user: 'vcenter-user',
        password: 'vcenter-pass',
        port: 443,
      },
      false,
    );
  });

  it('should return OFF status', async () => {
    mockGetServerWithIloUseCase.execute.mockResolvedValue(mockServer as any);
    mockVmwareService.getServerMetrics.mockResolvedValue({
      powerState: 'poweredOff',
      overallStatus: 'green',
      rebootRequired: false,
      cpuUsagePercent: 0,
      ramUsageMB: 0,
      uptime: 0,
      boottime: '',
    });

    const result = await useCase.execute('server-1');

    expect(result).toEqual({
      status: IloServerStatus.OFF,
      ip: '192.168.1.100',
      serverId: 'server-1',
      serverName: 'Test Server',
      serverType: 'esxi',
      vmwareHostMoid: 'host-123',
      serverState: 'UP',
      serverPriority: 1,
      upsId: 'ups-1',
      roomId: 'room-1',
      groupId: 'group-1',
      iloId: 'ilo-1',
      metrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        powerState: 'poweredOff',
        uptime: 0,
      },
    });
  });

  it('should return ERROR status when metrics have standBy power state', async () => {
    mockGetServerWithIloUseCase.execute.mockResolvedValue(mockServer as any);
    mockVmwareService.getServerMetrics.mockResolvedValue({
      powerState: 'standBy',
      overallStatus: 'red',
      rebootRequired: false,
      cpuUsagePercent: 0,
      ramUsageMB: 0,
      uptime: 0,
      boottime: '2023-01-01',
    });

    const result = await useCase.execute('server-1');

    expect(result).toEqual({
      status: IloServerStatus.ERROR,
      ip: '192.168.1.100',
      serverId: 'server-1',
      serverName: 'Test Server',
      serverType: 'esxi',
      vmwareHostMoid: 'host-123',
      serverState: 'UP',
      serverPriority: 1,
      upsId: 'ups-1',
      roomId: 'room-1',
      groupId: 'group-1',
      iloId: 'ilo-1',
      metrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        powerState: 'standBy',
        uptime: 0,
      },
    });
  });

  it('should throw error when server is not found', async () => {
    mockGetServerWithIloUseCase.execute.mockRejectedValue(
      new NotFoundException('Server with ID server-999 not found'),
    );

    await expect(useCase.execute('server-999')).rejects.toThrow(
      new NotFoundException('Server with ID server-999 not found'),
    );

    expect(mockGetServerWithIloUseCase.execute).toHaveBeenCalledWith(
      'server-999',
    );
    expect(mockVmwareService.getServerMetrics).not.toHaveBeenCalled();
  });

  it('should throw error when server has no iLO configured', async () => {
    mockGetServerWithIloUseCase.execute.mockRejectedValue(
      new NotFoundException('Server server-1 does not have an iLO configured'),
    );

    await expect(useCase.execute('server-1')).rejects.toThrow(
      new NotFoundException('Server server-1 does not have an iLO configured'),
    );

    expect(mockVmwareService.getServerMetrics).not.toHaveBeenCalled();
  });

  it('should throw error when server has no VMware host moid configured', async () => {
    const serverWithoutMoid = { ...mockServer, vmwareHostMoid: undefined };
    mockGetServerWithIloUseCase.execute.mockResolvedValue(
      serverWithoutMoid as any,
    );

    await expect(useCase.execute('server-1')).rejects.toThrow(
      new BadRequestException(
        'Server server-1 does not have a VMware host moid configured',
      ),
    );

    expect(mockVmwareService.getServerMetrics).not.toHaveBeenCalled();
  });

  it('should handle VMware service errors', async () => {
    const error = new Error('Failed to connect to vCenter');
    mockGetServerWithIloUseCase.execute.mockResolvedValue(mockServer as any);
    mockVmwareService.getServerMetrics.mockRejectedValue(error);

    await expect(useCase.execute('server-1')).rejects.toThrow(error);

    expect(mockVmwareService.getServerMetrics).toHaveBeenCalledWith(
      'host-123',
      {
        host: '192.168.1.5',
        user: 'vcenter-user',
        password: 'vcenter-pass',
        port: 443,
      },
      false,
    );
  });

  it('should force refresh metrics when force parameter is true', async () => {
    mockGetServerWithIloUseCase.execute.mockResolvedValue(mockServer as any);
    mockVmwareService.getServerMetrics.mockResolvedValue({
      powerState: 'poweredOn',
      overallStatus: 'green',
      rebootRequired: false,
      cpuUsagePercent: 25.0,
      ramUsageMB: 65536,
      uptime: 172800,
      boottime: '2023-11-01T12:00:00.000Z',
    });

    const result = await useCase.execute('server-1', true);

    expect(result).toEqual({
      status: IloServerStatus.ON,
      ip: '192.168.1.100',
      serverId: 'server-1',
      serverName: 'Test Server',
      serverType: 'esxi',
      vmwareHostMoid: 'host-123',
      serverState: 'UP',
      serverPriority: 1,
      upsId: 'ups-1',
      roomId: 'room-1',
      groupId: 'group-1',
      iloId: 'ilo-1',
      metrics: {
        cpuUsage: 25.0,
        memoryUsage: 65536,
        powerState: 'poweredOn',
        uptime: 172800,
      },
    });

    expect(mockVmwareService.getServerMetrics).toHaveBeenCalledWith(
      'host-123',
      {
        host: '192.168.1.5',
        user: 'vcenter-user',
        password: 'vcenter-pass',
        port: 443,
      },
      true,
    );
  });

  it('should throw BadRequestException for empty server ID', async () => {
    await expect(useCase.execute('')).rejects.toThrow(
      new BadRequestException('Server ID must be a valid non-empty string'),
    );

    expect(mockGetServerWithIloUseCase.execute).not.toHaveBeenCalled();
    expect(mockVmwareService.getServerMetrics).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException for invalid server ID type', async () => {
    await expect(useCase.execute(null as any)).rejects.toThrow(
      new BadRequestException('Server ID must be a valid non-empty string'),
    );

    expect(mockGetServerWithIloUseCase.execute).not.toHaveBeenCalled();
    expect(mockVmwareService.getServerMetrics).not.toHaveBeenCalled();
  });
});
