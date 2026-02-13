import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PokemonTcgModule } from '../pokemon-tcg/pokemon-tcg.module';

@Module({
  imports: [PokemonTcgModule],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
