import { VmTypeormRepository } from './vm.typeorm.repository';
import { Repository } from 'typeorm';
import { Vm } from '../../domain/entities/vm.entity';
import { VmRetrievalException } from '../../domain/exceptions/vm.exception';

describe('VmTypeormRepository findOneByField', () => {
  let repo: VmTypeormRepository;
  let ormRepo: jest.Mocked<Repository<Vm>>;

  beforeEach(() => {
    ormRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<Vm>>;
    repo = new VmTypeormRepository({ createEntityManager: () => ormRepo } as any);
    (repo as any).findOne = ormRepo.findOne;
  });

  it('returns entity when found', async () => {
    const vm = { id: '1' } as Vm;
    ormRepo.findOne.mockResolvedValue(vm);
    const result = await repo.findOneByField({ field: 'id', value: '1' });
    expect(ormRepo.findOne).toHaveBeenCalled();
    expect(result).toBe(vm);
  });

  it('throws on invalid value', () => {
    expect(() =>
      repo.findOneByField({ field: 'id', value: undefined as any }),
    ).toThrow(/Invalid query value/);
  });

  it('returns null when error and disableThrow true', async () => {
    ormRepo.findOne.mockRejectedValue(new Error('db fail'));
    const result = await repo.findOneByField({
      field: 'id',
      value: 'x',
      disableThrow: true,
    });
    expect(result).toBeNull();
  });

  it('throws VmRetrievalException when error occurs', async () => {
    ormRepo.findOne.mockRejectedValue(new Error('oops'));
    await expect(
      repo.findOneByField({ field: 'id', value: 'x' }),
    ).rejects.toThrow(VmRetrievalException);
  });
});
