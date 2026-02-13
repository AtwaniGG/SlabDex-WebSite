import Link from 'next/link';
import type { SetProgressItem } from '@/lib/api';

interface SetCardProps {
  set: SetProgressItem;
  address: string;
}

export default function SetCard({ set, address }: SetCardProps) {
  const isComplete = set.completionPct === 100;
  const remaining = set.totalCards > 0 ? set.totalCards - set.ownedCount : 0;

  return (
    <Link
      href={`/address/${address}/sets/${encodeURIComponent(set.setName)}`}
      className={`bg-gray-800 border rounded-lg overflow-hidden hover:border-gray-500 transition-colors block ${
        isComplete ? 'border-green-600/50' : 'border-gray-700'
      }`}
    >
      <div className="aspect-[16/9] bg-gray-900 relative flex items-center justify-center overflow-hidden">
        {set.logoUrl ? (
          <img
            src={set.logoUrl}
            alt={set.setName}
            className="max-w-full max-h-full object-contain p-4"
            loading="lazy"
          />
        ) : set.previewImageUrl ? (
          <img
            src={set.previewImageUrl}
            alt={set.setName}
            className="h-full object-contain"
            loading="lazy"
          />
        ) : set.symbolUrl ? (
          <img
            src={set.symbolUrl}
            alt={set.setName}
            className="w-10 h-10 object-contain opacity-40"
            loading="lazy"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
            <span className="text-gray-500 text-lg font-bold">{set.setName.charAt(0)}</span>
          </div>
        )}
        {isComplete && (
          <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">
            Complete
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-sm truncate">{set.setName}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400">
            {set.ownedCount}/{set.totalCards}
          </span>
          <span className={`text-xs font-medium ${
            isComplete ? 'text-green-400' : 'text-gray-500'
          }`}>
            {isComplete ? 'Complete!' : `${remaining} left`}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(set.completionPct, 100)}%`,
              backgroundColor: isComplete ? '#22c55e' : set.completionPct > 50 ? '#facc15' : '#3b82f6',
            }}
          />
        </div>
      </div>
    </Link>
  );
}
