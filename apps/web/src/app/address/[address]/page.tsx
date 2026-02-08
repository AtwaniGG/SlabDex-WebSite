import Link from 'next/link';
import { api } from '@/lib/api';
import SlabListPaginated from '@/components/SlabListPaginated';

interface Props {
  params: { address: string };
}

export default async function AddressDashboard({ params }: Props) {
  let summary;
  let slabsResult;

  try {
    [summary, slabsResult] = await Promise.all([
      api.getAddressSummary(params.address),
      api.getAddressSlabs(params.address),
    ]);
  } catch {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-300">Unable to load data</h2>
          <p className="text-gray-500 mt-2">
            Make sure the API server is running and the address is valid.
          </p>
          <Link href="/" className="inline-block mt-4 text-pokeblue hover:underline">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  const completedSets = summary.sets.filter((s) => s.completionPct === 100).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Address header */}
      <div className="mb-8">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 mb-2 inline-block">
          &larr; Back
        </Link>
        <h1 className="text-xl font-bold truncate">{params.address}</h1>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Slabs</p>
          <p className="text-2xl font-bold">{summary.totalSlabs}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400">Sets</p>
          <p className="text-2xl font-bold">
            {completedSets}/{summary.totalSets}
            <span className="text-sm font-normal text-gray-400 ml-1">complete</span>
          </p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400">Est. Value</p>
          <p className="text-2xl font-bold text-green-400">
            ${summary.estimatedValueUsd.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400">Platform</p>
          <p className="text-2xl font-bold">Courtyard</p>
        </div>
      </div>

      {/* Slabs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Slabs</h2>
          <Link
            href={`/address/${params.address}/sets`}
            className="px-4 py-2 bg-pokeblue hover:bg-pokeblue/80 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Sets
          </Link>
        </div>
        <SlabListPaginated address={params.address} initialData={slabsResult} />
      </section>
    </div>
  );
}
