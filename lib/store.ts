'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Job, TraySystem, PlanPage, TrapezTemplate } from '@/types';

function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_TEMPLATES: TrapezTemplate[] = [
  {
    id: 'tpl_default_nema',
    name: 'Nema Tray - Orange',
    per_trapeze: [
      { id: 'n_t1', name: 'M12 HKDs',                   qty: 2,   unit: 'each' },
      { id: 'n_t2', name: 'M12 flat washer',             qty: 8,   unit: 'each' },
      { id: 'n_t3', name: 'M12 hex nut',                 qty: 6,   unit: 'each' },
      { id: 'n_t4', name: 'M12 square washer',           qty: 6,   unit: 'each' },
      { id: 'n_t5', name: 'M12 30mm bolt',               qty: 2,   unit: 'each' },
      { id: 'n_t6', name: 'M12 channel nut',             qty: 2,   unit: 'each' },
      { id: 'n_t7', name: 'M12 threaded rod',            qty: 2,   unit: 'm'    },
      { id: 'n_t8', name: '80x40mm back-to-back unistrut', qty: 0.4, unit: 'm' },
    ],
    per_section: [
      { id: 'n_s1', name: 'Nema cable tray 3m',          qty: 1,   unit: 'each' },
      { id: 'n_s2', name: 'Joining plates',              qty: 2,   unit: 'each' },
      { id: 'n_s3', name: 'Joining nuts and bolts',      qty: 8,   unit: 'each' },
    ],
    per_corner: [
      { id: 'n_c1', name: 'Joining nuts and bolts',      qty: 8,   unit: 'each' },
    ],
  },
  {
    id: 'tpl_default_lt3',
    name: 'LT3 - Pink',
    per_trapeze: [
      { id: 'l_t1', name: 'M10 rod anchors',             qty: 2,   unit: 'each' },
      { id: 'l_t2', name: 'M10 flat washer',             qty: 6,   unit: 'each' },
      { id: 'l_t3', name: 'M10 hex nut',                 qty: 6,   unit: 'each' },
      { id: 'l_t4', name: 'M10 30mm bolt',               qty: 2,   unit: 'each' },
      { id: 'l_t5', name: 'M10 channel nut',             qty: 2,   unit: 'each' },
      { id: 'l_t6', name: 'LT3 hold downs',              qty: 2,   unit: 'each' },
      { id: 'l_t7', name: 'M10 threaded rod',            qty: 2,   unit: 'm'    },
      { id: 'l_t8', name: '60x40mm unistrut',            qty: 0.5, unit: 'm'    },
    ],
    per_section: [
      { id: 'l_s1', name: 'LT3 cable tray 3m',           qty: 1,   unit: 'each' },
      { id: 'l_s2', name: 'Joining plates',              qty: 2,   unit: 'each' },
      { id: 'l_s3', name: 'Joining nuts and bolts',      qty: 8,   unit: 'each' },
    ],
    per_corner: [
      { id: 'l_c1', name: 'Joining nuts and bolts',      qty: 8,   unit: 'each' },
    ],
  },
];

interface AppStore {
  jobs: Job[];
  templates: TrapezTemplate[];

  createJob: (name: string, site: string) => string;
  updateJob: (id: string, partial: Partial<Omit<Job, 'id'>>) => void;
  deleteJob: (id: string) => void;
  getJob: (id: string) => Job | undefined;

  createTemplate: (template: Omit<TrapezTemplate, 'id'>) => string;
  updateTemplate: (id: string, partial: Partial<Omit<TrapezTemplate, 'id'>>) => void;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => TrapezTemplate | undefined;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      jobs: [],
      templates: DEFAULT_TEMPLATES,

      createJob(name, site) {
        const id = `job_${uid()}`;
        const now = new Date().toISOString();
        const job: Job = {
          id,
          name,
          site,
          created_at: now,
          updated_at: now,
          systems: [],
          plan_pages: [],
        };
        set((s) => ({ jobs: [...s.jobs, job] }));
        return id;
      },

      updateJob(id, partial) {
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === id ? { ...j, ...partial, updated_at: new Date().toISOString() } : j,
          ),
        }));
      },

      deleteJob(id) {
        set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) }));
      },

      getJob(id) {
        return get().jobs.find((j) => j.id === id);
      },

      createTemplate(template) {
        const id = `tpl_${uid()}`;
        set((s) => ({ templates: [...s.templates, { ...template, id }] }));
        return id;
      },

      updateTemplate(id, partial) {
        set((s) => ({
          templates: s.templates.map((t) => (t.id === id ? { ...t, ...partial } : t)),
        }));
      },

      deleteTemplate(id) {
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
      },

      getTemplate(id) {
        return get().templates.find((t) => t.id === id);
      },
    }),
    {
      name: 'plan2parts-v3',
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<AppStore> | null;
        return {
          ...current,
          ...(p ?? {}),
          // Seed defaults if no templates have been saved yet
          templates: (p?.templates && p.templates.length > 0) ? p.templates : DEFAULT_TEMPLATES,
        };
      },
    },
  ),
);
