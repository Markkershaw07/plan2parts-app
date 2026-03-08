'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { colourLabelToHex } from '@/lib/colours';
import { useHydrated } from '@/lib/use-hydrated';
import type { TargetRun } from '@/types';

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const COMMON_COLOURS = ['Orange', 'Pink', 'Red', 'Blue', 'Green', 'Yellow', 'Purple'];

export default function SetupPage() {
  const params = useParams<{ id: string }>();
  const { jobs, templates, updateJob } = useAppStore();
  const hydrated = useHydrated();

  const job = hydrated ? jobs.find((entry) => entry.id === params.id) : undefined;

  if (!hydrated) return null;
  if (!job) return <div className="p-6 text-slate-400">Job not found.</div>;

  const currentJob = job;

  function updateRun(runId: string, patch: Partial<TargetRun>) {
    updateJob(params.id, {
      target_runs: currentJob.target_runs.map((run) => (run.id === runId ? { ...run, ...patch } : run)),
    });
  }

  function addRun() {
    updateJob(params.id, {
      target_runs: [
        ...currentJob.target_runs,
        {
          id: `run_${uid()}`,
          colour_label: 'Orange',
          display_name: '',
          template_id: templates[0]?.id ?? '',
        },
      ],
    });
  }

  function removeRun(runId: string) {
    if (currentJob.target_runs.length <= 1) return;
    updateJob(params.id, {
      target_runs: currentJob.target_runs.filter((run) => run.id !== runId),
      systems: currentJob.systems.filter((system) => system.target_run_id !== runId),
    });
  }

  const readyForAnalysis = currentJob.target_runs.every((run) => run.template_id);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Runs for this job</h2>
            <p className="mt-1 text-sm text-slate-400">
              Tell the app which coloured tray runs belong to Stu and which template each one should use.
            </p>
          </div>
          <button onClick={addRun} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400">
            + Add run
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {currentJob.target_runs.map((run, index) => {
            const hex = colourLabelToHex(run.colour_label);
            return (
              <div key={run.id} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: hex }} />
                    <div>
                      <p className="font-semibold text-white">Run {index + 1}</p>
                      <p className="text-sm text-slate-400">This is the colour the AI will isolate on the drawing.</p>
                    </div>
                  </div>
                  {currentJob.target_runs.length > 1 ? (
                    <button onClick={() => removeRun(run.id)} className="text-sm text-slate-500 hover:text-red-400">
                      Remove
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-wider text-slate-400">Colour</label>
                    <input
                      list={`colours-${run.id}`}
                      value={run.colour_label}
                      onChange={(e) => updateRun(run.id, { colour_label: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                    />
                    <datalist id={`colours-${run.id}`}>
                      {COMMON_COLOURS.map((colour) => <option key={colour} value={colour} />)}
                    </datalist>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-wider text-slate-400">Run name</label>
                    <input
                      value={run.display_name ?? ''}
                      onChange={(e) => updateRun(run.id, { display_name: e.target.value })}
                      placeholder={`${run.colour_label} run`}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-wider text-slate-400">Template</label>
                    <select
                      value={run.template_id}
                      onChange={(e) => updateRun(run.id, { template_id: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                    >
                      <option value="">Select template</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h3 className="font-semibold text-white">What happens next</h3>
        <p className="mt-2 text-sm text-slate-400">
          Upload the marked-up plan in the next tab. The AI will read only these selected colours, estimate length from the scale,
          count supports and fittings, and then you can review everything before the BOM is generated.
        </p>

        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            {readyForAnalysis ? 'All runs are ready for analysis.' : 'Assign a template to each run before uploading the plan.'}
          </p>
          <Link
            href={`/jobs/${params.id}/takeoff`}
            className={`rounded-lg px-5 py-3 font-semibold ${
              readyForAnalysis ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'pointer-events-none bg-slate-700 text-slate-400'
            }`}
          >
            Continue to Plan Review
          </Link>
        </div>
      </section>
    </div>
  );
}
