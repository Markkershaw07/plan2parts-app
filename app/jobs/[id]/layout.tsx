'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';

const TABS = [
  { label: 'Runs', href: 'setup' },
  { label: 'Plan Review', href: 'takeoff' },
  { label: 'BOM', href: 'bom' },
];

export default function JobLayout({ children }: { children: React.ReactNode }) {
  const { jobs } = useAppStore();
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const hydrated = useHydrated();

  const job = hydrated ? jobs.find((entry) => entry.id === params.id) : undefined;

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
        <Link href="/" className="text-sm text-amber-400 hover:text-amber-300">Back to jobs</Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="border-b border-slate-700 bg-slate-900 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-4 py-3">
            <Link href="/" className="shrink-0 text-sm text-slate-400 hover:text-white">Jobs</Link>
            <span className="text-slate-600">/</span>
            <span className="truncate font-semibold">{job.name}</span>
            {job.site ? <span className="hidden truncate text-sm text-slate-400 sm:block">{job.site}</span> : null}
          </div>
          <nav className="flex gap-6">
            {TABS.map((tab) => {
              const href = `/jobs/${params.id}/${tab.href}`;
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={tab.href}
                  href={href}
                  className={`whitespace-nowrap pb-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-b-2 border-amber-400 text-amber-400'
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
