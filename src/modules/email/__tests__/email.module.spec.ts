import { EmailModule } from '../email.module';
import { EmailApplicationModule } from '../application/email-application.module';
import { EmailInfrastructureModule } from '../infrastructure/email-infrastructure.module';
import { EmailEventListener } from '../infrastructure/listeners/email-event.listener';

/**
 * Compiling EmailModule pulls the whole application graph (users → roles →
 * servers → TypeORM…), which needs a real database. These checks read the
 * module metadata instead: what it wires and what it exposes.
 */
describe('EmailModule', () => {
  const metadata = (key: string) => Reflect.getMetadata(key, EmailModule);

  it('imports the email infrastructure and application layers', () => {
    expect(metadata('imports')).toEqual(
      expect.arrayContaining([EmailInfrastructureModule, EmailApplicationModule]),
    );
  });

  it('registers the email event listener', () => {
    expect(metadata('providers')).toContain(EmailEventListener);
  });

  it('exposes the application module to its importers', () => {
    expect(metadata('exports')).toContain(EmailApplicationModule);
  });
});
