import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { SlabsModule } from '../slabs/slabs.module';
import { SetsModule } from '../sets/sets.module';
import { IndexingModule } from '../indexing/indexing.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [SlabsModule, SetsModule, IndexingModule, PricingModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
