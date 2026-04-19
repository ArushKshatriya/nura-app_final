import Link from 'next/link';

const Sidebar = () => {
  return (
    <aside className="w-64 h-screen bg-white border-r border-outline-variant p-6 flex flex-col">
      <div className="mb-10">
        <h1 className="text-2xl font-display font-bold tracking-tight text-nura-primary">NURA</h1>
      </div>
      
      <nav className="flex flex-col gap-2 flex-1">
        <Link href="/dashboard" className="px-4 py-2 rounded-full hover:bg-surface font-medium transition-all">
          Overview
        </Link>
        <Link href="/dashboard/intake" className="px-4 py-2 rounded-full hover:bg-surface font-medium transition-all">
          AI Log
        </Link>
        <Link href="/dashboard/swaps" className="px-4 py-2 rounded-full hover:bg-surface font-medium transition-all text-nura-primary">
          Eco-Swaps
        </Link>
      </nav>

      <div className="mt-auto pt-6 border-t border-outline-variant">
        <div className="bg-surface p-4 rounded-xl">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 font-bold">Daily Goal</p>
          <div className="h-2 w-full bg-white rounded-full overflow-hidden">
            <div className="h-full bg-nura-yellow w-[65%]" />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;