import { Module } from '@nestjs/common';
import { PokemonTcgService } from './pokemon-tcg.service';
import { PokemonApiService } from './pokemon-api.service';

@Module({
  providers: [PokemonTcgService, PokemonApiService],
  exports: [PokemonTcgService, PokemonApiService],
})
export class PokemonTcgModule {}
