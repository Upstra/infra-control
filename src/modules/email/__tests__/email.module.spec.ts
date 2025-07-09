import { Test } from '@nestjs/testing';
import { EmailModule } from '../email.module';
import { EmailEventListener } from '../infrastructure/listeners/email-event.listener';

describe('EmailModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [EmailModule],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should provide EmailEventListener', async () => {
    const module = await Test.createTestingModule({
      imports: [EmailModule],
    }).compile();

    const listener = module.get(EmailEventListener);
    expect(listener).toBeDefined();
    expect(listener).toBeInstanceOf(EmailEventListener);
  });
});
