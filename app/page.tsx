'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';

export default function HomePage() {
  const { jobs, deleteJob } = useAppStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  const sortedJobs = hydrated
    ? [...jobs].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    : [];

  function handleDelete(id: string, name: string) {
    if (window.confirm(`Delete job "${name}"? This cannot be undone.`)) deleteJob(id);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="bg-slate-900 border-b border-slate-700 px-4 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Plan2Parts</h1>
            <p className="text-sm text-slate-400">Cable containment take-off tool</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/templates" className="text-slate-400 hover:text-white text-sm">Templates</Link>
            <Link href="/jobs/new" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2 px-4 rounded-lg text-sm">
              New Job
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {!hydrated ? (
          <p className="text-slate-500 text-sm">Loading...</p>
        ) : sortedJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-slate-400 mb-6">No jobs yet. Create your first job.</p>
            <Link href="/jobs/new" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-3 px-6 rounded-lg">
              Create first job
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Jobs ({sortedJobs.length})
            </p>
            <div className="space-y-3">
              {sortedJobs.map((job) => (
                <div key={job.id} className="rounded-xl bg-slate-800 border border-slate-700 p-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{job.name}</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {job.site ? `${job.site} | ` : ''}
                      {job.systems.length} system{job.systems.length !== 1 ? 's' : ''} | Updated {formatDate(job.updated_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/jobs/${job.id}/setup`} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2 px-4 rounded-lg text-sm">
                      Open
                    </Link>
                    <button onClick={() => handleDelete(job.id, job.name)} className="text-slate-500 hover:text-red-400 text-sm px-2">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
