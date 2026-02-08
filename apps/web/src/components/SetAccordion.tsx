'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { SetWithSlabs } from '@/lib/api';
import SlabCard from './SlabCard';

interface SetAccordionProps {
  group: SetWithSlabs;
  address: string;
}

export default function SetAccordion({ group, address }: SetAccordionProps) {
  const [open, setOpen] = useState(false);

  const isComplete = group.completionPct === 100;
  const remaining = group.totalCards > 0 ? group.totalCards - group.ownedCount : 0;
  const displayName = group.setName ?? 'Uncategorized';
  const isUncategorized = group.setName === null;

  return (
    <div
      className={`bg-gray-800 border rounded-lg overflow-hidden transition-colors ${
        isComplete ? 'border-green-600/50' : 'border-gray-700'
      }`}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center gap-4 hover:bg-gray-750 transition-colors text-left"
      >
        {/* Expand/collapse chevron */}
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>

        {/* Set name */}
        <div className="flex-1 min-w-0">
          {!isUncategorized ? (
            <Link
              href={`/address/${address}/sets/${encodeURIComponent(group.setName!)}`}
              className="font-semibold text-sm hover:text-pokeblue transition-colors truncate block"
              onClick={(e) => e.stopPropagation()}
            >
              {displayName}
            </Link>
          ) : (
            <span className="font-semibold text-sm text-gray-400 truncate block italic">
              {displayName}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {!isUncategorized && group.totalCards > 0 && (
          <div className="w-32 flex-shrink-0 hidden sm:block">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(group.completionPct, 100)}%`,
                  backgroundColor: isComplete ? '#22c55e' : group.completionPct > 50 ? '#facc15' : '#3b82f6',
                }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {!isUncategorized && group.totalCards > 0 ? (
            <>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {group.ownedCount}/{group.totalCards}
              </span>
              <span className={`text-xs font-medium whitespace-nowrap ${
                isComplete ? 'text-green-400' : 'text-gray-500'
              }`}>
                {isComplete ? 'Complete!' : `${remaining} left`}
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {group.ownedCount} slab{group.ownedCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </button>

      {/* Expanded content — slab cards grid */}
      {open && (
        <div className="border-t border-gray-700 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {group.slabs.map((slab) => (
              <SlabCard key={slab.id} slab={slab} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
