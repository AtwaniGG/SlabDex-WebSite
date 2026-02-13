/**
 * Static Japanese Pokemon TCG set data.
 *
 * The Pokemon TCG API (pokemontcg.io) only covers English sets.
 * These are sourced from Bulbapedia and cover the JP-exclusive sets
 * that appear in Courtyard slab metadata.
 *
 * totalCards includes secret rares.
 */

export interface JpSetData {
  setName: string;
  totalCards: number;
  releaseYear: number;
  series: string;
}

export const JP_SETS: JpSetData[] = [
  // Scarlet & Violet era
  { setName: 'Shiny Treasure EX', totalCards: 360, releaseYear: 2023, series: 'Scarlet & Violet' },
  { setName: 'Ruler of the Black Flame', totalCards: 141, releaseYear: 2023, series: 'Scarlet & Violet' },
  { setName: 'The Town on No Map', totalCards: 92, releaseYear: 2002, series: 'e-Card' },

  // Sword & Shield era
  { setName: 'Vstar Universe', totalCards: 262, releaseYear: 2022, series: 'Sword & Shield' },

  // Trading Card Game Classic (3 decks)
  { setName: 'Trading Card Game Classic - CLF, CLL, CLK', totalCards: 101, releaseYear: 2023, series: 'Classic' },

  // Promos
  { setName: 'P Promo', totalCards: 47, releaseYear: 2023, series: 'Promo' },
  { setName: 'Promo Card Pack 25th Anniversary Edition', totalCards: 25, releaseYear: 2021, series: '25th Anniversary' },

  // Classic era
  { setName: 'Gym Booster 1: Leaders\' Stadium', totalCards: 96, releaseYear: 1998, series: 'Gym' },
  { setName: 'Neo', totalCards: 96, releaseYear: 1999, series: 'Neo' },

  // Special products
  { setName: 'Battle Academy', totalCards: 66, releaseYear: 2024, series: 'Scarlet & Violet' },
];

/**
 * Pokellector logo URLs for JP/specialty sets not in TCGdex EN.
 * Sourced from jp.pokellector.com/sets.
 * Key = set name (lowercase) as it appears in our DB.
 */
export const POKELLECTOR_LOGOS: Record<string, string> = {
  'vstar universe': 'https://den-media.pokellector.com/logos/VSTAR-Universe.logo.357.png',
  'shiny treasure ex': 'https://den-media.pokellector.com/logos/Shiny-Treasure-ex.logo.375.png',
  'eevee heroes': 'https://den-media.pokellector.com/logos/Eevee-Heroes.logo.322.png',
  'shiny star v': 'https://den-media.pokellector.com/logos/Shiny-Star-V.logo.301.png',
  'dark phantasma': 'https://den-media.pokellector.com/logos/Dark-Phantasma.logo.343.png',
  'ruler of the black flame': 'https://den-media.pokellector.com/logos/Ruler-of-the-Black-Flame.logo.368.png',
  'wild force': 'https://den-media.pokellector.com/logos/Wild-Force.logo.386.png',
  'tag bolt': 'https://den-media.pokellector.com/logos/Tag-Bolt.logo.260.png',
  'future flash': 'https://den-media.pokellector.com/logos/Future-Flash.logo.382.png',
  'the town on no map': 'https://den-media.pokellector.com/logos/The-Town-on-No-Map.logo.390.png',
  'shiny collection': 'https://den-media.pokellector.com/logos/Shiny-Collection.logo.32.png',
  'soulsilver collection': 'https://den-media.pokellector.com/logos/SoulSilver-Collection.logo.248.png',
  '25th anniversary collection': 'https://den-media.pokellector.com/logos/25th-Anniversary-Collection.logo.327.png',
  'gold, silver, to a new world': 'https://den-media.pokellector.com/logos/Gold-Silver-to-a-New-World.logo.324.png',
  'terastal fest ex': 'https://den-media.pokellector.com/logos/Terastal-Festival-ex.logo.406.png',
  'shining legends': 'https://den-media.pokellector.com/logos/Strengthening-Expansion-Pack-Shining-Legends.logo.224.png',
  'amazing volt tackle': 'https://den-media.pokellector.com/logos/Electrifying-Tackle.logo.297.png',
  'stellar miracle': 'https://den-media.pokellector.com/logos/Stella-Miracle.logo.401.png',
  'sky-splitting charisma': 'https://den-media.pokellector.com/logos/Charisma-of-the-Cracked-Sky.logo.242.png',
  'neo 3': 'https://den-media.pokellector.com/logos/Awakening-Legends.logo.332.png',
  'neo 4': 'https://den-media.pokellector.com/logos/Darkness-and-to-Light.logo.333.png',
  'neo': 'https://den-media.pokellector.com/logos/Gold-Silver-to-a-New-World.logo.324.png',
  'gym': 'https://den-media.pokellector.com/logos/Leaders-Stadium.logo.316.png',
  "gym booster 1: leaders' stadium": 'https://den-media.pokellector.com/logos/Leaders-Stadium.logo.316.png',
  'vs': 'https://den-media.pokellector.com/logos/Pokemon-VS.logo.276.png',
  'promo card pack 25th anniversary edition': 'https://den-media.pokellector.com/logos/25th-Anniversary-Promo-Pack.logo.328.png',
  'all stars collection': 'https://den-media.pokellector.com/logos/Tag-Team-GX-All-Stars.logo.288.png',
};
