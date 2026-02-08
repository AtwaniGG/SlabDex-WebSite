import { Module } from '@nestjs/common';
import { SetsService } from './sets.service';
import { CatalogSeedService } from './catalog-seed.service';
import { PokemonTcgModule } from '../pokemon-tcg/pokemon-tcg.module';

@Module({
  imports: [PokemonTcgModule],
  providers: [SetsService, CatalogSeedService],
  exports: [SetsService],
})
export class SetsModule {}
