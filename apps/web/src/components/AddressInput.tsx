'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function AddressInput() {
  const [address, setAddress] = useState('');
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = address.trim();
    if (trimmed) {
      router.push(`/address/${trimmed}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Paste your Courtyard wallet address (0x...)"
          className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pokeblue focus:border-transparent"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-pokeblue hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Look Up
        </button>
      </div>
    </form>
  );
}
