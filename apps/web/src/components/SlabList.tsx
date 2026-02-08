import type { SlabItem } from '@/lib/api';
import SlabCard from './SlabCard';

interface SlabListProps {
  slabs: SlabItem[];
}

export default function SlabList({ slabs }: SlabListProps) {
  if (slabs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No slabs found</p>
        <p className="text-sm mt-1">This address may not own any Courtyard slabs, or indexing is still in progress.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {slabs.map((slab) => (
        <SlabCard key={slab.id} slab={slab} />
      ))}
    </div>
  );
}
