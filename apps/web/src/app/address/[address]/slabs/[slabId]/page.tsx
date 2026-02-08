import Link from 'next/link';

interface Props {
  params: { address: string; slabId: string };
}

export default async function SlabDetailPage({ params }: Props) {
  // TODO: Wire to API when slab detail endpoint is implemented
  // const slab = await api.getSlabById(params.slabId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href={`/address/${params.address}`}
        className="text-sm text-gray-500 hover:text-gray-300 mb-4 inline-block"
      >
        &larr; Back to dashboard
      </Link>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h1 className="text-xl font-bold mb-4">Slab Detail</h1>
        <p className="text-gray-400">Slab ID: {params.slabId}</p>
        <p className="text-gray-500 text-sm mt-4">
          Detailed slab view will show cert number, grade, set info, price snapshot, and price history (premium).
        </p>
      </div>
    </div>
  );
}
