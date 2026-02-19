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
 * Total card counts for JP/specialty sets not covered by TCGdex EN catalog.
 * Sourced from TCGdex JP API (/v2/ja/sets) and Bulbapedia.
 * Key = set name (lowercase) as it appears in our DB.
 * Includes secret rares (total, not just official).
 */
export const SET_TOTAL_CARDS: Record<string, number> = {
  // --- Scarlet & Violet era (from TCGdex JP) ---
  'terastal fest ex': 237,
  'stellar miracle': 135,
  'paradise dragona': 94,
  'paradise dragona - sv7a': 94,
  'transformation mask': 101,
  'wild force': 71,
  'future flash': 95,
  'crimson haze': 96,
  'clay burst': 99,
  'scarlet ex': 108,
  'shiny treasure ex': 360,
  'ruler of the black flame': 141,
  'black star promos - scarlet & violet svpen': 50,
  'svp black star promos': 50,
  'scarlet & violet black star promos': 50,

  // --- Sword & Shield era ---
  'shiny star v': 190,
  'eevee heroes': 69,
  'amazing volt tackle': 100,
  'dark phantasma': 71,
  'vstar universe': 254,
  '25th anniversary collection': 28,
  'shiny collection': 20,

  // --- Sun & Moon era ---
  'tag bolt': 95,
  'sky-splitting charisma': 96,
  'all stars collection': 173,

  // --- Classic / Neo era ---
  'base expansion pack': 102,
  'rocket gang': 65,
  'gym': 96,
  "gym booster 1: leaders' stadium": 96,
  'gym 2: challenge from the darkness': 98,
  'vs': 143,
  'neo': 96,
  'gold, silver, to a new world': 96,
  'neo 3': 57,
  'awakening legends': 57,
  'neo 4': 113,
  'darkness, and to light': 113,
  'golden sky, silvery ocean': 106,
  'rulers of the heavens': 54,
  'offense & defense of the furthest ends': 68,
  'wind from the sea': 90,
  'the town on no map': 92,

  // --- XY / BW / DP / HGSS era ---
  'soulsilver collection': 70,

  // --- Special products / decks ---
  'trading card game classic - clf, cll, clk': 101,
  'trading card game classic - clv, clc, clb': 101,
  'trading card game classic charizard & ho-oh ex deck': 60,
  'battle academy': 66,
  'venusaur & charizard & blastoise special deck set ex': 12,
  'venusaur & lugia ex deck': 12,
  'promo card pack 25th anniversary edition': 25,
  'p promo': 47,
  'vending series 3 (pokeball symbol. glossy)': 118,

  // --- Obscure / specialty products ---
  'neo premium file': 9,
  'neo premium file 2': 9,
  'neo premium file 3': 9,
  'neo 3 promo': 4,
  'advanced generation (pink border)': 55,
  'red/green gift set': 60,
  'old maid': 54,
  'base set (2004)(non bold romanji back)': 102,
  'base set (2005)(bold romanji back)': 102,
};

/**
 * Pokellector logo URLs for JP/specialty sets not in TCGdex EN.
 * Sourced from jp.pokellector.com/sets.
 * Key = set name (lowercase) as it appears in our DB.
 */
