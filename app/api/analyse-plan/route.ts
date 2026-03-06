import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'imageBase64 and mimeType are required' }, { status: 400 });
    }

    const prompt = `You are analysing an electrical cable containment plan drawing.

Identify every cable tray or conduit run system visible. For each distinct system (usually distinguished by colour, label, or line style), extract:
- colour: the colour name used on the plan (e.g. "red", "blue", "green")
- description: brief description of the run
- total_length_m: estimated total run length in metres (null if no scale available)
- trapeze_count: number of trapeze/hanger support points visible
- corner_count: number of 90-degree corners/bends
- tee_count: number of tee junctions
- reducer_count: number of reducers
- confidence: "high", "medium", or "low" based on plan clarity

Also note whether the plan has a scale bar and any other relevant notes.

Respond ONLY with valid JSON matching this exact structure:
{
  "has_scale": boolean,
  "scale_note": "string describing scale if present, or empty string",
  "systems": [
    {
      "colour": "string",
      "description": "string",
      "total_length_m": number or null,
      "trapeze_count": number,
      "corner_count": number,
      "tee_count": number,
      "reducer_count": number,
      "confidence": "high" | "medium" | "low"
    }
  ],
  "notes": "any other relevant observations"
}`;

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const result = JSON.parse(cleaned);

    return NextResponse.json(result);
  } catch (err) {
    console.error('analyse-plan error:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
