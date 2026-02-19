'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'rgba(8, 9, 13, 0.80)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            {/* Logo mark */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(245, 185, 75, 0.12)',
                border: '1px solid rgba(245, 185, 75, 0.25)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(245,185,75,0.6)" strokeWidth="1.5" />
                <line x1="2" y1="12" x2="22" y2="12" stroke="rgba(245,185,75,0.6)" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="3" stroke="rgba(245,185,75,0.6)" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="1.5" fill="#F5B94B" />
              </svg>
            </div>
            <span
              className="text-lg font-extrabold tracking-tight"
              style={{ color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em' }}
            >
              SlabDex
            </span>
          </Link>

          <nav className="flex items-center gap-3">
            <span className="pill text-[11px] uppercase tracking-widest hidden sm:inline-flex">
              Courtyard
            </span>
          </nav>
        </div>
      </div>
    </header>
  );
}
