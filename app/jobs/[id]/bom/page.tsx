'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { calculateSimpleBOM } from '@/lib/bom-simple';
import { useHydrated } from '@/lib/use-hydrated';

export default function BOMPage() {
  const params = useParams<{ id: string }>();
  const { jobs, templates } = useAppStore();
  const hydrated = useHydrated();

  const job = hydrated ? jobs.find((entry) => entry.id === params.id) : undefined;

  if (!hydrated) return null;
  if (!job) return <div className="p-6 text-slate-400">Job not found.</div>;

  const lines = calculateSimpleBOM(job.systems, templates);
  const systemNames = [...new Set(lines.map((line) => line.system_name))];

  function copyAsText() {
    const text = systemNames.map((systemName) => {
      const rows = lines.filter((line) => line.system_name === systemName);
      return `${systemName}\n${rows.map((row) => `  ${row.item_name}  ${row.qty} ${row.unit}`).join('\n')}`;
    }).join('\n\n');

    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Bill of Materials</h2>
          <p className="mt-1 text-sm text-slate-400">Built from the reviewed AI take-off and Stu&apos;s tray templates.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={copyAsText} className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600">
            Copy as Text
          </button>
          <button onClick={() => window.print()} className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600">
            Print
          </button>
        </div>
      </div>

      {job.systems.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-12 text-center text-slate-400">
          <p className="mb-4">No reviewed runs saved yet.</p>
          <Link href={`/jobs/${params.id}/takeoff`} className="text-sm text-amber-400 hover:text-amber-300">Go to Plan Review</Link>
        </div>
      ) : lines.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-12 text-center text-slate-400">
          <p>The reviewed runs do not have complete templates assigned.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Item</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Unit</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">How</th>
              </tr>
            </thead>
            <tbody>
              {systemNames.map((systemName) => {
                const system = job.systems.find((entry) => entry.name === systemName);
                const rows = lines.filter((line) => line.system_name === systemName);

                return (
                  rows.map((row, index) => (
                    index === 0 ? [
                      <tr key={`hdr-${systemName}`} className="border-t border-slate-700 bg-slate-900">
                        <td colSpan={4} className="px-4 py-2 font-semibold text-amber-400">
                          <span className="inline-flex items-center gap-2">
                            {system ? <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: system.colour_hex }} /> : null}
                            {systemName}
                          </span>
                        </td>
                      </tr>,
                      <tr key={`${systemName}-${index}`} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                        <td className="px-4 py-2.5 text-white">{row.item_name}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-white">{row.qty}</td>
                        <td className="px-4 py-2.5 text-slate-400">{row.unit}</td>
                        <td className="hidden px-4 py-2.5 text-slate-500 md:table-cell">{row.derivation}</td>
                      </tr>,
                    ] : (
                      <tr key={`${systemName}-${index}`} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                        <td className="px-4 py-2.5 text-white">{row.item_name}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-white">{row.qty}</td>
                        <td className="px-4 py-2.5 text-slate-400">{row.unit}</td>
                        <td className="hidden px-4 py-2.5 text-slate-500 md:table-cell">{row.derivation}</td>
                      </tr>
                    )
                  ))
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
