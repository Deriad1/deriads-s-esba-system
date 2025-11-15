import { jsPDF } from "jspdf";
import "jspdf-autotable";

/**
 * Generate a comprehensive student report PDF with all subjects and details (GES Format)
 * @param {Object} student - Student data
 * @param {Array} subjectsData - Array of subject data with scores
 * @param {Object} schoolInfo - School information
 * @param {Object} formMasterInfo - Form master remarks and attendance
 * @returns {jsPDF} - Generated PDF document
 */
export const generateStudentReportPDF = (student, subjectsData, schoolInfo, formMasterInfo = {}) => {
  const doc = new jsPDF();
  let yPosition = 15;

  // Add school logo if available (top left)
  if (schoolInfo.logo) {
    try {
      doc.addImage(schoolInfo.logo, 'PNG', 15, 10, 25, 25);
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
    }
  }

  // GES Header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('GHANA EDUCATION SERVICE', 105, yPosition, { align: 'center' });

  yPosition += 8;
  doc.setFontSize(14);
  doc.text((schoolInfo.name || "DERIAD'S eSBA").toUpperCase(), 105, yPosition, { align: 'center' });

  yPosition += 8;
  doc.setFontSize(12);
  const termText = schoolInfo.term || 'FIRST';
  doc.text(`END OF ${termText.toUpperCase()} TERM REPORT`, 105, yPosition, { align: 'center' });

  // Student Information Section
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Draw boxes for student info
  const boxY = yPosition;
  doc.rect(15, boxY, 180, 30);

  // Horizontal lines
  doc.line(15, boxY + 10, 195, boxY + 10);
  doc.line(15, boxY + 20, 195, boxY + 20);

  // Vertical lines
  doc.line(105, boxY, 105, boxY + 20);
  doc.line(105, boxY + 20, 105, boxY + 30);

  // Labels and values
  doc.setFont('helvetica', 'bold');
  doc.text('NAME:', 20, boxY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${(student.firstName || student.first_name || '').toUpperCase()} ${(student.lastName || student.last_name || '').toUpperCase()}`, 40, boxY + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('ENROLLMENT:', 110, boxY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(formMasterInfo.totalStudents?.toString() || student.totalStudents?.toString() || '__', 145, boxY + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('POS:', 20, boxY + 17);
  doc.setFont('helvetica', 'normal');
  doc.text(formMasterInfo.overallPosition?.toString() || student.classPosition?.toString() || formMasterInfo.position?.toString() || '__', 35, boxY + 17);

  doc.setFont('helvetica', 'bold');
  doc.text('CLASS:', 60, boxY + 17);
  doc.setFont('helvetica', 'normal');
  doc.text(student.className || student.class_name || '', 80, boxY + 17);

  doc.setFont('helvetica', 'bold');
  doc.text('VACATION DATE:', 110, boxY + 17);
  doc.setFont('helvetica', 'normal');
  doc.text(formMasterInfo.vacationDate || '__________', 155, boxY + 17);

  doc.setFont('helvetica', 'bold');
  doc.text('ACADEMIC YEAR:', 20, boxY + 27);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolInfo.academicYear || '', 60, boxY + 27);

  doc.setFont('helvetica', 'bold');
  doc.text('NEXT TERM BEGINS:', 110, boxY + 27);
  doc.setFont('helvetica', 'normal');
  doc.text(formMasterInfo.reopeningDate || schoolInfo.nextTermBegins || '__________', 165, boxY + 27);

  // Subjects Table
  yPosition = boxY + 35;

  // Calculate total
  const totalScore = subjectsData.reduce((sum, subject) => sum + (subject.total || 0), 0);

  const tableData = subjectsData.map((subject) => [
    subject.name?.toUpperCase() || '',
    subject.cscore?.toString() || '0',
    subject.exam?.toString() || '0',
    subject.total?.toString() || '0',
    subject.position?.toString() || '-',
    subject.remark || '-'
  ]);

  // Add GRAND TOTAL row (use space instead of empty string to avoid hyphens)
  tableData.push([
    'GRAND TOTAL',
    ' ',
    ' ',
    totalScore.toString(),
    ' ',
    ' '
  ]);

  doc.autoTable({
    startY: yPosition,
    head: [['SUBJECT', 'C.SCORE', 'EXAM', 'TOTAL', 'POS', 'REM.']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: 0,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
      lineColor: [0, 0, 0],
      lineWidth: 0.5
    },
    bodyStyles: {
      fontSize: 9,
      halign: 'center',
      lineColor: [0, 0, 0],
      lineWidth: 0.5
    },
    columnStyles: {
      0: { cellWidth: 70, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20 },
      5: { cellWidth: 25 }
    },
    margin: { left: 15, right: 15 },
    didDrawCell: function (data) {
      // Remove hyphens from empty cells in GRAND TOTAL row
      const isGrandTotalRow = data.row.index === tableData.length - 1;
      if (isGrandTotalRow && data.column.index > 0 && data.column.index !== 3) {
        // Clear the cell content for empty GRAND TOTAL cells (except the TOTAL column)
        const cellText = data.cell.text[0];
        if (cellText === '' || cellText === '-') {
          data.cell.text = [''];
        }
      }
    },
    didDrawPage: function (data) {
      yPosition = data.cursor.y;
    }
  });

  // Check if we have enough space for the remarks section
  // Remarks section needs approximately 90mm of space
  const remarksSpaceNeeded = 90;
  const pageHeight = doc.internal.pageSize.height;
  const bottomMargin = 15;

  if (yPosition + remarksSpaceNeeded > pageHeight - bottomMargin) {
    // Not enough space, add a new page
    doc.addPage();
    yPosition = 20; // Start from top of new page with margin

    // Add a header on the new page for context
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT REPORT (CONTINUED)', 105, yPosition, { align: 'center' });
    yPosition += 10;
    doc.setFontSize(10);
    doc.text(`${(student.firstName || student.first_name || '').toUpperCase()} ${(student.lastName || student.last_name || '').toUpperCase()}`, 105, yPosition, { align: 'center' });
    yPosition += 10;
  }

  // Attendance, Interest, Attitude Section - Now in a prominent box
  yPosition += 5;
  const remarksBoxStartY = yPosition;

  // DEBUG: Log the remarks data being used
  console.log('[PDF Generator] formMasterInfo:', formMasterInfo);
  console.log('[PDF Generator] student data:', {
    interests: student.interests,
    attitude: student.attitude,
    remarks: student.remarks,
    comments: student.comments,
    attendance: student.attendance
  });

  // Draw a box around the entire remarks section for visibility
  doc.setLineWidth(0.5);
  doc.rect(15, remarksBoxStartY, 180, 42);

  yPosition += 7; // Padding inside the box

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const present = formMasterInfo.attendance?.present || student.attendance?.present || 0;
  const totalDays = formMasterInfo.attendance?.total || student.attendance?.total || 0;
  console.log('[PDF Generator] Attendance:', { present, totalDays });
  doc.text(`ATTENDANCE: ${present}`, 20, yPosition);
  doc.text(`OUT OF: ${totalDays}`, 70, yPosition);

  yPosition += 7;
  doc.text('INTEREST:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  const interestValue = formMasterInfo.interest || student.interests || '__________________';
  console.log('[PDF Generator] INTEREST value:', interestValue, '(from formMasterInfo.interest:', formMasterInfo.interest, 'or student.interests:', student.interests, ')');
  doc.text(interestValue, 50, yPosition);

  yPosition += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('ATTITUDE:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  const attitudeValue = formMasterInfo.attitude || student.attitude || '__________________';
  console.log('[PDF Generator] ATTITUDE value:', attitudeValue, '(from formMasterInfo.attitude:', formMasterInfo.attitude, 'or student.attitude:', student.attitude, ')');
  doc.text(attitudeValue, 50, yPosition);

  yPosition += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('REMARKS:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  const remarksValue = formMasterInfo.remarks || student.remarks || '__________________';
  console.log('[PDF Generator] REMARKS value:', remarksValue, '(from formMasterInfo.remarks:', formMasterInfo.remarks, 'or student.remarks:', student.remarks, ')');
  doc.text(remarksValue, 50, yPosition);

  yPosition += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('COMMENTS:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  const commentsValue = formMasterInfo.comments || student.comments || '__________________';
  console.log('[PDF Generator] COMMENTS value:', commentsValue, '(from formMasterInfo.comments:', formMasterInfo.comments, 'or student.comments:', student.comments, ')');
  doc.text(commentsValue, 50, yPosition);

  yPosition = remarksBoxStartY + 45; // Move past the box

  // Class Teacher's Remarks Box
  yPosition += 10;
  doc.rect(15, yPosition, 180, 20);
  doc.setFont('helvetica', 'bold');
  doc.text('CLASS TEACHER\'S REM.:', 20, yPosition + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const remarks = student.classTeacherComments || formMasterInfo.comments || formMasterInfo.remarks || '';
  doc.text(remarks, 20, yPosition + 13, { maxWidth: 170 });

  // Headmaster's Signature Box
  yPosition += 25;
  doc.rect(15, yPosition, 180, 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('HEADMASTER\'S SIGNATURE:', 20, yPosition + 10);
  doc.line(80, yPosition + 11, 130, yPosition + 11);
  doc.text('DATE:', 140, yPosition + 10);
  doc.line(155, yPosition + 11, 190, yPosition + 11);

  // Footer
  yPosition += 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Generated by Deriad\'s eSBA School Management System', 105, yPosition, { align: 'center' });

  return doc;
};

/**
 * Generate a subject-specific broadsheet PDF (GES Format)
 * @param {Array} students - Array of student data with scores
 * @param {String} subject - Subject name
 * @param {Object} schoolInfo - School information
 * @param {String} className - Class name
 * @returns {jsPDF} - Generated PDF document
 */
export const generateSubjectBroadsheetPDF = (students, subject, schoolInfo, className = '', teacherName = '') => {
  const doc = new jsPDF('landscape'); // Use landscape orientation for broadsheet

  let yPosition = 15;

  // Add school logo if available (top left)
  if (schoolInfo.logo) {
    try {
      doc.addImage(schoolInfo.logo, 'PNG', 10, 8, 20, 20);
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
    }
  }

  // School name header (centered)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text((schoolInfo.name || "DERIAD'S eSBA").toUpperCase(), 148, yPosition, { align: 'center' });

  yPosition += 8;

  // Header - moved to right side to avoid logo overlap
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`SUBJECT: ${subject.toUpperCase()}`, 40, yPosition);

  yPosition += 8;
  doc.setFontSize(10);
  doc.text('TEACHER:', 20, yPosition);
  // Display teacher name if provided, otherwise draw a line
  if (teacherName) {
    doc.setFont('helvetica', 'normal');
    doc.text(teacherName.toUpperCase(), 45, yPosition);
    doc.setFont('helvetica', 'bold');
  } else {
    doc.line(45, yPosition + 1, 100, yPosition + 1);
  }

  doc.text('SIGNATURE:', 150, yPosition);
  doc.line(180, yPosition + 1, 230, yPosition + 1);

  yPosition += 3;

  // Additional info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Class: ${className}`, 20, yPosition);
  doc.text(`Term: ${schoolInfo.term || ''}`, 70, yPosition);
  doc.text(`Academic Year: ${schoolInfo.academicYear || ''}`, 120, yPosition);

  yPosition += 5;

  // Process students and calculate scores
 const tableData = students.map((student, index) => {
  const scores = student.scores || {};

  // Get individual test scores (out of 15 each = 60 total)
  const test1 = parseFloat(scores.test1) || 0;
  const test2 = parseFloat(scores.test2) || 0;
  const test3 = parseFloat(scores.test3) || 0;
  const test4 = parseFloat(scores.test4) || 0;

  // Calculate total of tests (out of 60)
  const testsTotal = test1 + test2 + test3 + test4;

  // Convert 60 to 50 (class work scaled to 50%)
  const scaledClassWorkNum = (testsTotal / 60) * 50;
  const scaledClassWork = testsTotal > 0 ? scaledClassWorkNum.toFixed(1) : '-';

  // Get exam score (out of 100)
  const examRaw = parseFloat(scores.exam) || 0;

  // Convert exam to 50%
  const scaledExamNum = (examRaw / 100) * 50;
  const scaledExam = examRaw > 0 ? scaledExamNum.toFixed(1) : '-';

  // Final total (out of 100) - use database total if available, otherwise calculate
  let finalTotal = '-';
  if (scores.finalTotal) {
    // Use pre-calculated total from formatScores
    finalTotal = parseFloat(scores.finalTotal).toFixed(1);
  } else if (testsTotal > 0 || examRaw > 0) {
    // Calculate if not provided
    finalTotal = (scaledClassWorkNum + scaledExamNum).toFixed(1);
  }

  // Get remark - use from scores if available (from formatScores), otherwise calculate
  let remark = scores.remark || '-';
  if (remark === '-' && finalTotal !== '-') {
    const total = parseFloat(finalTotal);
    if (total >= 80) remark = 'Excellent';
    else if (total >= 70) remark = 'VERY GOOD';
    else if (total >= 60) remark = 'GOOD';
    else if (total >= 50) remark = 'Credit';
    else if (total >= 40) remark = 'PASS';
    else if (total > 0) remark = 'Fail';
  }

  // Get position - use from scores if available (from formatScores)
  const position = scores.position?.toString() || '-';

  return [
    `${(student.firstName || student.first_name || '')} ${(student.lastName || student.last_name || '')}`.toUpperCase(),
    test1 > 0 ? test1.toFixed(1) : '-',
    test2 > 0 ? test2.toFixed(1) : '-',
    test3 > 0 ? test3.toFixed(1) : '-',
    test4 > 0 ? test4.toFixed(1) : '-',
    testsTotal > 0 ? testsTotal.toFixed(1) : '-',
    scaledClassWork,
    examRaw > 0 ? examRaw.toFixed(1) : '-',
    scaledExam,
    finalTotal,
    position,
    remark
  ];
});

  // Create table
  doc.autoTable({
    startY: yPosition,
    head: [['NAME', 'TEST', 'TEST', 'TEST', 'TEST', 'TOTAL', '60 to 50', 'EXAM', '50%', 'TOTAL', 'POS', 'REMARKS']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: 0,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      lineColor: [0, 0, 0],
      lineWidth: 0.5
    },
    bodyStyles: {
      fontSize: 8,
      halign: 'center',
      lineColor: [0, 0, 0],
      lineWidth: 0.5
    },
    columnStyles: {
      0: { cellWidth: 50, halign: 'left' },
      1: { cellWidth: 15 },
      2: { cellWidth: 15 },
      3: { cellWidth: 15 },
      4: { cellWidth: 15 },
      5: { cellWidth: 20 },
      6: { cellWidth: 20 },
      7: { cellWidth: 20 },
      8: { cellWidth: 18 },
      9: { cellWidth: 20 },
      10: { cellWidth: 15 },
      11: { cellWidth: 30 }
    },
    margin: { left: 20, right: 20 }
  });

  return doc;
};

