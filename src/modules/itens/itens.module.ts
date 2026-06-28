import { CacheModule, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtFactory } from '../../shared/factories/jwt-factory';
import { JwtStrategyClient } from '../../shared/strategies/jwt-strategy-client';
import { DatabaseModule } from '../_database/database.module';
import { ItemController } from './controllers/item.controller';
import { ItemRepository } from './repositories/item.repository';
import { ItemService } from './services/item.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync(jwtFactory),
    DatabaseModule,
    // Cache em memória com TTL curto como rede de segurança; a invalidação
    // primária é explícita (del da chave) ao criar um item.
    CacheModule.register({ ttl: 60 }),
  ],
  controllers: [ItemController],
  providers: [JwtStrategyClient, ItemRepository, ItemService],
  exports: [ItemRepository],
})
export class ItensModule {}
