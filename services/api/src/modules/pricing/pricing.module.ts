import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PriceTrackerService } from './price-tracker.service';

@Module({
  providers: [PricingService, PriceTrackerService],
  exports: [PricingService],
})
export class PricingModule {}
