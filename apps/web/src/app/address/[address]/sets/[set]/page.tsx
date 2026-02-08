import Link from 'next/link';
import { api } from '@/lib/api';
import SlabList from '@/components/SlabList';

interface Props {
  params: { address: string; set: string };
}

export default async function SetDetailPage({ params }: Props) {
  const setName = decodeURIComponent(params.set);

  let slabsResult;

  try {
    slabsResult = await api.getAddressSlabs(params.address, { set: setName });
  } catch {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Unable to load slabs for this set.</p>
        <Link href={`/address/${params.address}/sets`} className="text-pokeblue hover:underline mt-2 inline-block">
          Go back
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href={`/address/${params.address}/sets`}
        className="text-sm text-gray-500 hover:text-gray-300 mb-4 inline-block"
      >
        &larr; Back to sets
      </Link>
      <h1 className="text-2xl font-bold mb-2">{setName}</h1>
      <p className="text-gray-400 mb-6">{slabsResult.pagination.total} slabs in this set</p>
      <SlabList slabs={slabsResult.data} />
    </div>
  );
}
