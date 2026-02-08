/**
 * Courtyard → canonical set name normalizer.
 *
 * Courtyard uses names like "Pokémon Sun & Moon Burning Shadows" whereas
 * TCGdex uses "Burning Shadows". This module strips era prefixes, code
 * patterns, and applies specific mappings so every slab gets a consistent
 * canonical set name.
 */

const ERA_PREFIXES = [
  'Pokémon Sword & Shield ',
  'Pokémon Sword and Shield ',
  'Pokémon Sun & Moon ',
  'Pokémon Black & White ',
  'Pokémon XY ',
  'Sword & Shield ',
  'Sun & Moon ',
  'Black & White ',
  'XY ',
];

// "Pokémon Ssp EN-Surging Sparks" → "Surging Sparks"
const CODE_PATTERN = /^Pokémon\s+\w+\s+EN[- ]+(.+)$/i;
// "Pokémon Sv4a-Shiny Treasure EX" → "Shiny Treasure EX"
const CODE_PATTERN_NO_EN = /^Pokémon\s+\w+-(.+)$/i;
// "Paldean Fates - PAF EN" → "Paldean Fates"
const SUFFIX_CODE_PATTERN = /^(.+?)\s*[-–]\s*(?:\w{2,4}\s+)?EN$/i;
// "Scarlet & Violet 151 - MEW EN" → "151"
const SV151_PATTERN = /Scarlet & Violet 151/i;

const PROMO_MAPPINGS: Record<string, string> = {
  'black star promos - sword & shield': 'SWSH Black Star Promos',
  'black star promos - sun & moon': 'SM Black Star Promos',
  'black star promos - scarlet & violet svp en': 'SVP Black Star Promos',
  'pokémon swsh black star promo': 'SWSH Black Star Promos',
  'pokémon sm black star promo': 'SM Black Star Promos',
  'pokémon xy black star promos': 'XY Black Star Promos',
  'sun & moon promos': 'SM Black Star Promos',
  'sword & shield promos': 'SWSH Black Star Promos',
  'black star promo': 'Wizards Black Star Promos',
  'black star promos': 'Wizards Black Star Promos',
};

const JP_MAPPINGS: Record<string, string> = {
  'pokémon sv2a-pokemon 151': '151',
  'pokémon card 151': '151',
  'pokémon mew en-151': '151',
};

const SPECIFIC_MAPPINGS: Record<string, string> = {
  'pokémon celebrations classic collection': 'Celebrations',
  'pokémon gym challenge': 'Gym Challenge',
  'pokémon gym heroes': 'Gym Heroes',
  'pokémon neo genesis': 'Neo Genesis',
  'pokémon neo destiny': 'Neo Destiny',
  'pokémon expedition': 'Expedition Base Set',
  'pokémon promo southern islands': 'Southern Islands',
  'pokémon rocket': 'Team Rocket',
  'platinum - supreme victors': 'Supreme Victors',
  'pokémon aquapolis': 'Aquapolis',
  'pokémon ex crystal guardians': 'Crystal Guardians',
  'ex team magma vs team aqua': 'Team Magma vs Team Aqua',
};

