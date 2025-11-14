import {
  generateStudentReportPDF,
  generateSubjectBroadsheetPDF,
  generateCompleteClassBroadsheetPDF,
  combinePDFs
} from "../utils/enhancedPdfGenerator";
import { getStudentReportData, getTeachers, getFormMasterRemarks, getMarks, getClassBroadsheet } from '../api-client';
import { calculateRemark } from '../utils/gradeHelpers';



/**
 * Printing Service for the School Management System
 * Handles all printing functionality for student reports, class broadsheets, etc.
 */

class PrintingService {
  /**
   * Generate and download a student report PDF
   * @param {Object} student - Student data
   * @param {String} term - Term for the report
   * @param {Object} schoolInfo - School information
   * @param {Object} formMasterInfo - Form master remarks and attendance
   */
  async printStudentReport(student, term, schoolInfo, formMasterInfo = {}) {
    try {
      // Get formatted student data with positions
      const { subjectsData, remarksInfo } = await this._getFormattedStudentData(student, term, formMasterInfo);

      // Generate PDF with remarks
      const pdf = generateStudentReportPDF(student, subjectsData, schoolInfo, remarksInfo);

      // Download PDF
      pdf.save(`report_${student.firstName}_${student.lastName}_${term}.pdf`);

      return { success: true, message: "Student report generated successfully" };
    } catch (error) {
      console.error("Error generating student report:", error);
      return { success: false, message: "Failed to generate student report: " + error.message };
    }
  }
  
