import type { SlabItem } from '@/lib/api';

interface SlabCardProps {
  slab: SlabItem;
}

export default function SlabCard({ slab }: SlabCardProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors">
      {slab.imageUrl && (
        <div className="aspect-[3/4] bg-gray-900 relative">
          <img
            src={slab.imageUrl}
            alt={slab.cardName || 'Slab'}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
      )}
      {!slab.imageUrl && (
        <div className="aspect-[3/4] bg-gray-900 flex items-center justify-center">
          <span className="text-gray-600 text-sm">No image</span>
        </div>
      )}
      <div className="p-3">
        {slab.cardName ? (
          <h3 className="font-semibold text-sm truncate">
            {slab.cardName}
          </h3>
        ) : (
          <h3 className="text-sm truncate text-gray-500 italic">
            Unidentified Slab
          </h3>
        )}
        {(slab.setName || slab.cardNumber) && (
          <p className="text-xs text-gray-400 mt-1 truncate">
            {slab.setName || ''}
            {slab.cardNumber ? ` #${slab.cardNumber}` : ''}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          {slab.grader && slab.grade && (
            <span className="text-xs px-2 py-0.5 bg-pokeyellow/20 text-pokeyellow rounded">
              {slab.grader} {slab.grade}
            </span>
          )}
          {slab.marketPrice != null && (
            <span className="text-sm font-semibold text-green-400">
              ${slab.marketPrice.toLocaleString()}
            </span>
          )}
        </div>
        {slab.certNumber && (
          <p className="text-xs text-gray-500 mt-1">Cert: {slab.certNumber}</p>
        )}
      </div>
    </div>
  );
}
