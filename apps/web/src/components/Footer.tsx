export default function Footer() {
  return (
    <footer className="relative py-10 mt-auto">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-px"
        style={{
          width: '80%',
          background: 'linear-gradient(90deg, transparent, rgba(245,185,75,0.18), transparent)',
        }}
      />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 text-center">
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '13px' }}>
          SlabDex — Track your tokenized Pokemon slabs across platforms.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.16)', fontSize: '12px', marginTop: '6px' }}>
          No custody. No approvals. Read-only.
        </p>
      </div>
    </footer>
  );
}
