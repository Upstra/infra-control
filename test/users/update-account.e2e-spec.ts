import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { UpdateAccountDto } from '@/modules/users/application/dto/update-account.dto';

describe('UserController - Update Account (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let testUserId: string;
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
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'admin_test_update',
        email: 'admin_update@test.com',
        password: 'AdminPass123!',
      });

    adminUserId = adminResponse.body.id;

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin_test_update',
        password: 'AdminPass123!',
      });

    adminToken = adminLoginResponse.body.access_token;

    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'user_test_update',
        email: 'user_update@test.com',
        password: 'UserPass123!',
        firstName: 'Test',
        lastName: 'User',
      });

    testUserId = userResponse.body.id;
    userToken = userResponse.body.access_token;
  });

  afterEach(async () => {
    if (testUserId) {
      await request(app.getHttpServer())
        .delete(`/user/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
    if (adminUserId) {
      await request(app.getHttpServer())
        .delete(`/user/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
  });

  describe('PATCH /user/:id/update-account', () => {
    it('should update user account with all fields as admin', async () => {
      const updateData: UpdateAccountDto = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated_email@test.com',
        isActive: false,
        isVerified: false,
      };

      const response = await request(app.getHttpServer())
        .patch(`/user/${testUserId}/update-account`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUserId);
      expect(response.body).toHaveProperty('firstName', 'Updated');
      expect(response.body).toHaveProperty('lastName', 'Name');
      expect(response.body).toHaveProperty('email', 'updated_email@test.com');
      expect(response.body).toHaveProperty('isActive', false);
      expect(response.body).toHaveProperty('isVerified', false);
    });

    it('should update user account with partial fields', async () => {
      const updateData: UpdateAccountDto = {
        firstName: 'PartialUpdate',
      };

      const response = await request(app.getHttpServer())
        .patch(`/user/${testUserId}/update-account`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUserId);
      expect(response.body).toHaveProperty('firstName', 'PartialUpdate');
      expect(response.body).toHaveProperty('lastName', 'User');
      expect(response.body).toHaveProperty('email', 'user_update@test.com');
    });

    it('should fail when not authenticated', async () => {
      const updateData: UpdateAccountDto = {
        firstName: 'Unauthorized',
      };

      await request(app.getHttpServer())
        .patch(`/user/${testUserId}/update-account`)
        .send(updateData)
        .expect(401);
    });

    it('should fail when not admin', async () => {
      const updateData: UpdateAccountDto = {
        firstName: 'Forbidden',
      };

      await request(app.getHttpServer())
        .patch(`/user/${testUserId}/update-account`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should fail with invalid email format', async () => {
      const updateData: UpdateAccountDto = {
        email: 'invalid-email',
      };

      await request(app.getHttpServer())
        .patch(`/user/${testUserId}/update-account`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should fail with invalid role', async () => {
      const updateData = {
        role: 'INVALID_ROLE',
      };

      await request(app.getHttpServer())
        .patch(`/user/${testUserId}/update-account`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should fail when user not found', async () => {
      const updateData: UpdateAccountDto = {
        firstName: 'NotFound',
      };

      await request(app.getHttpServer())
        .patch(`/user/123e4567-e89b-12d3-a456-426614174000/update-account`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);
    });

    it('should fail with invalid UUID', async () => {
      const updateData: UpdateAccountDto = {
        firstName: 'Invalid',
      };

      await request(app.getHttpServer())
        .patch(`/user/invalid-uuid/update-account`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should update email successfully', async () => {
      const updateData: UpdateAccountDto = {
        email: 'new_email@test.com',
      };

      const response = await request(app.getHttpServer())
        .patch(`/user/${testUserId}/update-account`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('email', 'new_email@test.com');
    });

    it('should update isActive status successfully', async () => {
      const updateData: UpdateAccountDto = {
        isActive: false,
      };

      const response = await request(app.getHttpServer())
        .patch(`/user/${testUserId}/update-account`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('isActive', false);
    });

    it('should handle empty update data', async () => {
      const updateData: UpdateAccountDto = {};

      const response = await request(app.getHttpServer())
        .patch(`/user/${testUserId}/update-account`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUserId);
    });
  });
});
