import Link from 'next/link';
import { api } from '@/lib/api';
import SetCard from '@/components/SetCard';

interface Props {
  params: { address: string };
}

export default async function SetsPage({ params }: Props) {
  let sets;

  try {
    sets = await api.getAddressSets(params.address);
  } catch {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Unable to load set data.</p>
        <Link href={`/address/${params.address}`} className="text-pokeblue hover:underline mt-2 inline-block">
          Go back
        </Link>
      </div>
    );
  }

  // Sort: completed first, then by completionPct DESC
  const sorted = [...sets].sort((a, b) => {
    const aComplete = a.completionPct === 100 ? 1 : 0;
    const bComplete = b.completionPct === 100 ? 1 : 0;
    if (aComplete !== bComplete) return bComplete - aComplete;
    return b.completionPct - a.completionPct;
  });

  const completedSets = sets.filter((s) => s.completionPct === 100).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href={`/address/${params.address}`}
        className="text-sm text-gray-500 hover:text-gray-300 mb-4 inline-block"
      >
        &larr; Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-2">Set Dex</h1>
      <p className="text-gray-400 mb-6">
        {sets.length} sets &middot; {completedSets} complete
      </p>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No sets found</p>
          <p className="text-sm mt-1">Set data will appear once slabs are indexed and parsed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sorted.map((set) => (
            <SetCard
              key={set.setName}
              set={set}
              address={params.address}
            />
          ))}
        </div>
      )}
    </div>
  );
}
