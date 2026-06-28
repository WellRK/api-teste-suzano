import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { jwtFactory } from '../../shared/factories/jwt-factory';
import { S3Repository } from '../../shared/repositories/s3.repository';
import { JwtStrategyClient } from '../../shared/strategies/jwt-strategy-client';
import { DatabaseModule } from '../_database/database.module';
import { AuthenticationController } from './controllers/authentication.controller';
import { UserController } from './controllers/user.controller';
import { UserClientRepository } from './repositories/user-client.repository';
import { AuthenticationService } from './services/authentication.service';
import { UserService } from './services/user.service';
import { CepRepository } from '../../shared/repositories/cep-repository';
import { SendgridRepository } from '../../shared/repositories/sendgrid.repository';
import { SendGridModule } from '@ntegral/nestjs-sendgrid';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EnviromentVariablesEnum } from '../../shared/enums/enviroment.variables.enum';
import { ProfileClientRepository } from './repositories/profile.repository';

@Module({
  imports: [
    HttpModule,

    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync(jwtFactory),

    SendGridModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        apiKey: configService.get(EnviromentVariablesEnum.SENDGRID_API_KEY),
      }),
      inject: [ConfigService],
    }),

    DatabaseModule,
  ],
  controllers: [AuthenticationController, UserController],
  providers: [
    JwtStrategyClient,
    UserClientRepository,
    ProfileClientRepository,

    S3Repository,

    AuthenticationService,
    UserService,
    CepRepository,
    SendgridRepository,
  ],
  exports: [UserClientRepository, ProfileClientRepository],
})
export class ClientModule {}
