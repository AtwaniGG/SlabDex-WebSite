import { Module } from '@nestjs/common';
import { SlabsService } from './slabs.service';

@Module({
  providers: [SlabsService],
  exports: [SlabsService],
})
export class SlabsModule {}
