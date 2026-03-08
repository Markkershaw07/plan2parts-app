'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { renderPDFToPages } from '@/lib/pdf-renderer';
import { colourLabelToHex } from '@/lib/colours';
import { useHydrated } from '@/lib/use-hydrated';
import type { ClaudeAnalysisResult, TraySystem } from '@/types';

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const CONFIDENCE_STYLE: Record<string, string> = {
  high: 'bg-green-900 text-green-300',
  medium: 'bg-amber-900 text-amber-300',
  low: 'bg-red-900 text-red-300',
};

export default function TakeoffPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { jobs, updateJob } = useAppStore();
  const hydrated = useHydrated();
  const [uploading, setUploading] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [result, setResult] = useState<ClaudeAnalysisResult | null>(null);
  const [draft, setDraft] = useState<TraySystem[]>([]);
  const [ignored, setIgnored] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const job = hydrated ? jobs.find((entry) => entry.id === params.id) : undefined;

  if (!hydrated) return null;
  if (!job) return <div className="p-6 text-slate-400">Job not found.</div>;

  const currentJob = job;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setAnalysisError(null);

    try {
      let imageBase64 = '';
      let mimeType = file.type || 'image/png';

      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const pages = await renderPDFToPages(file, 1);
        updateJob(params.id, { plan_pages: pages });
        imageBase64 = pages[0]?.image_url.split(',')[1] ?? '';
        mimeType = 'image/png';
      } else {
        const reader = new FileReader();
        imageBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = (event) => {
            const value = typeof event.target?.result === 'string' ? event.target.result : '';
            resolve(value.split(',')[1] ?? '');
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const objectUrl = URL.createObjectURL(file);
        const img = document.createElement('img');
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.src = objectUrl;
        });

        updateJob(params.id, {
          plan_pages: [{
            page_number: 1,
            image_url: objectUrl,
            width_px: img.naturalWidth,
            height_px: img.naturalHeight,
            rotation_deg: 0,
          }],
        });
      }

      e.target.value = '';
      setUploading(false);
      await runAnalysis(imageBase64, mimeType);
    } catch (err) {
      setUploading(false);
      setUploadError('Failed to load the plan. Try a PDF, JPG, or PNG.');
      console.error(err);
    }
  }

  async function runAnalysis(imageBase64: string, mimeType: string) {
    if (currentJob.target_runs.some((run) => !run.template_id)) {
      setAnalysisError('Assign a template to every run before uploading the plan.');
      return;
    }

    setAnalysing(true);
    setAnalysisError(null);

    try {
      const res = await fetch('/api/analyse-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType, targetRuns: currentJob.target_runs }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? body.error ?? `API error ${res.status}`);
      }

      const data = await res.json() as ClaudeAnalysisResult;
      setResult(data);
      updateJob(params.id, { analysis_raw: JSON.stringify(data) });

      const systems = data.runs.map((run) => {
        const targetRun = currentJob.target_runs.find((entry) => entry.id === run.target_run_id);
        return {
          id: `sys_${uid()}`,
          target_run_id: run.target_run_id,
          name: run.display_name || targetRun?.display_name || `${run.colour_label} run`,
          colour_label: run.colour_label,
          colour_hex: colourLabelToHex(run.colour_label),
          template_id: targetRun?.template_id ?? '',
          total_length_m: run.total_length_m ?? 0,
          trapeze_count: run.trapeze_count,
          corner_count: run.corner_count,
          tee_count: run.tee_count,
          reducer_count: run.reducer_count,
          confidence: run.confidence,
        } satisfies TraySystem;
      });

      setDraft(systems);
      setIgnored(new Set());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setAnalysisError(`Analysis failed: ${message}`);
      console.error(err);
    } finally {
      setAnalysing(false);
    }
  }

  function updateDraft(id: string, patch: Partial<TraySystem>) {
    setDraft((current) => current.map((system) => (system.id === id ? { ...system, ...patch } : system)));
  }

  function toggleIgnore(id: string) {
    setIgnored((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function saveToJob() {
    updateJob(params.id, {
      systems: draft.filter((system) => !ignored.has(system.id)),
      reviewed_at: new Date().toISOString(),
    });
    router.push(`/jobs/${params.id}/bom`);
  }

  const hasPages = currentJob.plan_pages.length > 0;
  const scaleWarning = result && !result.has_scale;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Plan Review</h2>
          <p className="mt-1 text-sm text-slate-400">Upload the marked-up plan, let AI read Stu&apos;s chosen runs, then confirm the counts before the BOM is built.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
          <label className="block cursor-pointer">
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFile} />
            <div className="rounded-lg border-2 border-dashed border-slate-600 p-10 text-center transition-colors hover:border-amber-500">
              {uploading || analysing ? (
                <p className="text-slate-300">{uploading ? 'Loading plan...' : 'Reading selected runs with AI...'}</p>
              ) : hasPages ? (
                <>
                  <p className="font-semibold text-white">Upload a new plan to re-run analysis</p>
                  <p className="mt-2 text-sm text-slate-400">Only the configured run colours will be analysed.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-white">Upload plan</p>
                  <p className="mt-2 text-sm text-slate-400">PDF or image of the marked-up drawing</p>
                </>
              )}
            </div>
          </label>

          <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Runs included in this analysis</p>
            <div className="mt-3 space-y-2">
              {currentJob.target_runs.map((run) => (
                <div key={run.id} className="flex items-center justify-between text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colourLabelToHex(run.colour_label) }} />
                    <span>{run.display_name?.trim() || `${run.colour_label} run`}</span>
                  </div>
                  <span className="text-slate-500">
                    {run.template_id ? 'Template linked' : 'Template missing'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {uploadError ? <p className="mt-3 text-sm text-red-400">{uploadError}</p> : null}
          {analysisError ? <p className="mt-3 text-sm text-red-400">{analysisError}</p> : null}
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          {hasPages && currentJob.plan_pages[0] ? (
            <Image
              src={currentJob.plan_pages[0].image_url}
              alt="Uploaded plan"
              width={currentJob.plan_pages[0].width_px}
              height={currentJob.plan_pages[0].height_px}
              unoptimized
              className="max-h-[34rem] w-full rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-full min-h-72 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-sm text-slate-500">
              Plan preview will appear here after upload.
            </div>
          )}
        </section>
      </div>

      {result && draft.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-white">Review detected runs</h3>
              <p className="text-sm text-slate-400">Edit anything the AI got wrong, then confirm the BOM.</p>
            </div>
            <button onClick={saveToJob} className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400">
              Confirm and View BOM
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className={`rounded-lg border px-4 py-3 text-sm ${scaleWarning ? 'border-amber-500 bg-amber-950/40 text-amber-200' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>
              <p className="font-semibold">Scale</p>
              <p className="mt-1">{result.scale_note || 'No scale note returned.'}</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-300">
              <p className="font-semibold">AI notes</p>
              <p className="mt-1">{result.notes || 'No extra notes.'}</p>
            </div>
          </div>

          {draft.map((system, index) => {
            const analysedRun = result.runs[index];
            const warning = system.confidence === 'low' || analysedRun?.total_length_m == null;

            return (
              <div key={system.id} className={`space-y-4 rounded-xl border border-slate-700 bg-slate-800 p-5 ${ignored.has(system.id) ? 'opacity-45' : ''}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: system.colour_hex }} />
                    <div>
                      <p className="font-semibold text-white">{system.name}</p>
                      <p className="text-sm text-slate-400">{system.colour_label} run</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONFIDENCE_STYLE[system.confidence]}`}>
                      {system.confidence}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleIgnore(system.id)}
                    className={`rounded px-3 py-1 text-xs ${ignored.has(system.id) ? 'bg-slate-700 text-slate-400' : 'bg-slate-900 text-white'}`}
                  >
                    {ignored.has(system.id) ? 'Ignored' : 'Include'}
                  </button>
                </div>

                {warning ? (
                  <p className="rounded-lg border border-amber-500 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
                    Review carefully. {analysedRun?.total_length_m == null ? 'Length could not be read from the scale and may need manual entry. ' : ''}
                    {analysedRun?.notes || 'AI returned a low-confidence read.'}
                  </p>
                ) : analysedRun?.notes ? (
                  <p className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-400">
                    {analysedRun.notes}
                  </p>
                ) : null}

                <div>
                  <label className="mb-1 block text-xs text-slate-400">Run name</label>
                  <input
                    value={system.name}
                    onChange={(e) => updateDraft(system.id, { name: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  {([
                    ['total_length_m', 'Length (m)', 0.5],
                    ['trapeze_count', 'Trapezes', 1],
                    ['corner_count', 'Corners', 1],
                    ['tee_count', 'Tees', 1],
                    ['reducer_count', 'Reducers', 1],
                  ] as const).map(([field, label, step]) => (
                    <div key={field}>
                      <label className="mb-1 block text-xs text-slate-400">{label}</label>
                      <input
                        type="number"
                        min={0}
                        step={step}
                        value={system[field]}
                        onChange={(e) => updateDraft(system.id, { [field]: Number(e.target.value) || 0 } as Partial<TraySystem>)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
