import Link from 'next/link';
import { api } from '@/lib/api';
import SetCard from '@/components/SetCard';

interface Props {
  params: { address: string };
}

export default async function SetsPage({ params }: Props) {
  let sets;

  try {
    sets = await api.getAddressSets(params.address);
  } catch {
    return (
      <div className="max-w-6xl mx-auto px-5 py-16 text-center">
        <div className="glass-card inline-block px-10 py-8">
          <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: '16px' }}>Unable to load set data.</p>
          <Link
            href={`/address/${params.address}`}
            className="explore-btn mt-5 text-sm"
          >
            <span>Back to dashboard</span>
            <span className="arrow-circle">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const sorted = [...sets].sort((a, b) => {
    const aComplete = a.completionPct === 100 ? 1 : 0;
    const bComplete = b.completionPct === 100 ? 1 : 0;
    if (aComplete !== bComplete) return bComplete - aComplete;
    return b.completionPct - a.completionPct;
  });

  const completedSets = sets.filter((s) => s.completionPct === 100).length;
  const totalOwned = sets.reduce((acc, s) => acc + s.ownedCount, 0);
  const totalCards = sets.reduce((acc, s) => acc + s.totalCards, 0);
  const overallPct = totalCards > 0 ? Math.round((totalOwned / totalCards) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
      {/* Back */}
      <Link
        href={`/address/${params.address}`}
        className="inline-flex items-center gap-1.5 mb-8 transition-all"
        style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="mb-10">
        <h1
          className="text-4xl sm:text-5xl font-black"
          style={{ letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.95)' }}
        >
          Set <span style={{ color: '#F5B94B' }}>Dex</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', marginTop: '6px', fontSize: '14px' }}>
          Your Pokemon set collection tracker
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-10">
        <div className="stat-card text-center">
          <p className="text-3xl sm:text-4xl font-black tabular-nums" style={{ color: 'rgba(255,255,255,0.92)' }}>{sets.length}</p>
          <p style={{ color: 'rgba(255,255,255,0.30)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>Sets</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-3xl sm:text-4xl font-black tabular-nums" style={{ color: '#22c55e' }}>{completedSets}</p>
          <p style={{ color: 'rgba(255,255,255,0.30)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>Complete</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-3xl sm:text-4xl font-black tabular-nums" style={{ color: '#F5B94B' }}>{overallPct}%</p>
          <p style={{ color: 'rgba(255,255,255,0.30)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>Overall</p>
        </div>
      </div>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div className="glass-card text-center py-16 px-8">
          <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: '16px' }}>No sets found</p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', marginTop: '8px' }}>
            Set data will appear once slabs are indexed and parsed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {sorted.map((set) => (
            <SetCard key={set.setName} set={set} address={params.address} />
          ))}
        </div>
      )}
    </div>
  );
}
