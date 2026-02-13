'use client';

import { useState } from 'react';
import type { SlabItem, PaginatedSlabs } from '@/lib/api';
import SlabCard from './SlabCard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type SortOption = '' | 'price_desc' | 'price_asc';

interface SlabListPaginatedProps {
  address: string;
  initialData: PaginatedSlabs;
}

export default function SlabListPaginated({ address, initialData }: SlabListPaginatedProps) {
  const [slabs, setSlabs] = useState<SlabItem[]>(initialData.data);
  const [page, setPage] = useState(initialData.pagination.page);
  const [total, setTotal] = useState(initialData.pagination.total);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<SortOption>('');
  const hasMore = slabs.length < total;

  async function fetchSlabs(sortVal: SortOption, pageNum: number, append: boolean) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageNum));
      if (sortVal) params.set('sort', sortVal);
      const res = await fetch(`${API_BASE}/public/address/${address}/slabs?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data: PaginatedSlabs = await res.json();
      setSlabs((prev) => append ? [...prev, ...data.data] : data.data);
      setPage(pageNum);
      setTotal(data.pagination.total);
    } catch (e) {
      console.error('Failed to load slabs:', e);
    } finally {
      setLoading(false);
    }
  }

  function handleSortChange(newSort: SortOption) {
    setSort(newSort);
    fetchSlabs(newSort, 1, false);
  }

  function loadMore() {
    fetchSlabs(sort, page + 1, true);
  }

  if (slabs.length === 0 && !loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No slabs found</p>
        <p className="text-sm mt-1">This address may not own any Courtyard slabs, or indexing is still in progress.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value as SortOption)}
          className="bg-gray-800 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pokeblue"
        >
          <option value="">Newest First</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="price_asc">Price: Low to High</option>
        </select>
      </div>

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
