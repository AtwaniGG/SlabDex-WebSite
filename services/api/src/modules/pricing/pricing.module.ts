import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PokemonTcgModule } from '../pokemon-tcg/pokemon-tcg.module';
import { JustTcgService } from './justtcg.service';
import { PriceTrackerService } from './price-tracker.service';

@Module({
  imports: [PokemonTcgModule],
  providers: [PricingService, JustTcgService, PriceTrackerService],
  exports: [PricingService],
})
export class PricingModule {}
