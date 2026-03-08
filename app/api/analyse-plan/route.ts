import { NextRequest, NextResponse } from 'next/server';
import type { ClaudeAnalysisResult, TargetRun } from '@/types';

interface AnalysePlanRequest {
  imageBase64?: string;
  mimeType?: string;
  targetRuns?: TargetRun[];
}

interface OpenAIResponse {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
}

function buildPrompt(targetRuns: TargetRun[]) {
  const runInstructions = targetRuns.map((run) => {
    const name = run.display_name?.trim() || `${run.colour_label} run`;
    return `- target_run_id: ${run.id}\n  colour_label: ${run.colour_label}\n  display_name: ${name}`;
  }).join('\n');

  return `You are analysing an electrical cable containment plan drawing for an electrician.

Only analyse the selected coloured runs listed below. Ignore all other services, annotations, and unrelated coloured markups.

Selected runs:
${runInstructions}

For each selected run, estimate:
- total_length_m: total run length in metres using the drawing scale if visible
- trapeze_count: visible trapeze / hanger support count
- corner_count: visible 90-degree corners or bends
- tee_count: visible tee junctions
- reducer_count: visible reducers
- confidence: high, medium, or low
- notes: short notes about anything uncertain or assumed

Also report whether a readable scale is visible and add a short scale_note.

Return only valid JSON in this exact structure:
{
  "has_scale": true,
  "scale_note": "string",
  "runs": [
    {
      "target_run_id": "string",
      "colour_label": "string",
      "display_name": "string",
      "total_length_m": 0,
      "trapeze_count": 0,
      "corner_count": 0,
      "tee_count": 0,
      "reducer_count": 0,
      "confidence": "high",
      "notes": "string"
    }
  ],
  "notes": "string"
}

Important rules:
- Return one object for every selected run, even if confidence is low.
- If the scale cannot be read, set total_length_m to null and explain why in notes or scale_note.
- Do not invent extra runs.
- Keep display_name aligned to the selected run.`;
}

function extractResponseText(payload: OpenAIResponse): string {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === 'output_text' && typeof content.text === 'string' && content.text.trim()) {
        return content.text.trim();
      }
    }
  }

  return '';
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, targetRuns } = await req.json() as AnalysePlanRequest;

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'imageBase64 and mimeType are required' }, { status: 400 });
    }

    if (!targetRuns || targetRuns.length === 0) {
      return NextResponse.json({ error: 'At least one target run is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `${buildPrompt(targetRuns)}\n\nRespond with JSON only.`,
              },
              {
                type: 'input_image',
                image_url: `data:${mimeType};base64,${imageBase64}`,
                detail: 'high',
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_object',
          },
        },
        max_output_tokens: 2000,
      }),
    });

    const payload = await response.json() as OpenAIResponse;

    if (!response.ok) {
      throw new Error(payload.error?.message ?? `OpenAI API error ${response.status}`);
    }

    const text = extractResponseText(payload);
    if (!text) {
      throw new Error('OpenAI returned no text output.');
    }

    const parsed = JSON.parse(text) as ClaudeAnalysisResult;

    const result: ClaudeAnalysisResult = {
      has_scale: parsed.has_scale ?? false,
      scale_note: parsed.scale_note ?? '',
      notes: parsed.notes ?? '',
      runs: targetRuns.map((run) => {
        const found = parsed.runs?.find((entry) => entry.target_run_id === run.id)
          ?? parsed.runs?.find((entry) => entry.colour_label?.toLowerCase() === run.colour_label.toLowerCase());

        return {
          target_run_id: run.id,
          colour_label: run.colour_label,
          display_name: found?.display_name?.trim() || run.display_name?.trim() || `${run.colour_label} run`,
          total_length_m: typeof found?.total_length_m === 'number' ? found.total_length_m : null,
          trapeze_count: found?.trapeze_count ?? 0,
          corner_count: found?.corner_count ?? 0,
          tee_count: found?.tee_count ?? 0,
          reducer_count: found?.reducer_count ?? 0,
          confidence: found?.confidence ?? 'low',
          notes: found?.notes ?? '',
        };
      }),
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('analyse-plan error:', message);
    return NextResponse.json({ error: 'Analysis failed', detail: message }, { status: 500 });
  }
}
