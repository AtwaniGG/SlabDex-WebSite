import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PokemonTcgModule } from '../pokemon-tcg/pokemon-tcg.module';
import { JustTcgService } from './justtcg.service';

@Module({
  imports: [PokemonTcgModule],
  providers: [PricingService, JustTcgService],
  exports: [PricingService],
})
export class PricingModule {}
