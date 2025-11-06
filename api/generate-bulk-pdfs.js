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

    // Validate input
    if (!pdfDataArray || !Array.isArray(pdfDataArray) || pdfDataArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request. Expected an array of PDF data.'
      });
    }

    // Create a new PDF document for the merged result
    const mergedPdf = await PDFDocument.create();

    // Process each PDF
    for (const pdfData of pdfDataArray) {
      try {
        // pdfData should be base64 encoded PDF string
        const pdfBytes = Buffer.from(pdfData, 'base64');

        // Load the PDF document
        const pdf = await PDFDocument.load(pdfBytes);

        // Copy all pages from this PDF to the merged PDF
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      } catch (pageError) {
        console.error('Error processing individual PDF:', pageError);
        // Continue with other PDFs even if one fails
      }
    }

    // Serialize the merged PDF to bytes
    const mergedPdfBytes = await mergedPdf.save();

    // Convert to base64 for transfer
    const mergedPdfBase64 = Buffer.from(mergedPdfBytes).toString('base64');

    // Return the merged PDF
    return res.status(200).json({
      success: true,
      message: `Successfully merged ${pdfDataArray.length} PDFs`,
      pdfData: mergedPdfBase64,
      pageCount: mergedPdf.getPageCount()
    });

  } catch (error) {
    console.error('Server-side PDF generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate PDF on server',
      error: error.message
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
