'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';

const TABS = [
  { label: 'Setup', href: 'setup' },
  { label: 'Plan', href: 'takeoff' },
  { label: 'BOM', href: 'bom' },
];

export default function JobLayout({ children }: { children: React.ReactNode }) {
  const { jobs } = useAppStore();
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  const job = hydrated ? jobs.find((j) => j.id === params.id) : undefined;

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950">
        <p className="text-slate-400">Job not found.</p>
        <Link href="/" className="text-amber-400 hover:text-amber-300 text-sm">Back to jobs</Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="bg-slate-900 border-b border-slate-700 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-4 py-3">
            <Link href="/" className="text-slate-400 hover:text-white text-sm shrink-0">Jobs</Link>
            <span className="text-slate-600">/</span>
            <span className="font-semibold truncate">{job.name}</span>
            {job.site && <span className="text-slate-400 text-sm hidden sm:block truncate">{job.site}</span>}
          </div>
          <nav className="flex gap-6">
            {TABS.map((tab) => {
              const href = `/jobs/${params.id}/${tab.href}`;
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={tab.href}
                  href={href}
                  className={`pb-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-amber-400 border-b-2 border-amber-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
