/**
 * Plan2Parts — PDF Renderer
 * Uses PDF.js to render each page of a PDF to a canvas data URL.
 * Runs client-side only.
 */

import type { PlanPage } from '@/types';

/** Scale factor for rendering — 2x gives crisp display on retina screens */
const RENDER_SCALE = 2;

export async function renderPDFToPages(
  file: File,
  startPageNumber = 1,
): Promise<PlanPage[]> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: PlanPage[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: RENDER_SCALE });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    await page.render({ canvasContext: ctx as any, canvas, viewport }).promise;

    const dataUrl = canvas.toDataURL('image/png');

    pages.push({
      page_number: startPageNumber + pageNum - 1,
      image_url: dataUrl,
      width_px: viewport.width,
      height_px: viewport.height,
      rotation_deg: 0,
    });
  }

  return pages;
}
