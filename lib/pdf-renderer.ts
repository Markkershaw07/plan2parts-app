import type { RenderParameters } from 'pdfjs-dist/types/src/display/api';
import type { PlanPage } from '@/types';

const RENDER_SCALE = 2;

export async function renderPDFToPages(file: File, startPageNumber = 1): Promise<PlanPage[]> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: PlanPage[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to create canvas context for PDF rendering.');
    }

    const renderContext: RenderParameters = {
      canvas,
      canvasContext: ctx,
      viewport,
    };

    await page.render(renderContext).promise;

    pages.push({
      page_number: startPageNumber + pageNum - 1,
      image_url: canvas.toDataURL('image/png'),
      width_px: viewport.width,
      height_px: viewport.height,
      rotation_deg: 0,
    });
  }

  return pages;
}
