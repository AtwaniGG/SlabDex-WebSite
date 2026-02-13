import type { CardRefItem } from '@/lib/api';

interface NeededCardProps {
  card: CardRefItem;
}

export default function NeededCard({ card }: NeededCardProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden opacity-50 grayscale hover:opacity-75 hover:grayscale-0 transition-all">
      {card.imageSmall ? (
        <div className="aspect-[3/4] bg-gray-900 relative">
          <img
            src={card.imageSmall}
            alt={card.cardName}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-[3/4] bg-gray-900 flex items-center justify-center">
          <span className="text-gray-600 text-sm">No image</span>
        </div>
      )}
      <div className="p-3">
        <h3 className="font-semibold text-sm truncate">{card.cardName}</h3>
        <p className="text-xs text-gray-400 mt-1">#{card.cardNumber}</p>
        <span className="text-xs text-red-400 mt-2 inline-block">Needed</span>
      </div>
    </div>
  );
}
