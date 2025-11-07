import fs from 'fs';

console.log('Updating printingService to use standardized remarks...\n');

const filePath = 'src/services/printingService.js';
let content = fs.readFileSync(filePath, 'utf8');

// Add import
if (!content.includes("from '../utils/gradeHelpers'")) {
  content = content.replace(
    /import { getStudentReportData, getTeachers, getFormMasterRemarks, getMarks, getClassBroadsheet } from '\.\.\/api-client';/,
    `import { getStudentReportData, getTeachers, getFormMasterRemarks, getMarks, getClassBroadsheet } from '../api-client';\nimport { calculateRemark } from '../utils/gradeHelpers';`
  );
  console.log('✅ Added gradeHelpers import\n');
}

// Update getRemarks function
const oldGetRemarks = `  getRemarks(score) {
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Very Good";
    if (score >= 60) return "Good";
    if (score >= 50) return "Fair";
    if (score >= 40) return "Poor";
    return "Very Poor";
  }`;

const newGetRemarks = `  getRemarks(score) {
    // Use standardized remark calculation from gradeHelpers
    return calculateRemark(score);
  }`;

content = content.replace(oldGetRemarks, newGetRemarks);
console.log('✅ Updated getRemarks function to use calculateRemark helper\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ printingService updated successfully!\n');

