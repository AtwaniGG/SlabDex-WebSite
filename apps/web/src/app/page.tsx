import AddressInput from '@/components/AddressInput';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-pokered via-pokeyellow to-pokeblue bg-clip-text text-transparent">
            SlabDex
          </span>
        </h1>
        <p className="text-lg text-gray-400 max-w-md mx-auto">
          Track your tokenized Pokémon slabs. See your collection, set completion, and slab values — all in one place.
        </p>
      </div>
      <AddressInput />
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-600">
          Paste your Courtyard wallet address to get started. No login required.
        </p>
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-600">
          <span>No custody</span>
          <span>No approvals</span>
          <span>Read-only</span>
        </div>
      </div>
    </div>
  );
}
