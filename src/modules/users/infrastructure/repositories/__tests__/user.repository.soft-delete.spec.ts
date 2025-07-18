import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, IsNull } from 'typeorm';
import { UserTypeormRepository } from '../user.typeorm.repository';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';

describe('UserTypeormRepository - Soft Delete Filtering', () => {
  let repository: UserTypeormRepository;

  const mockActiveUser = createMockUser({ deleted: false });
  const mockDeletedUser = createMockUser({
    id: 'deleted-user-id',
    email: 'deleted@example.com',
    deleted: true,
    deletedAt: new Date(),
  });

  beforeEach(async () => {
    const mockEntityManager = {
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserTypeormRepository,
        {
          provide: DataSource,
          useValue: {
            createEntityManager: jest.fn().mockReturnValue(mockEntityManager),
          },
        },
      ],
    }).compile();

    repository = module.get<UserTypeormRepository>(UserTypeormRepository);
  });

  describe('findAll', () => {
    it('should exclude deleted users by default', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([mockActiveUser]);

      const result = await repository.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        where: { deletedAt: IsNull() },
        relations: ['role'],
      });
      expect(result).toEqual([mockActiveUser]);
    });

    it('should include deleted users when includeDeleted is true', async () => {
      jest
        .spyOn(repository, 'find')
        .mockResolvedValue([mockActiveUser, mockDeletedUser]);

      const result = await repository.findAll(['role'], true);

      expect(repository.find).toHaveBeenCalledWith({
        where: {},
        relations: ['role'],
      });
      expect(result).toContain(mockDeletedUser);
    });
  });

  describe('findAllByField', () => {
    it('should exclude deleted users by default', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([mockActiveUser]);

      const result = await repository.findAllByField({
        field: 'email',
        value: 'test@example.com',
      });

      expect(repository.find).toHaveBeenCalledWith({
        where: { email: 'test@example.com', deletedAt: IsNull() },
        relations: [],
      });
      expect(result).toEqual([mockActiveUser]);
    });

    it('should handle array values with deleted filter', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([mockActiveUser]);

      const result = await repository.findAllByField({
        field: 'id',
        value: ['id1', 'id2'],
      });

      expect(repository.find).toHaveBeenCalledWith({
        where: { id: expect.any(Object), deletedAt: IsNull() },
        relations: [],
      });
      expect(result).toEqual([mockActiveUser]);
    });
  });

  describe('paginate', () => {
    it('should exclude deleted users by default', async () => {
      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([[mockActiveUser], 1]);

      const result = await repository.paginate(1, 10);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { deletedAt: IsNull() },
        relations: ['roles'],
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result[0]).toEqual([mockActiveUser]);
      expect(result[1]).toBe(1);
    });

    it('should include deleted users when includeDeleted is true', async () => {
      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([[mockActiveUser, mockDeletedUser], 2]);

      const result = await repository.paginate(1, 10, ['roles'], true);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: {},
        relations: ['roles'],
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result[0]).toHaveLength(2);
      expect(result[1]).toBe(2);
    });
  });

  describe('findOneByField', () => {
    it('should exclude deleted users by default', async () => {
      jest.spyOn(repository, 'findOneOrFail').mockResolvedValue(mockActiveUser);

      const result = await repository.findOneByField({
        field: 'email',
        value: 'test@example.com',
      });

      expect(repository.findOneOrFail).toHaveBeenCalledWith({
        where: { email: 'test@example.com', deletedAt: IsNull() },
        relations: [],
      });
      expect(result).toEqual(mockActiveUser);
    });
  });

  describe('countUsers', () => {
    it('should exclude deleted users by default', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      };
      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await repository.countUsers();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'user.deletedAt IS NULL',
      );
      expect(result).toBe(5);
    });

    it('should include deleted users when includeDeleted is true', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(10),
      };
      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await repository.countUsers(true);

      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
      expect(result).toBe(10);
    });
  });

  describe('count', () => {
    it('should call countUsers with false by default', async () => {
      jest.spyOn(repository, 'countUsers').mockResolvedValue(5);

      const result = await repository.count();

      expect(repository.countUsers).toHaveBeenCalledWith(false);
      expect(result).toBe(5);
    });
  });

  describe('countAdmins', () => {
    it('should exclude deleted users by default', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      };
      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await repository.countAdmins();

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.deletedAt IS NULL',
      );
      expect(result).toBe(2);
    });

    it('should include deleted users when includeDeleted is true', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(3),
      };
      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await repository.countAdmins(true);

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'user.deletedAt IS NULL',
      );
      expect(result).toBe(3);
    });
  });

  describe('findUsersByRole', () => {
    it('should exclude deleted users by default', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockActiveUser]),
      };
      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await repository.findUsersByRole('role-id');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.deletedAt IS NULL',
      );
      expect(result).toEqual([mockActiveUser]);
    });
  });

  describe('findWithRoles', () => {
    it('should exclude deleted users by default', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockActiveUser);

      const result = await repository.findWithRoles('user-id');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id', deletedAt: IsNull() },
        relations: ['roles'],
      });
      expect(result).toEqual(mockActiveUser);
    });

    it('should include deleted users when includeDeleted is true', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockDeletedUser);

      const result = await repository.findWithRoles('deleted-user-id', true);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'deleted-user-id' },
        relations: ['roles'],
      });
      expect(result).toEqual(mockDeletedUser);
    });
  });

  describe('softDeleteUser', () => {
    it('should soft delete a user by setting deletedAt and isActive', async () => {
      const userToDelete = { ...mockActiveUser };
      jest.spyOn(repository, 'findOneById').mockResolvedValue(userToDelete as any);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...userToDelete,
        deletedAt: new Date(),
        isActive: false,
      } as any);

      const result = await repository.softDeleteUser('user-id');

      expect(repository.findOneById).toHaveBeenCalledWith('user-id');
      expect(repository.save).toHaveBeenCalledWith({
        ...userToDelete,
        deletedAt: expect.any(Date),
        isActive: false,
      });
      expect(result.deletedAt).toBeDefined();
      expect(result.isActive).toBe(false);
    });

    it('should throw UserNotFoundException if user not found', async () => {
      jest.spyOn(repository, 'findOneById').mockResolvedValue(null);
      const saveSpy = jest.spyOn(repository, 'save');

      await expect(repository.softDeleteUser('non-existent-id')).rejects.toThrow();
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should throw UserExceptions.deletionFailed on save error', async () => {
      jest.spyOn(repository, 'findOneById').mockResolvedValue(mockActiveUser as any);
      jest.spyOn(repository, 'save').mockRejectedValue(new Error('DB Error'));

      await expect(repository.softDeleteUser('user-id')).rejects.toThrow();
    });
  });

  describe('findOneById vs findById', () => {
    it('findOneById should exclude deleted users', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockActiveUser);

      const result = await repository.findOneById('user-id');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id', deletedAt: IsNull() },
      });
      expect(result).toEqual(mockActiveUser);
    });

    it('findById should exclude deleted users by default', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await repository.findById('deleted-user-id');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'deleted-user-id', deletedAt: IsNull() },
      });
      expect(result).toBeNull();
    });

    it('findById should include deleted users when includeDeleted is true', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockDeletedUser);

      const result = await repository.findById('deleted-user-id', true);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'deleted-user-id' },
      });
      expect(result).toEqual(mockDeletedUser);
    });
  });
});