  /**
   * Generate and download reports for multiple students (Bulk Print)
   * @param {Array} students - Array of student objects
   * @param {String} term - Term for the reports
   * @param {Object} schoolInfo - School information
   * @param {Function} progressCallback - Optional callback for progress updates
   * @param {Boolean} combineIntoOne - Whether to combine all reports into one PDF file
   */
  async printBulkStudentReports(students, term, schoolInfo, progressCallback = null, combineIntoOne = true) {
    try {
      const totalStudents = students.length;
      const generatedPDFs = [];

      if (totalStudents === 0) {
        return { success: false, message: "No students to generate reports for" };
      }

      // ✅ OPTIMIZATION: Batch-fetch all student data to avoid timeout
      console.log(`Fetching data for ${totalStudents} students in batches...`);
      const allStudentData = {};

      // Process in batches of 5 to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < students.length; i += batchSize) {
        const batch = students.slice(i, Math.min(i + batchSize, students.length));

        const batchPromises = batch.map(student =>
          getStudentReportData(student.idNumber || student.id_number, term)
            .then(data => ({
              studentId: student.idNumber || student.id_number,
              marksData: data
            }))
            .catch(err => {
              console.warn(`Failed to fetch marks for student ${student.idNumber || student.id_number}:`, err);
              return {
                studentId: student.idNumber || student.id_number,
                marksData: { status: 'error', data: [] }
              };
            })
        );

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(result => {
          allStudentData[result.studentId] = result.marksData;
        });

        // Update progress for data fetching (0-15%)
        if (progressCallback) {
          const fetchProgress = Math.round(((i + batch.length) / totalStudents) * 15);
          progressCallback(fetchProgress);
        }
      }

      // Fetch broadsheet data ONCE for position calculations (all students in same class)
      const className = students[0]?.className || students[0]?.class_name;
      let broadsheetData = null;
      try {
        console.log(`Fetching broadsheet data for class ${className}...`);
        broadsheetData = await getClassBroadsheet(className);
        if (progressCallback) {
          progressCallback(18); // 15-20% for broadsheet fetch
        }
      } catch (error) {
        console.warn('Could not fetch broadsheet for position calculation:', error);
      }

      // Generate PDF for each student using cached data
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const studentId = student.idNumber || student.id_number;

        // Get marks data from cache
        const reportData = allStudentData[studentId] || { status: 'success', data: [] };

        // Fetch form master remarks (can't easily batch this)
        let remarksInfo = {};
        try {
          const remarksResponse = await getFormMasterRemarks(
            studentId,
            student.className || student.class_name
          );
          remarksInfo = remarksResponse.data ? {
            remarks: remarksResponse.data.remarks || '',
            attitude: remarksResponse.data.attitude || '',
            interest: remarksResponse.data.interest || '',
            comments: remarksResponse.data.comments || '',
            attendance: {
              present: remarksResponse.data.attendance || 0,
              total: remarksResponse.data.attendance_total || remarksResponse.data.attendanceTotal || 0
            }
          } : {};
        } catch (error) {
          console.warn(`Could not fetch remarks for student ${studentId}:`, error);
        }

        // Format subjects data with position calculations
        const subjectsData = (reportData.data || []).map(score => {
          const test1 = parseFloat(score.test1) || 0;
          const test2 = parseFloat(score.test2) || 0;
          const test3 = parseFloat(score.test3) || 0;
          const test4 = parseFloat(score.test4) || 0;
          const testsTotal = test1 + test2 + test3 + test4;
          const classScore = testsTotal > 0
            ? (testsTotal / 60) * 50
            : ((parseFloat(score.ca1) || 0) + (parseFloat(score.ca2) || 0));

          const total = parseFloat(score.total) || 0;

          // Calculate subject-specific position
          let position = "-";
          if (broadsheetData && broadsheetData.status === 'success') {
            position = this.calculatePosition(
              score.subject,
              total,
              studentId,
              broadsheetData.data
            );
          }

          return {
            name: score.subject,
            cscore: classScore.toFixed(1),
            exam: parseFloat(score.exam) || 0,
            total,
            position,
            remark: this.getRemarks(total)
          };
        });

        // Calculate overall class position
        let overallPosition = '-';
        if (broadsheetData && broadsheetData.status === 'success') {
          const allStudents = broadsheetData.data.students || [];

          // Calculate total marks for each student across all subjects
          const studentTotals = allStudents.map(s => {
            const studentScores = broadsheetData.data.scores?.filter(score =>
              score.student_id === s.id
            ) || [];

            const totalMarks = studentScores.reduce((sum, score) => {
              return sum + (parseFloat(score.total) || 0);
            }, 0);

            return {
              studentId: s.id,
              idNumber: s.id_number,
              totalMarks
            };
          });

          // Sort by total marks (descending) to determine positions
          studentTotals.sort((a, b) => b.totalMarks - a.totalMarks);

          // Find this student's position
          const studentIndex = studentTotals.findIndex(s => s.idNumber === studentId);
          if (studentIndex !== -1) {
            overallPosition = this._formatPosition(studentIndex + 1);
          }
        }

        // Add total students count and overall position
        remarksInfo.totalStudents = totalStudents;
        remarksInfo.overallPosition = overallPosition;

        // Generate PDF
        const pdf = generateStudentReportPDF(student, subjectsData, schoolInfo, remarksInfo);

        if (combineIntoOne) {
          generatedPDFs.push(pdf);
        } else {
          pdf.save(`report_${student.firstName}_${student.lastName}_${term}.pdf`);
        }

        // Update progress (20-100%)
        if (progressCallback) {
          const genProgress = 20 + Math.round(((i + 1) / totalStudents) * 80);
          progressCallback(genProgress);
        }

        // Small delay to avoid overwhelming browser
        if (!combineIntoOne) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Combine PDFs if requested
      if (combineIntoOne && generatedPDFs.length > 0) {
        const combinedPDF = await this.combinePDFDocuments(generatedPDFs);
        const className = students[0]?.className || students[0]?.class_name || 'class';
        combinedPDF.save(`reports_${className}_${term}_${students.length}students.pdf`);
      }

      return { success: true, message: `Generated reports for ${students.length} students` };
    } catch (error) {
      console.error("Error generating bulk student reports:", error);
      return { success: false, message: "Failed to generate student reports: " + error.message };
    }
  }

  /**
   * Generate and download reports for multiple students using SERVER-SIDE PDF merging
   * This method provides higher quality PDF merging compared to client-side approach
   *
   * @param {Array} students - Array of student objects
   * @param {String} term - Term for the reports
   * @param {Object} schoolInfo - School information
   * @param {Function} progressCallback - Optional callback for progress updates
   * @returns {Promise<Object>} Result object with success status
   */
  async printBulkStudentReportsServerSide(students, term, schoolInfo, progressCallback = null) {
    try {
      const totalStudents = students.length;
      const pdfDataArray = [];

      // Generate PDF for each student
      for (let i = 0; i < students.length; i++) {
        const student = students[i];

        try {
          // Get formatted student data with positions (uses helper method)
          const { subjectsData, remarksInfo } = await this._getFormattedStudentData(student, term);

          // Generate PDF with form master remarks
          const pdf = generateStudentReportPDF(student, subjectsData, schoolInfo, remarksInfo);

          // Convert PDF to base64 for server-side processing
          const pdfOutput = pdf.output('arraybuffer');
          const pdfBase64 = this._arrayBufferToBase64(pdfOutput);

          // Validate PDF data before adding
          if (!pdfBase64 || pdfBase64.length === 0) {
            console.error(`Invalid PDF generated for student: ${student.firstName || student.first_name} ${student.lastName || student.last_name}`);
            continue; // Skip this student
          }

          pdfDataArray.push(pdfBase64);

          // Update progress
          if (progressCallback) {
            const progress = Math.round(((i + 1) / totalStudents) * 50); // 0-50% for generation
            progressCallback(progress);
          }
        } catch (error) {
          console.error(`Error generating PDF for student ${i + 1}:`, error);
          // Continue with other students
        }
      }

      // Check if we have any PDFs to merge
      if (pdfDataArray.length === 0) {
        throw new Error('Failed to generate any PDFs. Please check student data and try again.');
      }

      // Update progress: merging phase
      if (progressCallback) {
        progressCallback(60);
      }

      // Try server-side merging first, fall back to client-side if it fails
      let mergedPdfData;
      let useClientSide = false;

      try {
        const apiEndpoint = '/api/generate-bulk-pdfs';
        console.log(`Attempting server-side merge of ${pdfDataArray.length} PDFs...`);

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pdfDataArray })
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Server-side PDF generation failed');
        }

        console.log(`Server successfully merged ${pdfDataArray.length} PDFs`);
        mergedPdfData = result.pdfData;
      } catch (serverError) {
        console.warn('Server-side PDF merging failed, falling back to client-side:', serverError.message);
        useClientSide = true;

        // Fall back to client-side merging using pdf-lib
        console.log(`Using client-side PDF merging for ${pdfDataArray.length} PDF(s)...`);

        if (pdfDataArray.length === 0) {
          throw new Error('No PDFs to download');
        }

        // Use pdf-lib to merge PDFs in the browser
        mergedPdfData = await this._mergeClientSide(pdfDataArray);
        console.log('Client-side PDF merging completed successfully');
      }

      // Update progress: downloading
      if (progressCallback) {
        progressCallback(90);
      }

      // Convert base64 back to blob and trigger download
      const mergedPdfBytes = this._base64ToArrayBuffer(mergedPdfData);
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      const className = students[0]?.className || students[0]?.class_name || 'class';
      const mergeMethod = useClientSide ? 'client' : 'server';
      link.download = `reports_${className}_${term}_${students.length}students_${mergeMethod}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      if (progressCallback) {
        progressCallback(100);
      }

      const method = useClientSide ? 'client-side fallback' : 'server-side merging';
      return {
        success: true,
        message: `Successfully generated reports for ${students.length} student(s) using ${method}`
      };
    } catch (error) {
      console.error("Error generating server-side bulk student reports:", error);
      return {
        success: false,
        message: "Failed to generate student reports: " + error.message
      };
    }
  }

  /**
   * PRIVATE: Convert ArrayBuffer to Base64
   * @param {ArrayBuffer} buffer - Array buffer to convert
   * @returns {String} Base64 encoded string
   */
  _arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * PRIVATE: Convert Base64 to ArrayBuffer
   * @param {String} base64 - Base64 encoded string
   * @returns {ArrayBuffer} Array buffer
   */
  _base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * PRIVATE: Merge multiple PDFs client-side using pdf-lib
   * @param {Array} pdfDataArray - Array of base64-encoded PDF strings
   * @returns {String} Base64-encoded merged PDF
   */
  async _mergeClientSide(pdfDataArray) {
    // Dynamically import pdf-lib
    const { PDFDocument } = await import('pdf-lib');

    console.log(`Starting client-side merge of ${pdfDataArray.length} PDFs...`);

    // Create a new PDF document for the merged result
    const mergedPdf = await PDFDocument.create();

    // Process each PDF
    for (let i = 0; i < pdfDataArray.length; i++) {
      try {
        console.log(`Merging PDF ${i + 1}/${pdfDataArray.length}...`);

        // Convert base64 to Uint8Array
        const pdfBytes = this._base64ToArrayBuffer(pdfDataArray[i]);

        // Load the PDF document
        const pdf = await PDFDocument.load(pdfBytes);
        const pageCount = pdf.getPageCount();
        console.log(`PDF ${i + 1} has ${pageCount} pages`);

        // Copy all pages from this PDF to the merged PDF
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });

        console.log(`Successfully merged PDF ${i + 1}`);
      } catch (error) {
        console.error(`Error merging PDF ${i + 1}:`, error);
        // Continue with other PDFs even if one fails
      }
    }

    // Serialize the merged PDF to bytes
    console.log(`Saving merged PDF with ${mergedPdf.getPageCount()} total pages...`);
    const mergedPdfBytes = await mergedPdf.save();

    // Convert to base64
    const mergedPdfBase64 = this._arrayBufferToBase64(mergedPdfBytes);
    console.log(`Client-side merge complete. Result size: ${mergedPdfBase64.length} chars`);

    return mergedPdfBase64;
  }

  /**
   * PRIVATE: Get formatted student data with positions calculated
   * This method extracts duplicated logic from printStudentReport and printBulkStudentReports
   * @param {Object} student - Student data
   * @param {String} term - Term for the report
   * @param {Object} formMasterInfo - Optional form master info (if not provided, will fetch)
   * @returns {Object} Formatted student data and remarks
   */
  async _getFormattedStudentData(student, term, formMasterInfo = {}) {
    // Fetch student scores for all subjects
    const reportData = await getStudentReportData(student.idNumber || student.id_number, term);

    // Fetch form master remarks and attendance if not provided
    let remarksInfo = formMasterInfo;
    if (!formMasterInfo || Object.keys(formMasterInfo).length === 0) {
      const remarksResponse = await getFormMasterRemarks(
        student.idNumber || student.id_number,
        student.className || student.class_name
      );
      remarksInfo = remarksResponse.data ? {
        remarks: remarksResponse.data.remarks || '',
        attitude: remarksResponse.data.attitude || '',
        interest: remarksResponse.data.interest || '',
        comments: remarksResponse.data.comments || '',
        attendance: {
          present: remarksResponse.data.attendance || 0,
          total: remarksResponse.data.attendance_total || remarksResponse.data.attendanceTotal || 0
        }
      } : {};
    }

    // Fetch class broadsheet to calculate positions
    const className = student.className || student.class_name;
    let broadsheetData = null;
    try {
      broadsheetData = await getClassBroadsheet(className);
    } catch (error) {
      console.warn('Could not fetch broadsheet for position calculation:', error);
    }

    // Format subjects data for the report
    const subjectsData = reportData.data.map(score => {
      // Calculate class score from individual tests or use ca1+ca2
      const test1 = parseFloat(score.test1) || 0;
      const test2 = parseFloat(score.test2) || 0;
      const test3 = parseFloat(score.test3) || 0;
      const test4 = parseFloat(score.test4) || 0;
      const testsTotal = test1 + test2 + test3 + test4;
      const classScore = testsTotal > 0
        ? (testsTotal / 60) * 50
        : ((parseFloat(score.ca1) || 0) + (parseFloat(score.ca2) || 0));

      const total = parseFloat(score.total) || 0;

      // Calculate position if we have broadsheet data
      let position = "-";
      if (broadsheetData && broadsheetData.status === 'success') {
        position = this.calculatePosition(
          score.subject,
          total,
          student.idNumber || student.id_number,
          broadsheetData.data
        );
      }

      return {
        name: score.subject,
        cscore: classScore.toFixed(1),
        exam: parseFloat(score.exam) || 0,
        total,
        position,
        remark: this.getRemarks(total)
      };
    });

    // Calculate overall class position and total students count
    let overallPosition = '-';
    let totalStudents = 0;

    if (broadsheetData && broadsheetData.status === 'success') {
      const students = broadsheetData.data.students || [];
      totalStudents = students.length;

      // Calculate total marks for each student across all subjects
      const studentTotals = students.map(s => {
        const studentScores = broadsheetData.data.scores?.filter(score =>
          score.student_id === s.id
        ) || [];

        const totalMarks = studentScores.reduce((sum, score) => {
          return sum + (parseFloat(score.total) || 0);
        }, 0);

        return {
          studentId: s.id,
          idNumber: s.id_number,
          totalMarks
        };
      });

      // Sort by total marks (descending) to determine positions
      studentTotals.sort((a, b) => b.totalMarks - a.totalMarks);

      // Find this student's position
      const studentIdNumber = student.idNumber || student.id_number;
      const studentIndex = studentTotals.findIndex(s => s.idNumber === studentIdNumber);
      if (studentIndex !== -1) {
        overallPosition = studentIndex + 1;
      }
    }

    // Add overall position and total students to remarksInfo
    remarksInfo.overallPosition = overallPosition;
    remarksInfo.totalStudents = totalStudents;

    return { subjectsData, remarksInfo };
  }

  /**
   * Combine multiple jsPDF documents into one
   * @param {Array} pdfs - Array of jsPDF objects
   * @returns {jsPDF} - Combined PDF document
   */
  async combinePDFDocuments(pdfs) {
    if (pdfs.length === 0) return null;
    if (pdfs.length === 1) return pdfs[0];

    // Import jsPDF
    const { jsPDF } = await import('jspdf');
    const combinedPDF = new jsPDF();

    // Remove the default first page
    combinedPDF.deletePage(1);

    // Add all pages from all PDFs
    for (let i = 0; i < pdfs.length; i++) {
      const pdf = pdfs[i];
      const pageCount = pdf.internal.getNumberOfPages();

      for (let j = 1; j <= pageCount; j++) {
        // Get page from source PDF
        const page = pdf.internal.pages[j];

        // Add a new page to combined PDF
        combinedPDF.addPage();

        // Copy the page content
        // We use the internal.write method to copy page content
        const pageContent = pdf.internal.getPageInfo(j);

        // Set the same page size
        combinedPDF.internal.pageSize = pdf.internal.pageSize;

        // Import the page using internal methods
        try {
          // Get the page as array buffer
          const pageData = pdf.output('arraybuffer', { pageNumbers: [j] });
          // This is a simplified approach - in production you'd use a PDF merging library
        } catch (error) {
          console.warn('Could not copy page content, using alternative method');
        }
      }
    }

    // Alternative simpler approach: concatenate all pages
    const finalPDF = new jsPDF();
    finalPDF.deletePage(1);

    for (const pdf of pdfs) {
      const pageCount = pdf.internal.getNumberOfPages();
      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        // Add new page with same dimensions
        const pageInfo = pdf.internal.getPageInfo(pageNum);
        const pageWidth = pdf.internal.pageSize.width || pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.height || pdf.internal.pageSize.getHeight();

        finalPDF.addPage([pageWidth, pageHeight]);

        // Get current page number in final PDF
        const currentPage = finalPDF.internal.getNumberOfPages();
        finalPDF.setPage(currentPage);

        // Set to the source page and copy content
        pdf.setPage(pageNum);

        // Copy the page by getting it as image and adding to new PDF
        try {
          const imgData = pdf.output('dataurlstring', { pageNumbers: [pageNum] });
          // Add as image to preserve formatting
          finalPDF.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
        } catch (error) {
          // If image method fails, just create a separator page
          finalPDF.setFontSize(10);
          finalPDF.text(`[Report ${pdfs.indexOf(pdf) + 1} - Page ${pageNum}]`, 10, 10);
        }
      }
    }

    return finalPDF;
  }
  
  /**
   * Generate and download a subject broadsheet
   * @param {String} className - Class name
   * @param {String} subject - Subject name
   * @param {Object} schoolInfo - School information
   * @param {String} teacherName - Name of the subject teacher (optional)
   */
  async printSubjectBroadsheet(className, subject, schoolInfo, teacherName = '', term = null) {
    try {
      // Fetch broadsheet data
      // Use term from parameter, fallback to schoolInfo.term
      const termToUse = term || schoolInfo.term;
      const broadsheetData = await getClassBroadsheet(className, termToUse);

      // Check for error status
      if (broadsheetData.status === 'error') {
        throw new Error(broadsheetData.message);
      }

      // Filter students for this class
      const students = broadsheetData.data.students || [];

      if (students.length === 0) {
        return {
          success: false,
          message: `No students found in class ${className}. Please add students first.`
        };
      }

      // Get scores for this subject (allow empty scores - broadsheet will show blanks)
      const subjectScores = broadsheetData.data.scores?.filter(score => score.subject === subject) || [];

      // Combine student data with scores
      // If no scores exist, students will have empty/null scores which is acceptable
      const studentsWithScores = students.map(student => {
        // Match by database ID (student_id in scores matches id in students)
        const studentScores = subjectScores.find(s => s.student_id === student.id);
        return {
          ...student,
          scores: this.formatScores(studentScores)
        };
      });

      // Generate PDF with className and teacherName parameters
      const pdf = generateSubjectBroadsheetPDF(studentsWithScores, subject, schoolInfo, className, teacherName);

      // Download PDF
      pdf.save(`broadsheet_${className}_${subject}.pdf`);

      return { success: true, message: "Subject broadsheet generated successfully" };
    } catch (error) {
      console.error("Error generating subject broadsheet:", error);
      return { success: false, message: "Failed to generate subject broadsheet: " + error.message };
    }
  }
  
  /**
   * Generate and download a complete class broadsheet with all subjects
   * @param {String} className - Class name
   * @param {Object} schoolInfo - School information
   */
  async printCompleteClassBroadsheet(className, schoolInfo) {
    try {
      // Fetch broadsheet data
      const broadsheetData = await getClassBroadsheet(className);

      // Check for error status
      if (broadsheetData.status === 'error') {
        throw new Error(broadsheetData.message);
      }

      // Get students and subjects
      const students = broadsheetData.data.students || [];
      const subjects = broadsheetData.data.subjects || [];

      if (students.length === 0) {
        return {
          success: false,
          message: `No students found in class ${className}. Please add students first.`
        };
      }

      if (subjects.length === 0) {
        return {
          success: false,
          message: `No subject scores found for ${className}. Please enter scores first before generating broadsheet.`
        };
      }

      // Get all scores organized by subject
      const allScores = {};
      for (const subject of subjects) {
        const subjectScores = broadsheetData.data.scores?.filter(score => score.subject === subject) || [];
        allScores[subject] = subjectScores;
      }

      // Fetch teachers and build subject-teacher mapping
      const teachersMap = {};
      try {
        const teachersResponse = await getTeachers();
        if (teachersResponse.status === 'success') {
          const teachers = teachersResponse.data || [];

          // Create a map of subject -> teacher name for this class
          teachers.forEach(teacher => {
            const teacherClasses = teacher.classes || [];
            const teacherSubjects = teacher.subjects || [];

            // Check if teacher teaches this class
            const teachesThisClass = teacherClasses.includes(className) ||
                                     teacher.classAssigned === className ||
                                     teacher.form_class === className;

            if (teachesThisClass && teacherSubjects.length > 0) {
              teacherSubjects.forEach(subject => {
                // Only add if this subject is in the broadsheet subjects list
                if (subjects.includes(subject)) {
                  const teacherFullName = `${teacher.first_name || teacher.firstName || ''} ${teacher.last_name || teacher.lastName || ''}`.trim();
                  teachersMap[subject] = teacherFullName;
                }
              });
            }
          });
        }
      } catch (error) {
        console.warn('Could not fetch teachers for broadsheet:', error);
        // Continue without teacher names
      }

      // Generate complete broadsheet PDF with className and teachersMap parameters
      const pdf = generateCompleteClassBroadsheetPDF(students, subjects, allScores, schoolInfo, className, teachersMap);

      // Download PDF
      pdf.save(`complete_broadsheet_${className}.pdf`);

      return { success: true, message: "Complete class broadsheet generated successfully" };
    } catch (error) {
      console.error("Error generating complete class broadsheet:", error);
      return { success: false, message: "Failed to generate complete class broadsheet: " + error.message };
    }
  }
  
  /**
   * Format scores for display
   * @param {Object} scores - Raw scores data
   * @returns {Object} Formatted scores
   */
  formatScores(scores) {
    if (!scores) return {};

    // Parse scores from database (they come as strings)
    const test1 = parseFloat(scores.test1) || 0;
    const test2 = parseFloat(scores.test2) || 0;
    const test3 = parseFloat(scores.test3) || 0;
    const test4 = parseFloat(scores.test4) || 0;
    const exam = parseFloat(scores.exam) || 0;

    const testsTotal = test1 + test2 + test3 + test4;
    const scaledTests = (testsTotal / 60) * 50;
    const scaledExam = (exam / 100) * 50;

    // Use database total if available, otherwise calculate
    const finalTotal = scores.total ? parseFloat(scores.total) : (scaledTests + scaledExam);

    // Use database remark if available, otherwise calculate
    const remark = scores.remark || scores.remarks || this.getRemarks(finalTotal);

    // Use calculatedPosition or position from database
    const position = scores.calculatedPosition || scores.position || null;

    return {
      test1,
      test2,
      test3,
      test4,
      testsTotal,
      scaledTests: scaledTests.toFixed(2),
      exam,
      scaledExam: scaledExam.toFixed(2),
      finalTotal: finalTotal.toFixed(2),
      remark,
      position
    };
  }
  
  /**
   * Calculate student position in a subject
   * @param {String} subject - Subject name
   * @param {Number} studentScore - Student's total score
   * @param {String} studentId - Student's ID
   * @param {Object} broadsheetData - Class broadsheet data with all students' scores
   * @returns {String} Position (e.g., "1st", "2nd", "3rd", etc.)
   */
  calculatePosition(subject, studentScore, studentId, broadsheetData) {
    try {
      // Get all scores for this subject
      const subjectScores = broadsheetData.scores?.filter(score => score.subject === subject) || [];

      if (subjectScores.length === 0) {
        return "-";
      }

      // Calculate total score for each student in this subject
      const studentsWithTotals = subjectScores.map(score => {
        const test1 = parseFloat(score.test1) || 0;
        const test2 = parseFloat(score.test2) || 0;
        const test3 = parseFloat(score.test3) || 0;
        const test4 = parseFloat(score.test4) || 0;
        const exam = parseFloat(score.exam) || 0;

        // Calculate total: (tests/60)*50 + (exam/100)*50
        const testsTotal = test1 + test2 + test3 + test4;
        const testsScaled = (testsTotal / 60) * 50;
        const examScaled = (exam / 100) * 50;
        const finalTotal = testsScaled + examScaled;

        return {
          studentId: score.student_id,
          total: finalTotal
        };
      });

      // Sort by total score (descending)
      studentsWithTotals.sort((a, b) => b.total - a.total);

      // Find position (handle ties)
      let position = 1;
      let previousScore = null;
      let sameScoreCount = 0;

      for (let i = 0; i < studentsWithTotals.length; i++) {
        const current = studentsWithTotals[i];

        // Check for tied scores
        if (previousScore !== null && Math.abs(current.total - previousScore) < 0.01) {
          // Same score as previous student - same position
          sameScoreCount++;
        } else {
          // Different score - update position accounting for ties
          position = i + 1;
          sameScoreCount = 0;
        }

        if (current.studentId === studentId) {
          return this._formatPosition(position);
        }

        previousScore = current.total;
      }

      // Student not found in scores
      return "-";
    } catch (error) {
      console.error('Error calculating position:', error);
      return "-";
    }
  }

  /**
   * PRIVATE: Format position number with suffix (1st, 2nd, 3rd, etc.)
   * @param {Number} position - Position number
   * @returns {String} Formatted position
   */
  _formatPosition(position) {
    const lastDigit = position % 10;
    const lastTwoDigits = position % 100;

    // Special case for 11th, 12th, 13th
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return `${position}th`;
    }

    // Regular cases
    switch (lastDigit) {
      case 1:
        return `${position}st`;
      case 2:
        return `${position}nd`;
      case 3:
        return `${position}rd`;
      default:
        return `${position}th`;
    }
  }
  
  /**
   * Get remarks based on score
   * @param {Number} score - Student's score
   * @returns {String} Remarks
   */
  getRemarks(score) {
    // Use standardized remark calculation from gradeHelpers
    return calculateRemark(score);
  }
  
  /**
   * Get school information from localStorage or defaults
   * @returns {Object} School information
   */
  getSchoolInfo() {
    // Read from globalSettings (used by GlobalSettingsContext)
    const savedSettings = localStorage.getItem('globalSettings');
    const defaults = {
      name: "DERIAD'S eSBA",
      logo: null, // No default logo
      term: "First Term",
      academicYear: "2024/2025",
      headmaster: ""
    };

    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        return {
          name: settings.schoolName || defaults.name,
          logo: settings.schoolLogo || defaults.logo,
          term: settings.term || defaults.term,
          academicYear: settings.academicYear || defaults.academicYear,
          headmaster: settings.headmaster || defaults.headmaster
        };
      } catch (e) {
        console.error('Error parsing globalSettings:', e);
        return defaults;
      }
    }
    return defaults;
  }
}

// Export singleton instance
export default new PrintingService();