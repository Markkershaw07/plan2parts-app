'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { renderPDFToPages } from '@/lib/pdf-renderer';
import type { ClaudeAnalysisResult, TraySystem } from '@/types';

function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }

const CONFIDENCE_STYLE: Record<string, string> = {
  high: 'bg-green-900 text-green-300',
  medium: 'bg-amber-900 text-amber-300',
  low: 'bg-red-900 text-red-300',
};

export default function TakeoffPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { jobs, templates, updateJob } = useAppStore();
  const [hydrated, setHydrated] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [result, setResult] = useState<ClaudeAnalysisResult | null>(null);
  const [draft, setDraft] = useState<TraySystem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setHydrated(true); }, []);

  const job = hydrated ? jobs.find((j) => j.id === params.id) : undefined;
  if (!hydrated) return null;
  if (!job) return <div className="p-6 text-slate-400">Job not found.</div>;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      let imageBase64: string;
      let mimeType: string;
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const pages = await renderPDFToPages(file, 1);
        updateJob(params.id, { plan_pages: pages });
        const dataUrl = pages[0]?.image_url ?? '';
        imageBase64 = dataUrl.split(',')[1] ?? '';
        mimeType = 'image/png';
      } else {
        mimeType = file.type || 'image/jpeg';
        const reader = new FileReader();
        imageBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = (ev) => {
            const res = ev.target?.result as string;
            resolve(res.split(',')[1] ?? '');
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const url = URL.createObjectURL(file);
        const img = new Image();
        await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = url; });
        updateJob(params.id, { plan_pages: [{ page_number: 1, image_url: url, width_px: img.naturalWidth, height_px: img.naturalHeight, rotation_deg: 0 }] });
      }
      e.target.value = '';
      setUploading(false);
      await runAnalysis(imageBase64, mimeType);
    } catch (err) {
      setUploadError('Failed to load file. Try a JPG or PNG.');
      setUploading(false);
      console.error(err);
    }
  }

  async function runAnalysis(imageBase64: string, mimeType: string) {
    setAnalysing(true);
    setAnalysisError(null);
    try {
      const res = await fetch('/api/analyse-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data: ClaudeAnalysisResult = await res.json();
      setResult(data);
      const systems: TraySystem[] = data.systems.map((s) => ({
        id: `sys_${uid()}`,
        name: s.description || s.colour,
        colour: '#6b7280',
        template_id: templates[0]?.id ?? '',
        total_length_m: s.total_length_m ?? 0,
        trapeze_count: s.trapeze_count,
        corner_count: s.corner_count,
        tee_count: s.tee_count,
        reducer_count: s.reducer_count,
        confidence: s.confidence,
      }));
      setDraft(systems);
    } catch (err) {
      setAnalysisError('Analysis failed. Check your API key or try again.');
      console.error(err);
    } finally {
      setAnalysing(false);
    }
  }

  function updateDraft(id: string, patch: Partial<TraySystem>) {
    setDraft((d) => d.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function saveToJob() {
    updateJob(params.id, { systems: draft });
    router.push(`/jobs/${params.id}/setup`);
  }

  const hasPages = job.plan_pages.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Plan Analysis</h2>
      </div>

      <div className="rounded-xl bg-slate-800 border border-slate-700 p-6">
        <label className="block cursor-pointer">
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFile} />
          <div className="border-2 border-dashed border-slate-600 hover:border-amber-500 rounded-lg p-10 text-center transition-colors">
            {uploading || analysing ? (
              <p className="text-slate-300">{uploading ? 'Loading plan...' : 'Reading plan with AI...'}</p>
            ) : hasPages ? (
              <p className="text-slate-400 text-sm">Drop a new plan to re-analyse, or scroll down to edit results</p>
            ) : (
              <>
                <p className="text-white font-semibold mb-2">Upload Plan</p>
                <p className="text-slate-400 text-sm">PDF or image (JPG/PNG)</p>
              </>
            )}
          </div>
        </label>
        {uploadError && <p className="text-red-400 text-sm mt-3">{uploadError}</p>}
        {analysisError && <p className="text-red-400 text-sm mt-3">{analysisError}</p>}
      </div>

      {hasPages && job.plan_pages[0] && (
        <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
          <img src={job.plan_pages[0].image_url} alt="Plan" className="w-full object-contain max-h-96" />
        </div>
      )}

      {result && draft.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Detected Systems ({draft.length})</h3>
            <button onClick={saveToJob} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2 px-5 rounded-lg text-sm">
              Save to Job
            </button>
          </div>

          {result.scale_note && (
            <p className="text-sm text-slate-400 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3">
              Scale: {result.scale_note}
            </p>
          )}

          {draft.map((sys) => {
            const raw = result.systems.find((_, i) => draft[i]?.id === sys.id) ?? result.systems[0];
            return (
              <div key={sys.id} className="rounded-xl bg-slate-800 border border-slate-700 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-300 capitalize">{raw?.colour ?? 'unknown'} system</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONFIDENCE_STYLE[sys.confidence]}`}>
                      {sys.confidence}
                    </span>
                  </div>
                  <select value={sys.template_id} onChange={(e) => updateDraft(sys.id, { template_id: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm">
                    <option value="">-- No template --</option>
                    {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">System name</label>
                  <input value={sys.name} onChange={(e) => updateDraft(sys.id, { name: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm w-full" />
                </div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {([['total_length_m','Length (m)',0.5],['trapeze_count','Trapezes',1],['corner_count','Corners',1],['tee_count','Tees',1],['reducer_count','Reducers',1]] as const).map(([field, label, step]) => (
                    <div key={field}>
                      <label className="text-xs text-slate-400 block mb-1">{label}</label>
                      <input type="number" min={0} step={step} value={sys[field]}
                        onChange={(e) => updateDraft(sys.id, { [field]: parseFloat(e.target.value) || 0 })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm w-full" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="flex justify-end pt-2">
            <button onClick={saveToJob} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-3 px-6 rounded-lg">
              Save to Job
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
