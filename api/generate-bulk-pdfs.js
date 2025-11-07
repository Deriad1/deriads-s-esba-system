import { PDFDocument } from 'pdf-lib';

/**
 * Vercel Serverless Function for Server-Side Bulk PDF Generation
 *
 * This endpoint accepts student report data and generates a combined PDF document.
 *
 * Benefits of server-side PDF generation:
 * - Better quality (no image conversion)
 * - Better performance (no browser limitations)
 * - Reduced client memory usage
 * - More reliable for large batches
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { pdfDataArray } = req.body;

    console.log(`[generate-bulk-pdfs] Received request with ${pdfDataArray?.length || 0} PDFs`);

    // Validate input
    if (!pdfDataArray || !Array.isArray(pdfDataArray) || pdfDataArray.length === 0) {
      console.error('[generate-bulk-pdfs] Invalid input - not an array or empty');
      return res.status(400).json({
        success: false,
        message: 'Invalid request. Expected an array of PDF data.'
      });
    }

    // Create a new PDF document for the merged result
    const mergedPdf = await PDFDocument.create();
    console.log('[generate-bulk-pdfs] Created new PDF document for merging');

    // Process each PDF
    for (let i = 0; i < pdfDataArray.length; i++) {
      const pdfData = pdfDataArray[i];
      try {
        console.log(`[generate-bulk-pdfs] Processing PDF ${i + 1}/${pdfDataArray.length}, size: ${pdfData.length} chars`);

        // pdfData should be base64 encoded PDF string
        const pdfBytes = Buffer.from(pdfData, 'base64');
        console.log(`[generate-bulk-pdfs] Decoded PDF ${i + 1} to ${pdfBytes.length} bytes`);

        // Load the PDF document
        const pdf = await PDFDocument.load(pdfBytes);
        console.log(`[generate-bulk-pdfs] Loaded PDF ${i + 1}, pages: ${pdf.getPageCount()}`);

        // Copy all pages from this PDF to the merged PDF
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
        console.log(`[generate-bulk-pdfs] Added ${copiedPages.length} pages from PDF ${i + 1}`);
      } catch (pageError) {
        console.error(`[generate-bulk-pdfs] Error processing PDF ${i + 1}:`, pageError);
        console.error(`[generate-bulk-pdfs] Error stack:`, pageError.stack);
        // Continue with other PDFs even if one fails
      }
    }

    // Serialize the merged PDF to bytes
    console.log(`[generate-bulk-pdfs] Saving merged PDF with ${mergedPdf.getPageCount()} total pages`);
    const mergedPdfBytes = await mergedPdf.save();
    console.log(`[generate-bulk-pdfs] Merged PDF saved, size: ${mergedPdfBytes.length} bytes`);

    // Convert to base64 for transfer
    const mergedPdfBase64 = Buffer.from(mergedPdfBytes).toString('base64');
    console.log(`[generate-bulk-pdfs] Converted to base64, size: ${mergedPdfBase64.length} chars`);

    // Return the merged PDF
    console.log(`[generate-bulk-pdfs] Successfully merged ${pdfDataArray.length} PDFs into ${mergedPdf.getPageCount()} pages`);
    return res.status(200).json({
      success: true,
      message: `Successfully merged ${pdfDataArray.length} PDFs`,
      pdfData: mergedPdfBase64,
      pageCount: mergedPdf.getPageCount()
    });

  } catch (error) {
    console.error('[generate-bulk-pdfs] Server-side PDF generation error:', error);
    console.error('[generate-bulk-pdfs] Error stack:', error.stack);
    console.error('[generate-bulk-pdfs] Error name:', error.name);
    console.error('[generate-bulk-pdfs] Error message:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate PDF on server',
      error: error.message,
      errorName: error.name
    });
  }
}

/**
 * Configuration for Vercel serverless function
 * Increase timeout and memory limits for large PDF operations
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Allow up to 50MB request size for PDF data
    },
    responseLimit: '50mb', // Allow up to 50MB response size
  },
  maxDuration: 60, // 60 seconds timeout (for large batches)
};
