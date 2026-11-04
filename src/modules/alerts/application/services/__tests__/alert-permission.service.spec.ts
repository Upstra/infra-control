import { AlertPermissionService } from '../alert-permission.service';
import { createMockAlert } from '../../../__mocks__/alert.mock';
import { AlertResourceType } from '../../../domain/types/alert.types';

describe('AlertPermissionService', () => {
  const users = { findOneByField: jest.fn() };
  const strategy = { checkPermission: jest.fn() };
  const factory = { getStrategy: jest.fn(() => strategy) };
  const servers = { findAllByField: jest.fn() };
  const service = new AlertPermissionService(
    users as any,
    factory as any,
    servers as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    users.findOneByField.mockResolvedValue({ roles: [{ isAdmin: false }] });
  });

  it('lets admins act on any alert', async () => {
    users.findOneByField.mockResolvedValue({ roles: [{ isAdmin: true }] });

    await expect(service.canAct('admin', createMockAlert())).resolves.toBe(
      true,
    );
    expect(factory.getStrategy).not.toHaveBeenCalled();
  });

  it('allows a UPS alert when the user can act on one of its servers', async () => {
    servers.findAllByField.mockResolvedValue([
      { id: 'srv-1' },
      { id: 'srv-2' },
    ]);
    strategy.checkPermission
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await expect(service.canAct('user-1', createMockAlert())).resolves.toBe(
      true,
    );
    expect(servers.findAllByField).toHaveBeenCalledWith(
      expect.objectContaining({ field: 'upsId', value: 'ups-1' }),
    );
  });

  it('delegates VM alerts to the VM permission strategy', async () => {
    strategy.checkPermission.mockResolvedValue(false);

    const alert = createMockAlert({
      resourceType: AlertResourceType.VM,
      resourceId: 'vm-1',
    });
    await expect(service.canAct('user-1', alert)).resolves.toBe(false);
    expect(factory.getStrategy).toHaveBeenCalledWith('vm');
  });
});
