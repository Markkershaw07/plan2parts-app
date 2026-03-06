'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Job, TraySystem, PlanPage, TrapezTemplate } from '@/types';

function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

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
      templates: [],

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
    { name: 'plan2parts-v3' },
  ),
);
