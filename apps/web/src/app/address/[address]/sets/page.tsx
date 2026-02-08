import Link from 'next/link';
import { api } from '@/lib/api';
import SetAccordion from '@/components/SetAccordion';

interface Props {
  params: { address: string };
}

export default async function SetsPage({ params }: Props) {
  let slabsBySet;

  try {
    slabsBySet = await api.getAddressSlabsBySet(params.address);
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

  const setGroups = slabsBySet.filter((g) => g.setName !== null);
  const uncategorized = slabsBySet.find((g) => g.setName === null);
  const completedSets = setGroups.filter((g) => g.completionPct === 100).length;

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
        {setGroups.length} sets &middot; {completedSets} complete
      </p>

      {setGroups.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No sets found</p>
          <p className="text-sm mt-1">Set data will appear once slabs are indexed and parsed.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {setGroups.map((group) => (
            <SetAccordion
              key={group.setName!}
              group={group}
              address={params.address}
            />
          ))}
        </div>
      )}

      {uncategorized && uncategorized.slabs.length > 0 && (
        <div className="mt-8 opacity-60">
          <SetAccordion
            group={uncategorized}
            address={params.address}
          />
        </div>
      )}
    </div>
  );
}
