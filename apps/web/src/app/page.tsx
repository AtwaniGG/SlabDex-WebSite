import AddressInput from '@/components/AddressInput';

export default function HomePage() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-5 overflow-hidden">
      {/* Background orbs */}
      <div
        className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(245,185,75,0.06) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-[40%] left-[25%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(245,185,75,0.03) 0%, transparent 70%)',
        }}
      />

      {/* Hero */}
      <div className="relative z-10 text-center max-w-2xl mx-auto mb-12">
        <h1
          className="text-5xl sm:text-7xl font-black mb-6"
          style={{ letterSpacing: '-0.03em', lineHeight: 1.05, color: 'rgba(255,255,255,0.95)' }}
        >
          Track Your
          <br />
          <span style={{ color: '#F5B94B' }}>Pokemon Slabs</span>
        </h1>
        <p
          className="text-lg sm:text-xl max-w-md mx-auto leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.50)' }}
        >
          Collection tracking, set completion, and live pricing — all in one place.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8">
          <div className="pill">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#F5B94B' }}
            />
            Set Completion
          </div>
          <div className="pill">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'rgba(245,185,75,0.6)' }}
            />
            Live Pricing
          </div>
          <div className="pill">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'rgba(245,185,75,0.35)' }}
            />
            Slab Grading
          </div>
        </div>
      </div>

      {/* Address Input */}
      <div className="relative z-10 w-full max-w-lg">
        <AddressInput />
      </div>

      {/* Trust row */}
      <div className="relative z-10 mt-12 text-center">
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', marginBottom: '14px' }}>
          Paste your Courtyard wallet address to get started.
        </p>
        <div className="flex items-center justify-center gap-2.5">
          <span className="pill text-[11px] uppercase tracking-widest">No custody</span>
          <span className="pill text-[11px] uppercase tracking-widest">No approvals</span>
          <span className="pill text-[11px] uppercase tracking-widest">Read-only</span>
        </div>
      </div>
    </div>
  );
}
