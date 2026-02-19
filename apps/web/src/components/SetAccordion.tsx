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
      className="glass-card overflow-hidden"
      style={isComplete ? { borderColor: 'rgba(34,197,94,0.20)' } : undefined}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-3.5 flex items-center gap-4 text-left transition-all"
        style={{ background: 'transparent' }}
      >
        {/* Chevron */}
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          style={{ color: 'rgba(255,255,255,0.30)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>

        {/* Name */}
        <div className="flex-1 min-w-0">
          {!isUncategorized ? (
            <Link
              href={`/address/${address}/sets/${encodeURIComponent(group.setName!)}`}
              className="font-bold text-sm truncate block transition-colors"
              style={{ color: 'rgba(255,255,255,0.85)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {displayName}
            </Link>
          ) : (
            <span className="font-bold text-sm truncate block italic" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {displayName}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {!isUncategorized && group.totalCards > 0 && (
          <div className="w-32 flex-shrink-0 hidden sm:block">
            <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(group.completionPct, 100)}%`,
                  backgroundColor: isComplete ? '#22c55e' : group.completionPct > 50 ? '#facc15' : '#F5B94B',
                }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {!isUncategorized && group.totalCards > 0 ? (
            <>
              <span className="whitespace-nowrap tabular-nums" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.40)' }}>
                {group.ownedCount}/{group.totalCards}
              </span>
              <span
                className="whitespace-nowrap font-semibold"
                style={{ fontSize: '12px', color: isComplete ? '#22c55e' : 'rgba(255,255,255,0.25)' }}
              >
                {isComplete ? 'Complete!' : `${remaining} left`}
              </span>
            </>
          ) : (
            <span className="whitespace-nowrap" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
              {group.ownedCount} slab{group.ownedCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </button>

      {/* Expanded */}
      {open && (
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
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
