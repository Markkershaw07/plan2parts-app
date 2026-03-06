'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';

export default function NewJobPage() {
  const router = useRouter();
  const { createJob } = useAppStore();
  const [name, setName] = useState('');
  const [site, setSite] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const id = createJob(name.trim(), site.trim());
    router.push(`/jobs/${id}/setup`);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="bg-slate-900 border-b border-slate-700 px-4 py-4">
        <div className="mx-auto max-w-2xl flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-white text-sm">Back to Jobs</Link>
          <h1 className="text-base font-semibold">New Job</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <form onSubmit={handleSubmit} className="rounded-xl bg-slate-800 border border-slate-700 p-6 space-y-5">
          <h2 className="text-lg font-semibold">Job Details</h2>

          <div>
            <label className="text-sm font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Job Name <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lot 4 Block C - Fire Zone 2"
              required
              className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white text-base w-full focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold uppercase tracking-wider text-slate-400 block mb-2">Site</label>
            <input
              type="text"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              placeholder="e.g. Westfield Newmarket"
              className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white text-base w-full focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link href="/" className="text-slate-400 hover:text-white text-sm">Cancel</Link>
            <button
              type="submit"
              disabled={!name.trim()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-3 px-6 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create Job
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
