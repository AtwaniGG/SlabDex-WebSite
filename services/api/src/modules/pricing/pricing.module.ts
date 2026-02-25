import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { TcgdexAdapter } from './tcgdex.adapter';
import { EbayService } from './ebay.service';
import { RedisProvider } from './redis.provider';
import { PokemonTcgModule } from '../pokemon-tcg/pokemon-tcg.module';

@Module({
  imports: [PokemonTcgModule],
  controllers: [PricingController],
  providers: [PricingService, TcgdexAdapter, EbayService, RedisProvider],
  exports: [PricingService],
})
export class PricingModule {}
