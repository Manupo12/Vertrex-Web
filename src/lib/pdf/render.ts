import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function renderPdf(html: string, data: any): Promise<Uint8Array> {
  // En V3.0 usamos pdf-lib básico dado el requirement técnico
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const fontSize = 12;

  // Extraer texto muy simplificado del HTML para el PDF generado
  const textContent = html.replace(/<[^>]*>?/gm, "\n").replace(/\n+/g, "\n").trim();
  const lines = textContent.split("\n");

  let y = height - 4 * fontSize;
  for (const line of lines) {
    if (y < 40) {
      // Nueva página simplificada si llegamos abajo
      break;
    }
    page.drawText(line.substring(0, 100), {
      x: 50,
      y,
      size: fontSize,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
    y -= fontSize * 1.5;
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