export const POKELLECTOR_LOGOS: Record<string, string> = {
  // --- Scarlet & Violet era ---
  'vstar universe': 'https://den-media.pokellector.com/logos/VSTAR-Universe.logo.357.png',
  'shiny treasure ex': 'https://den-media.pokellector.com/logos/Shiny-Treasure-ex.logo.375.png',
  'ruler of the black flame': 'https://den-media.pokellector.com/logos/Ruler-of-the-Black-Flame.logo.368.png',
  'wild force': 'https://den-media.pokellector.com/logos/Wild-Force.logo.386.png',
  'future flash': 'https://den-media.pokellector.com/logos/Future-Flash.logo.382.png',
  'the town on no map': 'https://den-media.pokellector.com/logos/The-Town-on-No-Map.logo.390.png',
  'terastal fest ex': 'https://den-media.pokellector.com/logos/Terastal-Festival-ex.logo.406.png',
  'stellar miracle': 'https://den-media.pokellector.com/logos/Stella-Miracle.logo.401.png',
  'clay burst': 'https://den-media.pokellector.com/logos/Clay-Burst.logo.370.png',
  'scarlet ex': 'https://den-media.pokellector.com/logos/Scarlet-ex.logo.361.png',
  'paradise dragona': 'https://den-media.pokellector.com/logos/Paradise-Dragona.logo.403.png',
  'paradise dragona - sv7a': 'https://den-media.pokellector.com/logos/Paradise-Dragona.logo.403.png',
  'transformation mask': 'https://den-media.pokellector.com/logos/Mask-of-Change.logo.393.png',
  'scarlet & violet black star promos': 'https://den-media.pokellector.com/logos/Scarlet-Violet-Promos.logo.364.png',
  'black star promos - scarlet & violet svpen': 'https://den-media.pokellector.com/logos/Scarlet-Violet-Promos.logo.364.png',
  'svp black star promos': 'https://den-media.pokellector.com/logos/Scarlet-Violet-Promos.logo.364.png',
  'p promo': 'https://den-media.pokellector.com/logos/Scarlet-Violet-Promos.logo.360.png',
  'crimson haze': 'https://den-media.pokellector.com/logos/Crimson-Haze.logo.391.png',

  // --- Sword & Shield era ---
  'eevee heroes': 'https://den-media.pokellector.com/logos/Eevee-Heroes.logo.322.png',
  'shiny star v': 'https://den-media.pokellector.com/logos/Shiny-Star-V.logo.301.png',
  'dark phantasma': 'https://den-media.pokellector.com/logos/Dark-Phantasma.logo.343.png',
  'amazing volt tackle': 'https://den-media.pokellector.com/logos/Electrifying-Tackle.logo.297.png',
  '25th anniversary collection': 'https://den-media.pokellector.com/logos/25th-Anniversary-Collection.logo.327.png',
  'promo card pack 25th anniversary edition': 'https://den-media.pokellector.com/logos/25th-Anniversary-Promo-Pack.logo.328.png',
  'shiny collection': 'https://den-media.pokellector.com/logos/Shiny-Collection.logo.32.png',

  // --- Sun & Moon era ---
  'tag bolt': 'https://den-media.pokellector.com/logos/Tag-Bolt.logo.260.png',
  'sky-splitting charisma': 'https://den-media.pokellector.com/logos/Charisma-of-the-Cracked-Sky.logo.242.png',
  'all stars collection': 'https://den-media.pokellector.com/logos/Tag-Team-GX-All-Stars.logo.288.png',
  'shining legends': 'https://den-media.pokellector.com/logos/Strengthening-Expansion-Pack-Shining-Legends.logo.224.png',

  // --- XY / BW era ---
  'soulsilver collection': 'https://den-media.pokellector.com/logos/SoulSilver-Collection.logo.248.png',

  // --- Classic / Neo era ---
  'gold, silver, to a new world': 'https://den-media.pokellector.com/logos/Gold-Silver-to-a-New-World.logo.324.png',
  'neo': 'https://den-media.pokellector.com/logos/Gold-Silver-to-a-New-World.logo.324.png',
  'neo 3': 'https://den-media.pokellector.com/logos/Awakening-Legends.logo.332.png',
  'awakening legends': 'https://den-media.pokellector.com/logos/Awakening-Legends.logo.332.png',
  'neo 4': 'https://den-media.pokellector.com/logos/Darkness-and-to-Light.logo.333.png',
  'darkness, and to light': 'https://den-media.pokellector.com/logos/Darkness-and-to-Light.logo.333.png',
  'gym': 'https://den-media.pokellector.com/logos/Leaders-Stadium.logo.316.png',
  "gym booster 1: leaders' stadium": 'https://den-media.pokellector.com/logos/Leaders-Stadium.logo.316.png',
  'gym 2: challenge from the darkness': 'https://den-media.pokellector.com/logos/Challenge-from-the-Darkness.logo.317.png',
  'rocket gang': 'https://den-media.pokellector.com/logos/Rocket-Gang.logo.315.png',
  'vs': 'https://den-media.pokellector.com/logos/Pokemon-VS.logo.276.png',
  'base expansion pack': 'https://den-media.pokellector.com/logos/Expansion-Pack.logo.311.png',
  'vending series 3 (pokeball symbol. glossy)': 'https://den-media.pokellector.com/logos/Vending-Series-3-Green.logo.397.png',

  // --- Classic / Neo / ADV / PCG era (EN equivalent logos) ---
  'wind from the sea': 'https://den-media.pokellector.com/logos/Aquapolis.logo.110.png',
  'rulers of the heavens': 'https://den-media.pokellector.com/logos/EX-Dragon.logo.54.png',
  'golden sky, silvery ocean': 'https://den-media.pokellector.com/logos/EX-Unseen-Forces.logo.61.png',
  'offense & defense of the furthest ends': 'https://den-media.pokellector.com/logos/EX-Dragon-Frontiers.logo.66.png',
  'neo premium file': 'https://den-media.pokellector.com/logos/Neo.logo.323.png',
  'neo premium file 2': 'https://den-media.pokellector.com/logos/Neo.logo.323.png',
  'neo premium file 3': 'https://den-media.pokellector.com/logos/Neo.logo.323.png',
  'neo 3 promo': 'https://den-media.pokellector.com/logos/Awakening-Legends.logo.332.png',
  'promo': 'https://den-media.pokellector.com/logos/Scarlet-Violet-Promos.logo.364.png',
  'advanced generation (pink border)': 'https://den-media.pokellector.com/logos/Ruby-Sapphire.logo.49.png',

  // --- EN sub-sets / special sets (use parent logo) ---
  'hidden fates shiny vault': 'https://den-media.pokellector.com/logos/Hidden-Fates.logo.279.png',
  'shining fates shiny vault': 'https://den-media.pokellector.com/logos/Shining-Fates.logo.304.png',
  'brilliant stars trainer gallery': 'https://den-media.pokellector.com/logos/Brilliant-Stars.logo.340.png',
  'astral radiance trainer gallery': 'https://den-media.pokellector.com/logos/Astral-Radiance.logo.345.png',
  'lost origin trainer gallery': 'https://den-media.pokellector.com/logos/Lost-Origin.logo.350.png',
  'silver tempest trainer gallery': 'https://den-media.pokellector.com/logos/Silver-Tempest.logo.354.png',
  'crown zenith galarian gallery': 'https://den-media.pokellector.com/logos/Crown-Zenith.logo.358.png',
  'celebrations: classic collection': 'https://den-media.pokellector.com/logos/Celebrations.logo.329.png',
  'radiant collection': 'https://den-media.pokellector.com/logos/Radiant-Collection.logo.148.png',
  'dragon majesty': 'https://den-media.pokellector.com/logos/Dragon-Majesty.logo.257.png',
  'temporal forces': 'https://den-media.pokellector.com/logos/Temporal-Forces.logo.383.png',

  // --- McDonald's collections ---
  "mcdonald's collection 2021": 'https://den-media.pokellector.com/logos/McDonalds-25th-Anniversary.logo.300.png',
  "mcdonald's collection 2019": 'https://den-media.pokellector.com/logos/McDonalds-Collection-2019.logo.290.png',
  "mcdonald's collection 2018": 'https://den-media.pokellector.com/logos/McDonalds-Collection-2018.logo.265.png',
  "mcdonald's collection 2017": 'https://den-media.pokellector.com/logos/McDonalds-Collection-2017.logo.230.png',
  "mcdonald's collection 2016": 'https://den-media.pokellector.com/logos/McDonalds-Collection-2016.logo.207.png',
  "mcdonald's collection 2015": 'https://den-media.pokellector.com/logos/McDonalds-Collection-2015.logo.182.png',
  "mcdonald's collection 2014": 'https://den-media.pokellector.com/logos/McDonalds-Collection-2014.logo.158.png',
  "mcdonald's collection 2022": 'https://den-media.pokellector.com/logos/McDonalds-Collection-2019.logo.290.png',
  "mcdonald's collection 2012": 'https://den-media.pokellector.com/logos/McDonalds-Collection-2014.logo.158.png',
  "mcdonald's collection 2011": 'https://den-media.pokellector.com/logos/McDonalds-Collection-2014.logo.158.png',
  // Macdonald's (alternate spelling in DB)
  "macdonald's collection 2021": 'https://den-media.pokellector.com/logos/McDonalds-25th-Anniversary.logo.300.png',
  "macdonald's collection 2019": 'https://den-media.pokellector.com/logos/McDonalds-Collection-2019.logo.290.png',
  "macdonald's collection 2018": 'https://den-media.pokellector.com/logos/McDonalds-Collection-2018.logo.265.png',
  "macdonald's collection 2017": 'https://den-media.pokellector.com/logos/McDonalds-Collection-2017.logo.230.png',
  "macdonald's collection 2016": 'https://den-media.pokellector.com/logos/McDonalds-Collection-2016.logo.207.png',
  "macdonald's collection 2015": 'https://den-media.pokellector.com/logos/McDonalds-Collection-2015.logo.182.png',
  "macdonald's collection 2014": 'https://den-media.pokellector.com/logos/McDonalds-Collection-2014.logo.158.png',
  "macdonald's collection 2012": 'https://den-media.pokellector.com/logos/McDonalds-Collection-2014.logo.158.png',
  "macdonald's collection 2011": 'https://den-media.pokellector.com/logos/McDonalds-Collection-2014.logo.158.png',
};
