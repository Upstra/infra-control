import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { BulkActivateDto } from '@/modules/users/application/dto/bulk-activate.dto';

describe('UserController - Bulk Activate (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let testUserIds: string[] = [];
  let adminUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Create admin user and get token
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'admin_test_bulk',
        email: 'admin_bulk@test.com',
        password: 'AdminPass123!',
      });

    adminUserId = adminResponse.body.id;

    // Admin user is already created, no need to update role

    // Login as admin
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin_test_bulk',
        password: 'AdminPass123!',
      });

    adminToken = adminLoginResponse.body.access_token;

    // Create multiple test users
    for (let i = 0; i < 3; i++) {
      const userResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: `user_test_bulk_${i}`,
          email: `user_bulk_${i}@test.com`,
          password: 'UserPass123!',
        });

      testUserIds.push(userResponse.body.id);

      // Deactivate users to test activation
      await request(app.getHttpServer())
        .patch(`/user/${userResponse.body.id}/update-account`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });
    }

    // Get regular user token
    const userLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'user_test_bulk_0',
        password: 'UserPass123!',
      });

    userToken = userLoginResponse.body.access_token;
  });

  afterEach(async () => {
    // Clean up users
    for (const userId of testUserIds) {
      await request(app.getHttpServer())
        .delete(`/user/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
    testUserIds = [];

    if (adminUserId) {
      await request(app.getHttpServer())
        .delete(`/user/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
  });

  describe('PATCH /user/bulk-activate', () => {
    it('should bulk activate multiple users as admin', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: testUserIds,
      };

      const response = await request(app.getHttpServer())
        .patch('/user/bulk-activate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkActivateDto)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(3);

      response.body.forEach((user: any) => {
        expect(user).toHaveProperty('isActive', true);
        expect(testUserIds).toContain(user.id);
      });
    });

    it('should activate single user', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: [testUserIds[0]],
      };

      const response = await request(app.getHttpServer())
        .patch('/user/bulk-activate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkActivateDto)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('id', testUserIds[0]);
      expect(response.body[0]).toHaveProperty('isActive', true);
    });

    it('should handle mixed valid and invalid user IDs', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: [
          testUserIds[0],
          '123e4567-e89b-12d3-a456-426614174000', // Non-existent
          testUserIds[1],
        ],
      };

      const response = await request(app.getHttpServer())
        .patch('/user/bulk-activate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkActivateDto)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(2);
      expect(response.body.map((u: any) => u.id)).toContain(testUserIds[0]);
      expect(response.body.map((u: any) => u.id)).toContain(testUserIds[1]);
    });

    it('should fail when not authenticated', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: testUserIds,
      };

      await request(app.getHttpServer())
        .patch('/user/bulk-activate')
        .send(bulkActivateDto)
        .expect(401);
    });

    it('should fail when not admin', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: testUserIds,
      };

      await request(app.getHttpServer())
        .patch('/user/bulk-activate')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bulkActivateDto)
        .expect(403);
    });

    it('should fail with empty user IDs array', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: [],
      };

      await request(app.getHttpServer())
        .patch('/user/bulk-activate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkActivateDto)
        .expect(400);
    });

    it('should fail with invalid UUID format', async () => {
      const bulkActivateDto = {
        userIds: ['invalid-uuid', 'another-invalid'],
      };

      await request(app.getHttpServer())
        .patch('/user/bulk-activate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkActivateDto)
        .expect(400);
    });

    it('should fail with non-array userIds', async () => {
      const bulkActivateDto = {
        userIds: 'not-an-array',
      };

      await request(app.getHttpServer())
        .patch('/user/bulk-activate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkActivateDto)
        .expect(400);
    });

    it('should fail when all user IDs are invalid', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: [
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174001',
        ],
      };

      await request(app.getHttpServer())
        .patch('/user/bulk-activate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkActivateDto)
        .expect(404);
    });

    it('should handle already active users', async () => {
      // First activate a user
      await request(app.getHttpServer())
        .patch(`/user/${testUserIds[0]}/update-account`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true });

      const bulkActivateDto: BulkActivateDto = {
        userIds: [testUserIds[0], testUserIds[1]],
      };

      const response = await request(app.getHttpServer())
        .patch('/user/bulk-activate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkActivateDto)
        .expect(200);

      expect(response.body).toHaveLength(2);
      response.body.forEach((user: any) => {
        expect(user).toHaveProperty('isActive', true);
      });
    });

    it('should handle large number of user IDs', async () => {
      // Create more users
      const additionalUserIds: string[] = [];
      for (let i = 3; i < 10; i++) {
        const userResponse = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            username: `user_test_bulk_${i}`,
            email: `user_bulk_${i}@test.com`,
            password: 'UserPass123!',
          });

        additionalUserIds.push(userResponse.body.id);
        testUserIds.push(userResponse.body.id); // Add for cleanup

        // Deactivate user
        await request(app.getHttpServer())
          .patch(`/user/${userResponse.body.id}/update-account`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ isActive: false });
      }

      const bulkActivateDto: BulkActivateDto = {
        userIds: [...testUserIds],
      };

      const response = await request(app.getHttpServer())
        .patch('/user/bulk-activate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkActivateDto)
        .expect(200);

      expect(response.body).toHaveLength(10);
      response.body.forEach((user: any) => {
        expect(user).toHaveProperty('isActive', true);
      });
    });
  });
});
