interface SetProgressBarProps {
  setName: string;
  ownedCount: number;
  totalCards: number;
  completionPct: number;
}

export default function SetProgressBar({ setName, ownedCount, totalCards, completionPct }: SetProgressBarProps) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{setName}</h3>
        <span className="ml-2 whitespace-nowrap tabular-nums" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
          {ownedCount}/{totalCards}
        </span>
      </div>
      <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(completionPct, 100)}%`,
            backgroundColor: completionPct === 100 ? '#22c55e' : completionPct > 50 ? '#facc15' : '#F5B94B',
          }}
        />
      </div>
      <p className="mt-2" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.30)' }}>{completionPct}% complete</p>
    </div>
  );
}