/**
 * Generate a complete class broadsheet combining all subjects (GES Format)
 * @param {Array} students - Array of student data
 * @param {Array} subjects - Array of subject names
 * @param {Object} allScores - All scores data organized by subject
 * @param {Object} schoolInfo - School information
 * @param {String} className - Class name
 * @returns {jsPDF} - Generated PDF document
 */
export const generateCompleteClassBroadsheetPDF = (students, subjects, allScores, schoolInfo, className = '', teachersMap = {}) => {
  const doc = new jsPDF('landscape');

  // Handle case when no subjects/marks exist yet - show table structure with all students
  if (!subjects || subjects.length === 0) {
    subjects = ['(No Subjects - Awaiting Marks Entry)'];
    allScores = {
      '(No Subjects - Awaiting Marks Entry)': []
    };
  }

  // Determine if this is a Primary or KG class
  // Primary: BS1-BS6, KG: KG1-KG2, JHS: BS7-BS9
  const isPrimaryOrKG = className.startsWith('KG') ||
                        (className.startsWith('BS') && !['BS7', 'BS8', 'BS9'].includes(className));

  let isFirstPage = true;

  // Generate subject-specific broadsheets
  subjects.forEach((subject, index) => {
    if (index > 0) {
      doc.addPage('landscape');
      isFirstPage = false;
    }

    let yPosition = 15;

    // Add school logo if available (top left)
    if (schoolInfo.logo) {
      try {
        doc.addImage(schoolInfo.logo, 'PNG', 10, 8, 20, 20);
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
      }
    }

    // School name header (centered)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text((schoolInfo.name || "DERIAD'S eSBA").toUpperCase(), 148, yPosition, { align: 'center' });

    yPosition += 8;

    // Header - moved to right side to avoid logo overlap
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`SUBJECT: ${subject.toUpperCase()}`, 40, yPosition);

    yPosition += 8;
    doc.setFontSize(10);
    doc.text('TEACHER:', 20, yPosition);

    // Display teacher name based on class type
    // For Primary/KG: show teacher name only on first page
    // For JHS: show teacher names on all pages
    const teacherName = teachersMap[subject];
    const shouldShowTeacherName = !isPrimaryOrKG || isFirstPage;

    if (shouldShowTeacherName && teacherName) {
      doc.setFont('helvetica', 'normal');
      doc.text(teacherName.toUpperCase(), 45, yPosition);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.line(45, yPosition + 1, 100, yPosition + 1);
    }

    doc.text('SIGNATURE:', 150, yPosition);
    doc.line(180, yPosition + 1, 230, yPosition + 1);

    yPosition += 3;

    // Additional info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Class: ${className}`, 20, yPosition);
    doc.text(`Term: ${schoolInfo.term || ''}`, 70, yPosition);
    doc.text(`Academic Year: ${schoolInfo.academicYear || ''}`, 120, yPosition);

    yPosition += 5;

    // Process students and calculate scores
    const tableData = students.map((student, studentIndex) => {
  // Match by database ID (student_id in scores matches id in students)
  const scores = allScores[subject]?.find(s => s.student_id === student.id) || {};

  // Get individual test scores (out of 15 each = 60 total)
  const test1 = parseFloat(scores.test1) || 0;
  const test2 = parseFloat(scores.test2) || 0;
  const test3 = parseFloat(scores.test3) || 0;
  const test4 = parseFloat(scores.test4) || 0;

  // Calculate total of tests (out of 60)
  const testsTotal = test1 + test2 + test3 + test4;

  // Convert 60 to 50 (class work scaled to 50%) - show "-" if empty
  const scaledClassWork = testsTotal > 0 ? (testsTotal / 60 * 50).toFixed(1) : '-';

  // Get exam score (out of 100)
  const examRaw = parseFloat(scores.exam) || 0;

  // Convert exam to 50% - show "-" if empty
  const scaledExam = examRaw > 0 ? (examRaw / 100 * 50).toFixed(1) : '-';

  // Final total (out of 100) - show "-" if no marks entered
  const finalTotal = (testsTotal > 0 || examRaw > 0)
    ? (parseFloat(scaledClassWork || 0) + parseFloat(scaledExam || 0)).toFixed(1)
    : '-';

  // Determine remark - show "-" if no marks
  let remark = '-';
  if (finalTotal !== '-') {
    const total = parseFloat(finalTotal);
    if (total >= 80) remark = 'Excellent';
    else if (total >= 70) remark = 'Very Good';
    else if (total >= 60) remark = 'Good';
    else if (total >= 50) remark = 'Average';
    else if (total >= 40) remark = 'Below Average';
    else if (total > 0) remark = 'Poor';
  }

  return [
    `${(student.firstName || student.first_name || '')} ${(student.lastName || student.last_name || '')}`.toUpperCase(),
    test1 > 0 ? test1.toFixed(1) : '-',
    test2 > 0 ? test2.toFixed(1) : '-',
    test3 > 0 ? test3.toFixed(1) : '-',
    test4 > 0 ? test4.toFixed(1) : '-',
    testsTotal > 0 ? testsTotal.toFixed(1) : '-',
    scaledClassWork,
    examRaw > 0 ? examRaw.toFixed(1) : '-',
    scaledExam,
    finalTotal,
    scores.position?.toString() || '-',
    remark
  ];
});

    // Create table
    doc.autoTable({
      startY: yPosition,
      head: [['NAME', 'TEST', 'TEST', 'TEST', 'TEST', 'TOTAL', '60 to 50', 'EXAM', '50%', 'TOTAL', 'POS', 'REMARKS']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: 0,
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
        lineColor: [0, 0, 0],
        lineWidth: 0.5
      },
      bodyStyles: {
        fontSize: 8,
        halign: 'center',
        lineColor: [0, 0, 0],
        lineWidth: 0.5
      },
      columnStyles: {
        0: { cellWidth: 50, halign: 'left' },
        1: { cellWidth: 15 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
        8: { cellWidth: 18 },
        9: { cellWidth: 20 },
        10: { cellWidth: 15 },
        11: { cellWidth: 30 }
      },
      margin: { left: 20, right: 20 }
    });
  });

  return doc;
};

/**
 * Combine multiple PDFs into one
 * @param {Array} pdfs - Array of jsPDF objects
 * @returns {jsPDF} - Combined PDF document
 */
export const combinePDFs = (pdfs) => {
  if (pdfs.length === 0) return null;
  if (pdfs.length === 1) return pdfs[0];
  
  // For now, we'll return the first PDF as a placeholder
  // In a real implementation with jspdf-autotable, you would combine all PDFs
  return pdfs[0];
};

export default {
  generateStudentReportPDF,
  generateSubjectBroadsheetPDF,
  generateCompleteClassBroadsheetPDF,
  combinePDFs
};