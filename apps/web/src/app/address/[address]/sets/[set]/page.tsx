import Link from 'next/link';
import { api } from '@/lib/api';
import SlabCard from '@/components/SlabCard';
import NeededCard from '@/components/NeededCard';

interface Props {
  params: { address: string; set: string };
}

export default async function SetDetailPage({ params }: Props) {
  const setName = decodeURIComponent(params.set);

  let detail;

  try {
    detail = await api.getAddressSetDetail(params.address, setName);
  } catch {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Unable to load this set.</p>
        <Link href={`/address/${params.address}/sets`} className="text-pokeblue hover:underline mt-2 inline-block">
          Go back
        </Link>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Set not found.</p>
        <Link href={`/address/${params.address}/sets`} className="text-pokeblue hover:underline mt-2 inline-block">
          Go back
        </Link>
      </div>
    );
  }

  const isComplete = detail.completionPct === 100;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href={`/address/${params.address}/sets`}
        className="text-sm text-gray-500 hover:text-gray-300 mb-4 inline-block"
      >
        &larr; Back to sets
      </Link>

      {/* Set header */}
      <div className="flex items-center gap-4 mb-6">
        {detail.logoUrl && (
          <img
            src={detail.logoUrl}
            alt={detail.setName}
            className="h-12 object-contain"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">{detail.setName}</h1>
          <p className="text-gray-400 text-sm">
            {detail.series && `${detail.series} \u00b7 `}
            {detail.ownedCount}/{detail.totalCards} cards
            {' '}({detail.completionPct}%)
            {isComplete && <span className="text-green-400 ml-2">Complete!</span>}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-3 mb-8">
        <div
          className="h-3 rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(detail.completionPct, 100)}%`,
            backgroundColor: isComplete ? '#22c55e' : detail.completionPct > 50 ? '#facc15' : '#3b82f6',
          }}
        />
      </div>

      {/* Cards You Own */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">
          Cards You Own
          <span className="text-sm font-normal text-gray-400 ml-2">
            ({detail.ownedCards.length})
          </span>
        </h2>
        {detail.ownedCards.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {detail.ownedCards.map((slab) => (
              <SlabCard key={slab.id} slab={slab} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No cards owned in this set yet.</p>
        )}
      </section>

      {/* Cards You Need */}
      {detail.neededCards.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">
            Cards You Need
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({detail.neededCards.length})
            </span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {detail.neededCards.map((card) => (
              <NeededCard key={card.ptcgCardId} card={card} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
