'use client';

import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';

export default function HomePage() {
  const { jobs, deleteJob } = useAppStore();
  const hydrated = useHydrated();

  const sortedJobs = hydrated
    ? [...jobs].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    : [];

  function handleDelete(id: string, name: string) {
    if (window.confirm(`Delete job "${name}"? This cannot be undone.`)) {
      deleteJob(id);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-700 bg-slate-900 px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Plan2Parts</h1>
            <p className="text-sm text-slate-400">AI cable containment take-off tool</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/templates" className="text-sm text-slate-400 hover:text-white">Templates</Link>
            <Link href="/jobs/new" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400">
              New Job
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {!hydrated ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : sortedJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="mb-6 text-slate-400">No jobs yet. Create your first plan take-off.</p>
            <Link href="/jobs/new" className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-950 hover:bg-amber-400">
              Create first job
            </Link>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Jobs ({sortedJobs.length})
            </p>
            <div className="space-y-3">
              {sortedJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800 p-5">
                  <div>
                    <p className="font-semibold text-white">{job.name}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {job.site ? `${job.site} | ` : ''}
                      {job.target_runs.length} run{job.target_runs.length !== 1 ? 's' : ''} targeted | 
                      {' '}Updated {formatDate(job.updated_at)}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <Link href={`/jobs/${job.id}/setup`} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400">
                      Open
                    </Link>
                    <button onClick={() => handleDelete(job.id, job.name)} className="px-2 text-sm text-slate-500 hover:text-red-400">
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
