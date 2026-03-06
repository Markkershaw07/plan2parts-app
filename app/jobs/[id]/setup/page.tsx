'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import type { TraySystem } from '@/types';

function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }

const COLOURS = ['#ef4444','#3b82f6','#22c55e','#f59e0b','#a855f7','#ec4899','#14b8a6','#f97316'];

const emptySystem = (): Omit<TraySystem, 'id'> => ({
  name: '',
  colour: COLOURS[0],
  template_id: '',
  total_length_m: 0,
  trapeze_count: 0,
  corner_count: 0,
  tee_count: 0,
  reducer_count: 0,
  confidence: 'high',
});

export default function SetupPage() {
  const params = useParams<{ id: string }>();
  const { jobs, templates, updateJob } = useAppStore();
  const [hydrated, setHydrated] = useState(false);
  const [form, setForm] = useState(emptySystem());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { setHydrated(true); }, []);

  const job = hydrated ? jobs.find((j) => j.id === params.id) : undefined;
  if (!hydrated) return null;
  if (!job) return <div className="p-6 text-slate-400">Job not found.</div>;

  function openNew() {
    setEditingId(null);
    setForm({ ...emptySystem(), colour: COLOURS[job!.systems.length % COLOURS.length] });
    setShowForm(true);
  }

  function openEdit(sys: TraySystem) {
    setEditingId(sys.id);
    setForm({ name: sys.name, colour: sys.colour, template_id: sys.template_id,
      total_length_m: sys.total_length_m, trapeze_count: sys.trapeze_count,
      corner_count: sys.corner_count, tee_count: sys.tee_count,
      reducer_count: sys.reducer_count, confidence: sys.confidence });
    setShowForm(true);
  }

  function saveSystem() {
    if (!form.name.trim()) return;
    if (editingId) {
      updateJob(params.id, {
        systems: job!.systems.map((s) => s.id === editingId ? { ...form, id: editingId } : s),
      });
    } else {
      updateJob(params.id, { systems: [...job!.systems, { ...form, id: `sys_${uid()}` }] });
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptySystem());
  }

  function deleteSystem(id: string) {
    if (window.confirm('Remove this system?')) {
      updateJob(params.id, { systems: job!.systems.filter((s) => s.id !== id) });
    }
  }

  function num(val: string) { return parseFloat(val) || 0; }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Tray Systems</h2>
          <p className="text-sm text-slate-400 mt-1">{job.systems.length} system{job.systems.length !== 1 ? 's' : ''} defined</p>
        </div>
        <button onClick={openNew} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2 px-4 rounded-lg text-sm">
          + Add System
        </button>
      </div>

      {job.systems.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-400 rounded-xl bg-slate-800 border border-slate-700">
          <p className="mb-4">No systems yet. Add one manually or analyse a plan in the Plan tab.</p>
          <button onClick={openNew} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2 px-4 rounded-lg text-sm">Add System</button>
        </div>
      )}

      {job.systems.map((sys) => {
        const tpl = templates.find((t) => t.id === sys.template_id);
        return (
          <div key={sys.id} className="rounded-xl bg-slate-800 border border-slate-700 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: sys.colour }} />
                <div>
                  <p className="font-semibold">{sys.name}</p>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {tpl ? tpl.name : 'No template'} | {sys.total_length_m}m | {sys.trapeze_count} trapezes | {sys.corner_count} corners | {sys.tee_count} tees | {sys.reducer_count} reducers
                  </p>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => openEdit(sys)} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-1.5 px-3 rounded-lg text-sm">Edit</button>
                <button onClick={() => deleteSystem(sys.id)} className="bg-red-600 hover:bg-red-500 text-white font-semibold py-1.5 px-3 rounded-lg text-sm">Remove</button>
              </div>
            </div>
          </div>
        );
      })}

      {showForm && (
        <div className="rounded-xl bg-slate-800 border border-amber-500 p-6 space-y-5">
          <h3 className="font-semibold">{editingId ? 'Edit System' : 'New System'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold uppercase tracking-wider text-slate-400 block mb-2">System Name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Main power tray" className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white text-base w-full" />
            </div>
            <div>
              <label className="text-sm font-semibold uppercase tracking-wider text-slate-400 block mb-2">Template</label>
              <select value={form.template_id} onChange={(e) => setForm((f) => ({ ...f, template_id: e.target.value }))}
                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white text-base w-full">
                <option value="">-- No template --</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold uppercase tracking-wider text-slate-400 block mb-2">Colour</label>
            <div className="flex gap-2 flex-wrap">
              {COLOURS.map((c) => (
                <button key={c} onClick={() => setForm((f) => ({ ...f, colour: c }))}
                  className={`w-8 h-8 rounded-full border-2 ${form.colour === c ? 'border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {([['total_length_m','Length (m)'],['trapeze_count','Trapezes'],['corner_count','Corners'],['tee_count','Tees'],['reducer_count','Reducers']] as const).map(([field, label]) => (
              <div key={field}>
                <label className="text-sm text-slate-400 block mb-1">{label}</label>
                <input type="number" min={0} step={field === 'total_length_m' ? 0.5 : 1}
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: num(e.target.value) }))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm w-full" />
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={saveSystem} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-3 px-5 rounded-lg">Save</button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-5 rounded-lg">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
