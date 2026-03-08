'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import type { AssemblyItem, TrapezTemplate } from '@/types';

type SectionKey = 'per_trapeze' | 'per_section' | 'per_corner' | 'per_tee' | 'per_reducer';

type TemplateForm = {
  name: string;
  per_trapeze: AssemblyItem[];
  per_section: AssemblyItem[];
  per_corner: AssemblyItem[];
  per_tee: AssemblyItem[];
  per_reducer: AssemblyItem[];
};

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyForm(): TemplateForm {
  return {
    name: '',
    per_trapeze: [],
    per_section: [],
    per_corner: [],
    per_tee: [],
    per_reducer: [],
  };
}

function SectionEditor({
  title,
  hint,
  section,
  rows,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  hint?: string;
  section: SectionKey;
  rows: AssemblyItem[];
  onAdd: (section: SectionKey) => void;
  onUpdate: (section: SectionKey, id: string, patch: Partial<AssemblyItem>) => void;
  onRemove: (section: SectionKey, id: string) => void;
}) {
  return (
    <div className="border-t border-slate-700 pt-5">
      <label className="mb-3 block text-sm font-semibold uppercase tracking-wider text-amber-400">{title}</label>
      {hint ? <p className="mb-3 text-xs text-slate-500">{hint}</p> : null}
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-2">
            <input
              value={row.name}
              onChange={(e) => onUpdate(section, row.id, { name: e.target.value })}
              placeholder="Item name"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
            <input
              type="number"
              min={0}
              step={0.1}
              value={row.qty}
              onChange={(e) => onUpdate(section, row.id, { qty: Number(e.target.value) || 0 })}
              className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
            <select
              value={row.unit}
              onChange={(e) => onUpdate(section, row.id, { unit: e.target.value as 'each' | 'm' })}
              className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <option value="each">each</option>
              <option value="m">m</option>
            </select>
            <button onClick={() => onRemove(section, row.id)} className="px-2 text-xl text-slate-400 hover:text-red-400">x</button>
          </div>
        ))}
        <button onClick={() => onAdd(section)} className="text-sm text-amber-400 hover:text-amber-300">+ Add item</button>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useAppStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(emptyForm());
  const [showForm, setShowForm] = useState(false);

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  }

  function openEdit(template: TrapezTemplate) {
    setEditing(template.id);
    setForm({
      name: template.name,
      per_trapeze: [...template.per_trapeze],
      per_section: [...template.per_section],
      per_corner: [...template.per_corner],
      per_tee: [...(template.per_tee ?? [])],
      per_reducer: [...(template.per_reducer ?? [])],
    });
    setShowForm(true);
  }

  function closeForm() {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(false);
  }

  function saveForm() {
    if (!form.name.trim()) return;
    if (editing) {
      updateTemplate(editing, form);
    } else {
      createTemplate(form);
    }
    closeForm();
  }

  function addRow(section: SectionKey) {
    setForm((current) => ({
      ...current,
      [section]: [...current[section], { id: uid(), name: '', qty: 1, unit: 'each' }],
    }));
  }

  function updateRow(section: SectionKey, id: string, patch: Partial<AssemblyItem>) {
    setForm((current) => ({
      ...current,
      [section]: current[section].map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));
  }

  function removeRow(section: SectionKey, id: string) {
    setForm((current) => ({
      ...current,
      [section]: current[section].filter((row) => row.id !== id),
    }));
  }

  function handleDelete(id: string) {
    if (window.confirm('Delete this template?')) {
      deleteTemplate(id);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-700 bg-slate-900 px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-slate-400 hover:text-white">Back to Jobs</Link>
            <h1 className="text-lg font-semibold">Tray Templates</h1>
          </div>
          <button onClick={openNew} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400">
            + New Template
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 px-4 py-8">
        {templates.map((template) => (
          <div key={template.id} className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{template.name}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {template.per_trapeze.length} trapeze items | {template.per_section.length} section items | {template.per_corner.length} corner items
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(template)} className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-600">
                  Edit
                </button>
                <button onClick={() => handleDelete(template.id)} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {templates.length === 0 && !showForm ? (
          <div className="py-20 text-center text-slate-400">
            <p className="mb-4">No templates yet. Create one to start generating BOMs.</p>
            <button onClick={openNew} className="rounded-lg bg-amber-500 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-400">
              Create first template
            </button>
          </div>
        ) : null}

        {showForm ? (
          <div className="rounded-xl border border-amber-500 bg-slate-800 p-6 space-y-6">
            <h2 className="text-base font-semibold">{editing ? 'Edit Template' : 'New Template'}</h2>

            <div>
              <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-slate-400">Template Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                placeholder="e.g. NEMA 2 fire rated"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white"
              />
            </div>

            <SectionEditor
              title="Per Trapeze"
              hint="Use Stu's support assembly quantities here, including rods, washers, nuts, brackets, and unistrut."
              section="per_trapeze"
              rows={form.per_trapeze}
              onAdd={addRow}
              onUpdate={updateRow}
              onRemove={removeRow}
            />

            <SectionEditor
              title="Per 3m Section"
              hint="Include the tray length itself plus joining plates and joining nuts/bolts for every 3m tray length."
              section="per_section"
              rows={form.per_section}
              onAdd={addRow}
              onUpdate={updateRow}
              onRemove={removeRow}
            />

            <SectionEditor
              title="Per Corner / Bend"
              hint="Use the fitting hardware needed for each counted corner or bend."
              section="per_corner"
              rows={form.per_corner}
              onAdd={addRow}
              onUpdate={updateRow}
              onRemove={removeRow}
            />

            <SectionEditor
              title="Per Tee"
              hint="Optional. Leave blank if you just want the BOM to show a generic tee count."
              section="per_tee"
              rows={form.per_tee}
              onAdd={addRow}
              onUpdate={updateRow}
              onRemove={removeRow}
            />

            <SectionEditor
              title="Per Reducer"
              hint="Optional. Leave blank if you just want the BOM to show a generic reducer count."
              section="per_reducer"
              rows={form.per_reducer}
              onAdd={addRow}
              onUpdate={updateRow}
              onRemove={removeRow}
            />

            <div className="flex gap-3 border-t border-slate-700 pt-4">
              <button onClick={saveForm} className="rounded-lg bg-amber-500 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-400">
                Save Template
              </button>
              <button onClick={closeForm} className="rounded-lg bg-slate-700 px-5 py-3 font-semibold text-white hover:bg-slate-600">
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
