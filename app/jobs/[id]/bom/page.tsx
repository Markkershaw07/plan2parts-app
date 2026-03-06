'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { calculateSimpleBOM } from '@/lib/bom-simple';

export default function BOMPage() {
  const params = useParams<{ id: string }>();
  const { jobs, templates } = useAppStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  const job = hydrated ? jobs.find((j) => j.id === params.id) : undefined;
  if (!hydrated) return null;
  if (!job) return <div className="p-6 text-slate-400">Job not found.</div>;

  const lines = calculateSimpleBOM(job.systems, templates);
  const systemNames = [...new Set(lines.map((l) => l.system_name))];

  function copyAsText() {
    const text = systemNames.map((sysName) => {
      const rows = lines.filter((l) => l.system_name === sysName);
      return `${sysName}\n` + rows.map((r) => `  ${r.item_name}  ${r.qty} ${r.unit}`).join('\n');
    }).join('\n\n');
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Bill of Materials</h2>
        <div className="flex gap-2">
          <button onClick={copyAsText} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg text-sm">
            Copy as Text
          </button>
          <button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg text-sm">
            Print
          </button>
        </div>
      </div>

      {job.systems.length === 0 ? (
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-12 text-center text-slate-400">
          <p className="mb-4">No systems defined yet.</p>
          <Link href={`/jobs/${params.id}/setup`} className="text-amber-400 hover:text-amber-300 text-sm">Go to Setup</Link>
        </div>
      ) : lines.length === 0 ? (
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-12 text-center text-slate-400">
          <p>Systems have no templates assigned. Add templates in Setup to generate a BOM.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">Item</th>
                <th className="text-right px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">Qty</th>
                <th className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">Unit</th>
                <th className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs hidden md:table-cell">How</th>
              </tr>
            </thead>
            <tbody>
              {systemNames.map((sysName) => {
                const sys = job.systems.find((s) => s.name === sysName);
                const rows = lines.filter((l) => l.system_name === sysName);
                return (
                  <>
                    <tr key={`hdr-${sysName}`} className="border-t border-slate-700 bg-slate-900">
                      <td colSpan={4} className="px-4 py-2 font-semibold text-amber-400 flex items-center gap-2">
                        {sys && <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: sys.colour }} />}
                        {sysName}
                      </td>
                    </tr>
                    {rows.map((row, i) => (
                      <tr key={`${sysName}-${i}`} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                        <td className="px-4 py-2.5 text-white">{row.item_name}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-white">{row.qty}</td>
                        <td className="px-4 py-2.5 text-slate-400">{row.unit}</td>
                        <td className="px-4 py-2.5 text-slate-500 hidden md:table-cell">{row.derivation}</td>
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
