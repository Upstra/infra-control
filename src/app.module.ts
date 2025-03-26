import { configModule } from './config/config.module';
import { Logger, Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupesModule } from './modules/groupes/groupes.module';
import { IlosModule } from './modules/ilos/ilos.module';
import { OnduleursModule } from './modules/onduleurs/onduleurs.module';
import { RolesModule } from './modules/roles/roles.module';
import { SallesModule } from './modules/salles/salles.module';
import { ServersModule } from './modules/servers/servers.module';
import { UsersModule } from './modules/users/users.module';
import { VmsModule } from './modules/vms/vms.module';
import { typeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    configModule,
    TypeOrmModule.forRoot(typeOrmConfig),
    GroupesModule,
    IlosModule,
    OnduleursModule,
    RolesModule,
    SallesModule,
    ServersModule,
    UsersModule,
    VmsModule,
  ],
  controllers: [],
  providers: [Logger],
})
export class AppModule {}
