import type { SetProgressItem } from '@/lib/api';
import SetProgressBar from './SetProgressBar';

interface SetGridProps {
  sets: SetProgressItem[];
}

export default function SetGrid({ sets }: SetGridProps) {
  if (sets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No sets found</p>
        <p className="text-sm mt-1">Set data will appear once slabs are indexed and parsed.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sets.map((set) => (
        <SetProgressBar
          key={set.setName}
          setName={set.setName}
          ownedCount={set.ownedCount}
          totalCards={set.totalCards}
          completionPct={set.completionPct}
        />
      ))}
    </div>
  );
}
