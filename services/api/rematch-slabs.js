/**
 * One-time migration: re-match existing slabs against the CardReference catalog.
 *
 * Run AFTER the API has started and seeded the catalog (sets + cards).
 *
 * Usage:
 *   DATABASE_URL="postgresql://postgres:2112@localhost:5432/pokedex_slabs" node services/api/rematch-slabs.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalizeCardNumber(num) {
  // "29/124" → "29", "085" → "85"
  const base = num.split('/')[0];
  return base.replace(/^0+(?=\d)/, '');
}

async function main() {
  // Verify catalog is seeded
  const cardCount = await prisma.cardReference.count();
  if (cardCount === 0) {
    console.error('CardReference table is empty. Start the API first to seed the catalog.');
    process.exit(1);
  }
  console.log(`CardReference catalog has ${cardCount} cards`);

  // Get all slabs
  const slabs = await prisma.slab.findMany({
    select: {
      id: true,
      cardName: true,
      cardNumber: true,
      setName: true,
    },
  });
  console.log(`Processing ${slabs.length} slabs...`);

  let matched = 0;
  let changed = 0;
  let unchanged = 0;
  let noMatch = 0;

  for (const slab of slabs) {
    if (!slab.cardName) {
      noMatch++;
      continue;
    }

    let bestMatch = null;

    // Strategy 1: exact cardName + normalized cardNumber
    if (slab.cardNumber) {
      const num = normalizeCardNumber(slab.cardNumber);
      const matches = await prisma.cardReference.findMany({
        where: {
          cardName: { equals: slab.cardName, mode: 'insensitive' },
          cardNumber: num,
        },
        select: { setName: true, ptcgCardId: true },
      });

      if (matches.length === 1) {
        bestMatch = matches[0];
      } else if (matches.length > 1 && slab.setName) {
        const hint = slab.setName.toLowerCase();
        bestMatch = matches.find(
          (m) =>
            hint.includes(m.setName.toLowerCase()) ||
            m.setName.toLowerCase().includes(hint),
        ) || null;
      }

      // Try contains if exact failed
      if (!bestMatch) {
        const fuzzy = await prisma.cardReference.findMany({
          where: {
            cardName: { contains: slab.cardName, mode: 'insensitive' },
            cardNumber: num,
          },
          select: { setName: true, ptcgCardId: true },
        });

        if (fuzzy.length === 1) {
          bestMatch = fuzzy[0];
        } else if (fuzzy.length > 1 && slab.setName) {
          const hint = slab.setName.toLowerCase();
          bestMatch = fuzzy.find(
            (m) =>
              hint.includes(m.setName.toLowerCase()) ||
              m.setName.toLowerCase().includes(hint),
          ) || null;
        }
      }
    }

    if (bestMatch) {
      matched++;
      if (bestMatch.setName !== slab.setName) {
        await prisma.slab.update({
          where: { id: slab.id },
          data: { setName: bestMatch.setName },
        });
        console.log(
          `  "${slab.cardName}" #${slab.cardNumber}: "${slab.setName}" → "${bestMatch.setName}"`,
        );
        changed++;
      } else {
        unchanged++;
      }
    } else {
      noMatch++;
    }
  }

  console.log(`\nDone!`);
  console.log(`  Matched: ${matched} (${changed} changed, ${unchanged} unchanged)`);
  console.log(`  No match: ${noMatch}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
