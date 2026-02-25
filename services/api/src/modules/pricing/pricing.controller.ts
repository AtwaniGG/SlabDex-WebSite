import { Controller, Get, Param, Query } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Controller('slabs')
export class PricingController {
  constructor(private pricingService: PricingService) {}

  @Get(':slabId/price')
  async getSlabPrice(
    @Param('slabId') slabId: string,
    @Query('tier') tier?: string,
  ) {
    const t: 'free' | 'premium' =
      tier === 'premium' ? 'premium' : 'free';

    const result = await this.pricingService.getSlabPrice(slabId, t);

    return {
      priceUsd: result.priceUsd,
      updatedAt: result.updatedAt,
    };
  }
}
