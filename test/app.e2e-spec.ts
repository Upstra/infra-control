import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get, Module } from '@nestjs/common';
import * as request from 'supertest';

@Controller()
class HelloController {
  @Get()
  hello() {
    return 'Hello World!';
  }
}

@Module({
  controllers: [HelloController],
})
class TestAppModule {}

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
