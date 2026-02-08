'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-pokered to-pokeyellow bg-clip-text text-transparent">
              SlabDex
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              Courtyard Slab Tracker
            </span>
          </nav>
        </div>
      </div>
    </header>
  );
}
