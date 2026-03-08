'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { colourLabelToHex, DEFAULT_TARGET_RUNS } from '@/lib/colours';
import type { Job, TargetRun, TrapezTemplate, TraySystem } from '@/types';

function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_TEMPLATES: TrapezTemplate[] = [
  {
    id: 'tpl_default_nema',
    name: 'NEMA 2 fire rated',
    per_trapeze: [
      { id: 'n_t1', name: 'M12 HKDs', qty: 2, unit: 'each' },
      { id: 'n_t2', name: 'M12 flat washer', qty: 8, unit: 'each' },
      { id: 'n_t3', name: 'M12 hex nut', qty: 6, unit: 'each' },
      { id: 'n_t4', name: 'M12 square washer', qty: 6, unit: 'each' },
      { id: 'n_t5', name: 'M12 30mm bolt', qty: 2, unit: 'each' },
      { id: 'n_t6', name: 'M12 channel nut', qty: 2, unit: 'each' },
      { id: 'n_t7', name: 'M12 threaded rod', qty: 2, unit: 'm' },
      { id: 'n_t8', name: '80x40mm back-to-back unistrut', qty: 0.4, unit: 'm' },
    ],
    per_section: [
      { id: 'n_s1', name: 'NEMA tray 3m length', qty: 1, unit: 'each' },
      { id: 'n_s2', name: 'Joining plates', qty: 2, unit: 'each' },
      { id: 'n_s3', name: 'Joining nuts and bolts', qty: 8, unit: 'each' },
    ],
    per_corner: [
      { id: 'n_c1', name: 'Joining nuts and bolts', qty: 8, unit: 'each' },
    ],
    per_tee: [],
    per_reducer: [],
  },
  {
    id: 'tpl_default_lt3',
    name: 'LT3',
    per_trapeze: [
      { id: 'l_t1', name: 'M10 rod anchors', qty: 2, unit: 'each' },
      { id: 'l_t2', name: 'M10 flat washer', qty: 6, unit: 'each' },
      { id: 'l_t3', name: 'M10 hex nut', qty: 6, unit: 'each' },
      { id: 'l_t4', name: 'M10 30mm bolt', qty: 2, unit: 'each' },
      { id: 'l_t5', name: 'M10 channel nut', qty: 2, unit: 'each' },
      { id: 'l_t6', name: 'LT3 hold downs', qty: 2, unit: 'each' },
      { id: 'l_t7', name: 'M10 threaded rod', qty: 2, unit: 'm' },
      { id: 'l_t8', name: '60x40mm unistrut', qty: 0.5, unit: 'm' },
    ],
    per_section: [
      { id: 'l_s1', name: 'LT3 tray 3m length', qty: 1, unit: 'each' },
      { id: 'l_s2', name: 'Joining plates', qty: 2, unit: 'each' },
      { id: 'l_s3', name: 'Joining nuts and bolts', qty: 8, unit: 'each' },
    ],
    per_corner: [
      { id: 'l_c1', name: 'Joining nuts and bolts', qty: 8, unit: 'each' },
    ],
    per_tee: [],
    per_reducer: [],
  },
];

function createDefaultTargetRuns(): TargetRun[] {
  return DEFAULT_TARGET_RUNS.map((run, index) => ({
    id: `run_${uid()}_${index}`,
    colour_label: run.colour_label,
    display_name: run.display_name,
    template_id: index === 0 ? 'tpl_default_nema' : 'tpl_default_lt3',
  }));
}

function normaliseJob(job: Job): Job {
  const targetRuns = job.target_runs ?? [];
  const systems = (job.systems ?? []).map((system) => {
    const targetRun = targetRuns.find((run) => run.id === system.target_run_id)
      ?? targetRuns.find((run) => run.colour_label.toLowerCase() === (system as TraySystem & { colour?: string }).colour?.toLowerCase());

    return {
      ...system,
      target_run_id: system.target_run_id ?? targetRun?.id,
      colour_label: system.colour_label ?? targetRun?.colour_label ?? (system as TraySystem & { colour?: string }).colour ?? 'Grey',
      colour_hex: system.colour_hex ?? colourLabelToHex(targetRun?.colour_label ?? (system as TraySystem & { colour?: string }).colour ?? 'grey'),
    };
  });

  return {
    ...job,
    target_runs: targetRuns.length > 0 ? targetRuns : createDefaultTargetRuns(),
    systems,
    plan_pages: job.plan_pages ?? [],
  };
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
          target_runs: createDefaultTargetRuns(),
          systems: [],
          plan_pages: [],
        };
        set((s) => ({ jobs: [...s.jobs, job] }));
        return id;
      },

      updateJob(id, partial) {
        set((s) => ({
          jobs: s.jobs.map((job) => (
            job.id === id ? normaliseJob({ ...job, ...partial, updated_at: new Date().toISOString() }) : job
          )),
        }));
      },

      deleteJob(id) {
        set((s) => ({ jobs: s.jobs.filter((job) => job.id !== id) }));
      },

      getJob(id) {
        return get().jobs.find((job) => job.id === id);
      },

      createTemplate(template) {
        const id = `tpl_${uid()}`;
        set((s) => ({ templates: [...s.templates, { ...template, id }] }));
        return id;
      },

      updateTemplate(id, partial) {
        set((s) => ({
          templates: s.templates.map((template) => (
            template.id === id ? { ...template, ...partial } : template
          )),
        }));
      },

      deleteTemplate(id) {
        set((s) => ({ templates: s.templates.filter((template) => template.id !== id) }));
      },

      getTemplate(id) {
        return get().templates.find((template) => template.id === id);
      },
    }),
    {
      name: 'plan2parts-v4',
      merge: (persisted, current) => {
        const persistedStore = persisted as Partial<AppStore> | null;
        const templates = persistedStore?.templates && persistedStore.templates.length > 0
          ? persistedStore.templates.map((template) => ({
              ...template,
              per_tee: template.per_tee ?? [],
              per_reducer: template.per_reducer ?? [],
            }))
          : DEFAULT_TEMPLATES;

        const jobs = (persistedStore?.jobs ?? current.jobs).map(normaliseJob);

        return {
          ...current,
          ...(persistedStore ?? {}),
          templates,
          jobs,
        } satisfies AppStore;
      },
    },
  ),
);
