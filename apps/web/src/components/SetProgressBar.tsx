interface SetProgressBarProps {
  setName: string;
  ownedCount: number;
  totalCards: number;
  completionPct: number;
}

export default function SetProgressBar({ setName, ownedCount, totalCards, completionPct }: SetProgressBarProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm truncate">{setName}</h3>
        <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
          {ownedCount}/{totalCards}
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(completionPct, 100)}%`,
            backgroundColor: completionPct === 100 ? '#22c55e' : completionPct > 50 ? '#facc15' : '#3b82f6',
          }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{completionPct}% complete</p>
    </div>
  );
}
