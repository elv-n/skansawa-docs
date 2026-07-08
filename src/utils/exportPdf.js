/**
 * EduDocs — PDF Export Utility
 * Uses jsPDF + html2canvas for direct PDF generation.
 * F4 size: 210mm × 330mm (portrait), 330mm × 210mm (landscape)
 */

/**
 * Generate PDF from HTML strings and trigger download.
 * @param {string|string[]} htmlContent - Single HTML string or array of HTML strings
 * @param {Object} options - Options: { landscape, filename, onProgress }
 */
export async function downloadPDF(htmlContent, options = {}) {
  const pages = Array.isArray(htmlContent) ? htmlContent : [htmlContent];
  const isLandscape = options.landscape === true;
  
  // F4 paper size in mm
  const pageWidth = isLandscape ? 330 : 210;
  const pageHeight = isLandscape ? 210 : 330;
  const padding = isLandscape ? 10 : 15; // mm

  const pdfFilename = options.filename || 'dokumen-edudocs.pdf';
  const onProgress = options.onProgress || (() => {});

  // Create a temporary container for PDF generation (off-screen)
  const pdfContainer = document.createElement('div');
  pdfContainer.style.position = 'absolute';
  pdfContainer.style.left = '-9999px';
  pdfContainer.style.top = '0';
  document.body.appendChild(pdfContainer);

  if (isLandscape) {
    document.body.classList.add('print-landscape');
  }

  // Build all page elements at once
  pages.forEach((pageHtml) => {
    const pageEl = document.createElement('div');
    pageEl.className = 'pdf-page-render';
    pageEl.style.width = `${pageWidth - (padding * 2)}mm`;
    pageEl.style.padding = '0';
    pageEl.style.margin = '0';
    pageEl.style.background = 'white';
    pageEl.style.boxSizing = 'border-box';
    pageEl.innerHTML = pageHtml;
    pdfContainer.appendChild(pageEl);
  });

  // Import dependencies once
  const { jsPDF } = await import('jspdf');
  const html2canvasLib = (await import('html2canvas')).default;

  try {
    const pdf = new jsPDF({
      unit: 'mm',
      format: [pageWidth, pageHeight],
      orientation: isLandscape ? 'landscape' : 'portrait',
    });

    const contentWidth = pageWidth - (padding * 2);
    const contentHeight = pageHeight - (padding * 2);
    const pageElements = pdfContainer.querySelectorAll('.pdf-page-render');
    const total = pageElements.length;

    for (let i = 0; i < total; i++) {
      if (i > 0) pdf.addPage([pageWidth, pageHeight], isLandscape ? 'landscape' : 'portrait');

      onProgress(i + 1, total);

      const canvas = await html2canvasLib(pageElements[i], {
        scale: 3.5, // Higher scale = crisp text and high res PDF
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(imgData, 'JPEG', padding, padding, contentWidth, contentHeight);
    }

    pdf.save(pdfFilename);
  } finally {
    pdfContainer.remove();
    document.body.classList.remove('print-landscape');
  }
}
