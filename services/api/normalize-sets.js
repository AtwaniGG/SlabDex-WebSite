const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Era prefixes — Courtyard often uses "Pokémon Sun & Moon Burning Shadows"
// but TCGdex uses just "Burning Shadows"
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

// Code-based set patterns: "Pokémon Ssp EN-Surging Sparks" → "Surging Sparks"
const CODE_PATTERN = /^Pokémon\s+\w+\s+EN[- ]+(.+)$/i;
// Broader code pattern without EN: "Pokémon Sv4a-Shiny Treasure EX" → "Shiny Treasure EX"
const CODE_PATTERN_NO_EN = /^Pokémon\s+\w+-(.+)$/i;
// Also: "Paldean Fates - PAF EN" → "Paldean Fates"
const SUFFIX_CODE_PATTERN = /^(.+?)\s*[-–]\s*(?:\w{2,4}\s+)?EN$/i;
// "Scarlet & Violet 151 - MEW EN" → "151"
const SV151_PATTERN = /Scarlet & Violet 151/i;

function buildNormalizer(refNames) {
  // Build a lookup map: lowercase canonical name → original canonical name
  const refLower = new Map();
  for (const name of refNames) {
    refLower.set(name.toLowerCase(), name);
  }

  return function normalize(courtyardName) {
    if (!courtyardName) return courtyardName;

    // 1. Exact match
    if (refLower.has(courtyardName.toLowerCase())) {
      return refLower.get(courtyardName.toLowerCase());
    }

    // 2. Strip "Pokémon " prefix
    let stripped = courtyardName;
    if (/^Pokémon\s+/i.test(stripped)) {
      stripped = stripped.replace(/^Pokémon\s+/i, '');
      if (refLower.has(stripped.toLowerCase())) {
        return refLower.get(stripped.toLowerCase());
      }
    }

    // 3. Strip "EX " prefix
    if (/^EX\s+/i.test(courtyardName)) {
      stripped = courtyardName.replace(/^EX\s+/i, '');
      if (refLower.has(stripped.toLowerCase())) {
        return refLower.get(stripped.toLowerCase());
      }
      // Also try removing parenthetical suffixes: "EX Ruby & Sapphire (2003...)" → "Ruby & Sapphire"
      const noParens = stripped.replace(/\s*\(.*\)\s*$/, '');
      if (refLower.has(noParens.toLowerCase())) {
        return refLower.get(noParens.toLowerCase());
      }
    }

    // 4. Code-based names: "Pokémon Ssp EN-Surging Sparks" → "Surging Sparks"
    const codeMatch = courtyardName.match(CODE_PATTERN);
    if (codeMatch) {
      const extracted = codeMatch[1].trim();
      if (refLower.has(extracted.toLowerCase())) {
        return refLower.get(extracted.toLowerCase());
      }
      // Try stripping "Pokemon " from extracted too
      const stripped2 = extracted.replace(/^Pokemon\s+/i, '');
      if (refLower.has(stripped2.toLowerCase())) {
        return refLower.get(stripped2.toLowerCase());
      }
    }

    // 4b. Broader code pattern: "Pokémon Sv4a-Shiny Treasure EX" → "Shiny Treasure EX"
    const codeMatchNoEn = courtyardName.match(CODE_PATTERN_NO_EN);
    if (codeMatchNoEn) {
      const extracted = codeMatchNoEn[1].trim();
      if (refLower.has(extracted.toLowerCase())) {
        return refLower.get(extracted.toLowerCase());
      }
    }

    // 5. Suffix code: "Paldean Fates - PAF EN" → "Paldean Fates"
    const suffixMatch = courtyardName.match(SUFFIX_CODE_PATTERN);
    if (suffixMatch) {
      const extracted = suffixMatch[1].trim();
      if (refLower.has(extracted.toLowerCase())) {
        return refLower.get(extracted.toLowerCase());
      }
    }

    // 6. SV 151 special case
    if (SV151_PATTERN.test(courtyardName)) {
      if (refLower.has('151')) return refLower.get('151');
    }

    // 7. Era prefix extraction: "Pokémon Sun & Moon Burning Shadows" → try "Burning Shadows"
    for (const prefix of ERA_PREFIXES) {
      if (courtyardName.startsWith(prefix)) {
        const sub = courtyardName.slice(prefix.length).trim();
        if (sub && refLower.has(sub.toLowerCase())) {
          return refLower.get(sub.toLowerCase());
        }
      }
    }

    // 8. Try "Pokémon " + era extraction: "Pokémon Sword & Shield Brilliant Stars"
    //    first strip "Pokémon ", then try era prefixes
    if (/^Pokémon\s+/i.test(courtyardName)) {
      const withoutPoke = courtyardName.replace(/^Pokémon\s+/i, '');
      for (const prefix of ERA_PREFIXES) {
        const cleanPrefix = prefix.replace(/^Pokémon\s+/i, '');
        if (withoutPoke.startsWith(cleanPrefix)) {
          const sub = withoutPoke.slice(cleanPrefix.length).trim();
          if (sub && refLower.has(sub.toLowerCase())) {
            return refLower.get(sub.toLowerCase());
          }
        }
      }
    }

    // 9. Special mappings for promo sets
    const promoMappings = {
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

    const lc = courtyardName.toLowerCase();
    if (promoMappings[lc]) {
      // Return the mapped name (even if not in SetReference — still normalizes for dedup)
      const target = promoMappings[lc];
      return refLower.has(target.toLowerCase()) ? refLower.get(target.toLowerCase()) : target;
    }

    // 10. Japanese set name mappings for common ones
    const jpMappings = {
      'pokémon sv2a-pokemon 151': '151',
      'pokémon card 151': '151',
      'pokémon mew en-151': '151',
    };
    if (jpMappings[lc]) {
      const target = jpMappings[lc];
      return refLower.has(target.toLowerCase()) ? refLower.get(target.toLowerCase()) : target;
    }

    // 11. Specific known mappings
    const specificMappings = {
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
    if (specificMappings[lc]) {
      const target = specificMappings[lc];
      return refLower.has(target.toLowerCase()) ? refLower.get(target.toLowerCase()) : target;
    }

    // 12. Dedup pass: strip prefixes to produce a canonical short form even without
    //     a SetReference match. This merges duplicates like "Pokémon Sword & Shield Vstar Universe"
    //     + "VSTAR Universe" into a single entry.

    // Try code patterns (extract the set name from coded Courtyard names)
    if (codeMatch) return codeMatch[1].trim();
    if (codeMatchNoEn) return codeMatchNoEn[1].trim();

    // Try era prefix extraction (return the sub-name even without SetReference match)
    for (const prefix of ERA_PREFIXES) {
      if (courtyardName.startsWith(prefix)) {
        const sub = courtyardName.slice(prefix.length).trim();
        if (sub) return sub;
      }
    }

    // Try "Pokémon " + era: "Pokémon Sword & Shield Vstar Universe" → "Vstar Universe"
    if (/^Pokémon\s+/i.test(courtyardName)) {
      const withoutPoke = courtyardName.replace(/^Pokémon\s+/i, '');
      for (const prefix of ERA_PREFIXES) {
        const cleanPrefix = prefix.replace(/^Pokémon\s+/i, '');
        if (withoutPoke.startsWith(cleanPrefix)) {
          const sub = withoutPoke.slice(cleanPrefix.length).trim();
          if (sub) return sub;
        }
      }
      // Last resort: just strip "Pokémon " prefix
      return withoutPoke;
    }

    // Strip "EX " prefix for dedup even without SetReference
    if (/^EX\s+/i.test(courtyardName)) {
      return courtyardName.replace(/^EX\s+/i, '').replace(/\s*\(.*\)\s*$/, '');
    }

    // No match found — return original
    return courtyardName;
  };
}

async function main() {
  // Load all SetReference names
  const refs = await prisma.setReference.findMany({ select: { setName: true } });
  const refNames = refs.map(r => r.setName);
  const normalize = buildNormalizer(refNames);

  // Get all unique set names from slabs
  const slabSets = await prisma.slab.groupBy({
    by: ['setName'],
    where: { setName: { not: null } },
    _count: { id: true },
  });

  console.log(`Processing ${slabSets.length} unique set names...\n`);

  let updated = 0;
  let merged = 0;

  for (const group of slabSets) {
    const original = group.setName;
    const canonical = normalize(original);

    if (canonical !== original) {
      console.log(`  "${original}" (${group._count.id} slabs) → "${canonical}"`);
      await prisma.slab.updateMany({
        where: { setName: original },
        data: { setName: canonical },
      });
      updated += group._count.id;
      merged++;
    }
  }

  // Second pass: case-insensitive dedup. Find names that are the same ignoring case,
  // pick the one with more slabs as the canonical form.
  const afterNorm = await prisma.slab.groupBy({
    by: ['setName'],
    where: { setName: { not: null } },
    _count: { id: true },
  });

  const caseGroups = new Map(); // lowercase → [{name, count}]
  for (const g of afterNorm) {
    const key = g.setName.toLowerCase();
    if (!caseGroups.has(key)) caseGroups.set(key, []);
    caseGroups.get(key).push({ name: g.setName, count: g._count.id });
  }

  for (const [, variants] of caseGroups) {
    if (variants.length <= 1) continue;
    // Pick the variant with the most slabs as canonical
    variants.sort((a, b) => b.count - a.count);
    const canonical = variants[0].name;
    for (let i = 1; i < variants.length; i++) {
      console.log(`  DEDUP: "${variants[i].name}" (${variants[i].count}) → "${canonical}" (case merge)`);
      await prisma.slab.updateMany({
        where: { setName: variants[i].name },
        data: { setName: canonical },
      });
      updated += variants[i].count;
      merged++;
    }
  }

  // Verify final state
  const finalSets = await prisma.slab.groupBy({
    by: ['setName'],
    where: { setName: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  // Check how many now match SetReference
  const finalNames = finalSets.map(s => s.setName).filter(Boolean);
  const matchedRefs = await prisma.setReference.findMany({
    where: { setName: { in: finalNames } },
  });

  console.log(`\nUpdated ${updated} slabs across ${merged} set names`);
  console.log(`Final unique sets: ${finalSets.length}`);
  console.log(`Matched to SetReference: ${matchedRefs.length}/${finalSets.length}`);
  console.log(`Unmatched: ${finalSets.length - matchedRefs.length}`);

  // Show remaining unmatched
  const matchedSet = new Set(matchedRefs.map(r => r.setName));
  const unmatched = finalSets.filter(s => s.setName && !matchedSet.has(s.setName));
  if (unmatched.length > 0) {
    console.log('\nRemaining unmatched sets:');
    for (const s of unmatched) {
      console.log(`  "${s.setName}" (${s._count.id} slabs)`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
