import type { SlabItem } from '@/lib/api';

interface SlabCardProps {
  slab: SlabItem;
}

export default function SlabCard({ slab }: SlabCardProps) {
  return (
    <div className="glass-card-interactive group overflow-hidden">
      {slab.imageUrl ? (
        <div className="aspect-[3/4] relative" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <img
            src={slab.imageUrl}
            alt={slab.cardName || 'Slab'}
            className="w-full h-full object-contain transition-all duration-300"
            style={{ filter: 'brightness(0.95)' }}
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-[3/4] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '13px' }}>No image</span>
        </div>
      )}
      <div className="p-3">
        {slab.cardName ? (
          <h3 className="font-bold text-sm truncate" style={{ color: 'rgba(255,255,255,0.88)' }}>
            {slab.cardName}
          </h3>
        ) : (
          <h3 className="text-sm truncate italic" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Unidentified Slab
          </h3>
        )}
        {(slab.setName || slab.cardNumber) && (
          <p className="mt-1 truncate" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>
            {slab.setName || ''}
            {slab.cardNumber ? ` #${slab.cardNumber}` : ''}
          </p>
        )}
        <div className="flex items-center justify-between mt-2.5">
          {slab.grader && slab.grade && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: 'rgba(245,185,75,0.12)',
                border: '1px solid rgba(245,185,75,0.30)',
                color: '#F5B94B',
                fontSize: '11px',
              }}
            >
              {slab.grader} {slab.grade}
            </span>
          )}
          {slab.marketPrice != null && (
            <span className="text-sm font-bold" style={{ color: '#22c55e' }}>
              ${slab.marketPrice.toLocaleString()}
            </span>
          )}
        </div>
        {slab.certNumber && (
          <p className="mt-1.5" style={{ color: 'rgba(255,255,255,0.20)', fontSize: '11px' }}>Cert: {slab.certNumber}</p>
        )}
      </div>
    </div>
  );
}
