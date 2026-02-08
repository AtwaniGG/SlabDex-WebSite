const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get all slabs grouped by set
  const slabs = await prisma.slab.findMany({
    where: { assetRaw: { ownerAddress: '0x52b812ec8e204541156f1f778b0672bd044a2e79' } },
    select: { setName: true, cardName: true, cardNumber: true },
    orderBy: { setName: 'asc' },
  });

  // Group by set
  const groups = {};
  for (const s of slabs) {
    const key = s.setName || '__null__';
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  }

  // Get all set references
  const setNames = Object.keys(groups).filter(k => k !== '__null__');
  const refs = await prisma.setReference.findMany({
    where: { setName: { in: setNames } },
  });
  const refMap = new Map(refs.map(r => [r.setName, r]));

  // Also try case-insensitive/partial matching
  const allRefs = await prisma.setReference.findMany();

  console.log(`Total slabs: ${slabs.length}`);
  console.log(`Unique sets from slabs: ${setNames.length}`);
  console.log(`Matched to SetReference: ${refs.length}`);
  console.log(`Total SetReferences: ${allRefs.length}\n`);

  console.log('=== SET BREAKDOWN ===\n');

  const setData = [];
  for (const [setName, setSlabs] of Object.entries(groups)) {
    if (setName === '__null__') continue;
    const ref = refMap.get(setName);
    const totalCards = ref?.totalCards ?? 0;
    const owned = setSlabs.length;
    const pct = totalCards > 0 ? Math.round((owned / totalCards) * 10000) / 100 : 0;

    setData.push({ setName, owned, totalCards, pct, matched: !!ref });
  }

  // Sort same way as the API
  setData.sort((a, b) => {
    const ac = a.pct === 100 ? 1 : 0;
    const bc = b.pct === 100 ? 1 : 0;
    if (ac !== bc) return bc - ac;
    return b.pct - a.pct;
  });

  for (const s of setData) {
    const matchStr = s.matched ? `✓ matched (${s.totalCards} total)` : '✗ NO MATCH in SetReference';
    console.log(`${s.setName}: ${s.owned} owned, ${matchStr}, pct=${s.pct}%`);
  }

  // Show unmatched sets and try to find close matches
  console.log('\n=== UNMATCHED SETS - FUZZY SEARCH ===\n');
  const unmatched = setData.filter(s => !s.matched);
  for (const s of unmatched) {
    const lower = s.setName.toLowerCase().replace(/pokémon|pokemon/gi, '').trim();
    const candidates = allRefs.filter(r => {
      const rl = r.setName.toLowerCase();
      return rl.includes(lower) || lower.includes(rl.replace(/pokémon|pokemon/gi, '').trim());
    });
    if (candidates.length > 0) {
      console.log(`"${s.setName}" → possible matches: ${candidates.map(c => `"${c.setName}" (${c.totalCards})`).join(', ')}`);
    } else {
      console.log(`"${s.setName}" → no fuzzy match found`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