export function buildSetNameNormalizer(refNames: string[]) {
  const refLower = new Map<string, string>();
  for (const name of refNames) {
    refLower.set(name.toLowerCase(), name);
  }

  return function normalizeSetName(courtyardName: string | null): string | null {
    if (!courtyardName) return courtyardName;

    // 1. Exact match
    if (refLower.has(courtyardName.toLowerCase())) {
      return refLower.get(courtyardName.toLowerCase())!;
    }

    // 2. Strip "Pokémon " prefix
    let stripped = courtyardName;
    if (/^Pokémon\s+/i.test(stripped)) {
      stripped = stripped.replace(/^Pokémon\s+/i, '');
      if (refLower.has(stripped.toLowerCase())) {
        return refLower.get(stripped.toLowerCase())!;
      }
    }

    // 3. Strip "EX " prefix
    if (/^EX\s+/i.test(courtyardName)) {
      stripped = courtyardName.replace(/^EX\s+/i, '');
      if (refLower.has(stripped.toLowerCase())) {
        return refLower.get(stripped.toLowerCase())!;
      }
      const noParens = stripped.replace(/\s*\(.*\)\s*$/, '');
      if (refLower.has(noParens.toLowerCase())) {
        return refLower.get(noParens.toLowerCase())!;
      }
    }

    // 4. Code-based: "Pokémon Ssp EN-Surging Sparks" → "Surging Sparks"
    const codeMatch = courtyardName.match(CODE_PATTERN);
    if (codeMatch) {
      const extracted = codeMatch[1].trim();
      if (refLower.has(extracted.toLowerCase())) {
        return refLower.get(extracted.toLowerCase())!;
      }
      const stripped2 = extracted.replace(/^Pokemon\s+/i, '');
      if (refLower.has(stripped2.toLowerCase())) {
        return refLower.get(stripped2.toLowerCase())!;
      }
    }

    // 4b. Broader code: "Pokémon Sv4a-Shiny Treasure EX" → "Shiny Treasure EX"
    const codeMatchNoEn = courtyardName.match(CODE_PATTERN_NO_EN);
    if (codeMatchNoEn) {
      const extracted = codeMatchNoEn[1].trim();
      if (refLower.has(extracted.toLowerCase())) {
        return refLower.get(extracted.toLowerCase())!;
      }
    }

    // 5. Suffix code: "Paldean Fates - PAF EN" → "Paldean Fates"
    const suffixMatch = courtyardName.match(SUFFIX_CODE_PATTERN);
    if (suffixMatch) {
      const extracted = suffixMatch[1].trim();
      if (refLower.has(extracted.toLowerCase())) {
        return refLower.get(extracted.toLowerCase())!;
      }
    }

    // 6. SV 151 special case
    if (SV151_PATTERN.test(courtyardName)) {
      if (refLower.has('151')) return refLower.get('151')!;
    }

    // 7. Era prefix extraction
    for (const prefix of ERA_PREFIXES) {
      if (courtyardName.startsWith(prefix)) {
        const sub = courtyardName.slice(prefix.length).trim();
        if (sub && refLower.has(sub.toLowerCase())) {
          return refLower.get(sub.toLowerCase())!;
        }
      }
    }

    // 8. "Pokémon " + era extraction
    if (/^Pokémon\s+/i.test(courtyardName)) {
      const withoutPoke = courtyardName.replace(/^Pokémon\s+/i, '');
      for (const prefix of ERA_PREFIXES) {
        const cleanPrefix = prefix.replace(/^Pokémon\s+/i, '');
        if (withoutPoke.startsWith(cleanPrefix)) {
          const sub = withoutPoke.slice(cleanPrefix.length).trim();
          if (sub && refLower.has(sub.toLowerCase())) {
            return refLower.get(sub.toLowerCase())!;
          }
        }
      }
    }

    // 9. Promo mappings
    const lc = courtyardName.toLowerCase();
    if (PROMO_MAPPINGS[lc]) {
      const target = PROMO_MAPPINGS[lc];
      return refLower.has(target.toLowerCase()) ? refLower.get(target.toLowerCase())! : target;
    }

    // 10. JP mappings
    if (JP_MAPPINGS[lc]) {
      const target = JP_MAPPINGS[lc];
      return refLower.has(target.toLowerCase()) ? refLower.get(target.toLowerCase())! : target;
    }

    // 11. Specific mappings
    if (SPECIFIC_MAPPINGS[lc]) {
      const target = SPECIFIC_MAPPINGS[lc];
      return refLower.has(target.toLowerCase()) ? refLower.get(target.toLowerCase())! : target;
    }

    // 12. Dedup: strip prefixes to canonical short form even without SetReference match
    if (codeMatch) return codeMatch[1].trim();
    if (codeMatchNoEn) return codeMatchNoEn[1].trim();

    for (const prefix of ERA_PREFIXES) {
      if (courtyardName.startsWith(prefix)) {
        const sub = courtyardName.slice(prefix.length).trim();
        if (sub) return sub;
      }
    }

    if (/^Pokémon\s+/i.test(courtyardName)) {
      const withoutPoke = courtyardName.replace(/^Pokémon\s+/i, '');
      for (const prefix of ERA_PREFIXES) {
        const cleanPrefix = prefix.replace(/^Pokémon\s+/i, '');
        if (withoutPoke.startsWith(cleanPrefix)) {
          const sub = withoutPoke.slice(cleanPrefix.length).trim();
          if (sub) return sub;
        }
      }
      return withoutPoke;
    }

    if (/^EX\s+/i.test(courtyardName)) {
      return courtyardName.replace(/^EX\s+/i, '').replace(/\s*\(.*\)\s*$/, '');
    }

    return courtyardName;
  };
}
