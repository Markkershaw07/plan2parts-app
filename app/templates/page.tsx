'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import type { AssemblyItem, TrapezTemplate } from '@/types';

function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }

const emptyForm = () => ({
  name: '',
  stick_length_m: 3,
  per_trapeze: [] as AssemblyItem[],
  per_join: [] as AssemblyItem[],
});

export default function TemplatesPage() {
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useAppStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [showForm, setShowForm] = useState(false);

  function openNew() { setEditing(null); setForm(emptyForm()); setShowForm(true); }

  function openEdit(t: TrapezTemplate) {
    setEditing(t.id);
    setForm({ name: t.name, stick_length_m: t.stick_length_m, per_trapeze: [...t.per_trapeze], per_join: [...t.per_join] });
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditing(null); setForm(emptyForm()); }

  function saveForm() {
    if (!form.name.trim()) return;
    editing ? updateTemplate(editing, form) : createTemplate(form);
    closeForm();
  }

  function addRow(section: 'per_trapeze' | 'per_join') {
    setForm((f) => ({ ...f, [section]: [...f[section], { id: uid(), name: '', qty: 1, unit: 'each' as const }] }));
  }

  function updateRow(section: 'per_trapeze' | 'per_join', id: string, patch: Partial<AssemblyItem>) {
    setForm((f) => ({ ...f, [section]: f[section].map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  }

  function removeRow(section: 'per_trapeze' | 'per_join', id: string) {
    setForm((f) => ({ ...f, [section]: f[section].filter((r) => r.id !== id) }));
  }

  function handleDelete(id: string) {
    if (window.confirm('Delete this template?')) deleteTemplate(id);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="bg-slate-900 border-b border-slate-700 px-4 py-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white text-sm">Back to Jobs</Link>
            <h1 className="text-lg font-semibold">Trapeze Templates</h1>
          </div>
          <button onClick={openNew} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2 px-4 rounded-lg text-sm">
            + New Template
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-4">
        {templates.length === 0 && !showForm && (
          <div className="text-center py-20 text-slate-400">
            <p className="mb-4">No templates yet. Create one to start generating BOMs.</p>
            <button onClick={openNew} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-3 px-5 rounded-lg">
              Create first template
            </button>
          </div>
        )}

        {templates.map((t) => (
          <div key={t.id} className="rounded-xl bg-slate-800 border border-slate-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-slate-400 mt-1">
                  Stick: {t.stick_length_m}m | {t.per_trapeze.length} trapeze items | {t.per_join.length} join items
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(t)} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-3 rounded-lg text-sm">Edit</button>
                <button onClick={() => handleDelete(t.id)} className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-3 rounded-lg text-sm">Delete</button>
              </div>
            </div>
          </div>
        ))}

        {showForm && (
          <div className="rounded-xl bg-slate-800 border border-amber-500 p-6 space-y-6">
            <h2 className="text-base font-semibold">{editing ? 'Edit Template' : 'New Template'}</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold uppercase tracking-wider text-slate-400 block mb-2">Template Name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white text-base w-full" placeholder="e.g. 75mm MGBT" />
              </div>
              <div>
                <label className="text-sm font-semibold uppercase tracking-wider text-slate-400 block mb-2">Stick Length (m)</label>
                <input type="number" value={form.stick_length_m} min={1} step={0.5}
                  onChange={(e) => setForm((f) => ({ ...f, stick_length_m: parseFloat(e.target.value) || 3 }))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white text-base w-full" />
              </div>
            </div>

            {(['per_trapeze', 'per_join'] as const).map((section) => (
              <div key={section}>
                <label className="text-sm font-semibold uppercase tracking-wider text-slate-400 block mb-3">
                  {section === 'per_trapeze' ? 'Items per Trapeze' : 'Items per Join'}
                </label>
                <div className="space-y-2">
                  {form[section].map((row) => (
                    <div key={row.id} className="flex gap-2 items-center">
                      <input value={row.name} onChange={(e) => updateRow(section, row.id, { name: e.target.value })}
                        placeholder="Item name" className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm flex-1" />
                      <input type="number" value={row.qty} min={0} step={0.5}
                        onChange={(e) => updateRow(section, row.id, { qty: parseFloat(e.target.value) || 1 })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm w-20" />
                      <select value={row.unit} onChange={(e) => updateRow(section, row.id, { unit: e.target.value as 'each' | 'm' })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm w-24">
                        <option value="each">each</option>
                        <option value="m">m</option>
                      </select>
                      <button onClick={() => removeRow(section, row.id)} className="text-slate-400 hover:text-red-400 text-xl px-1">x</button>
                    </div>
                  ))}
                  <button onClick={() => addRow(section)} className="text-amber-400 hover:text-amber-300 text-sm mt-1">+ Add item</button>
                </div>
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <button onClick={saveForm} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-3 px-5 rounded-lg">
                Save Template
              </button>
              <button onClick={closeForm} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-5 rounded-lg">
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
