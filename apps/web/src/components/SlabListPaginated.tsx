'use client';

import { useState } from 'react';
import type { SlabItem, PaginatedSlabs } from '@/lib/api';
import SlabCard from './SlabCard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface SlabListPaginatedProps {
  address: string;
  initialData: PaginatedSlabs;
}

export default function SlabListPaginated({ address, initialData }: SlabListPaginatedProps) {
  const [slabs, setSlabs] = useState<SlabItem[]>(initialData.data);
  const [page, setPage] = useState(initialData.pagination.page);
  const [loading, setLoading] = useState(false);
  const total = initialData.pagination.total;
  const hasMore = slabs.length < total;

  async function loadMore() {
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`${API_BASE}/public/address/${address}/slabs?page=${nextPage}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data: PaginatedSlabs = await res.json();
      setSlabs((prev) => [...prev, ...data.data]);
      setPage(nextPage);
    } catch (e) {
      console.error('Failed to load more slabs:', e);
    } finally {
      setLoading(false);
    }
  }

  if (slabs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No slabs found</p>
        <p className="text-sm mt-1">This address may not own any Courtyard slabs, or indexing is still in progress.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {slabs.map((slab) => (
          <SlabCard key={slab.id} slab={slab} />
        ))}
      </div>
      <div className="text-center mt-6">
        <p className="text-sm text-gray-500 mb-3">
          Showing {slabs.length} of {total} slabs
        </p>
        {hasMore && (
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-pokeblue hover:bg-pokeblue/80 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        )}
      </div>
    </div>
  );
}
