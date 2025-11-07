import fs from 'fs';

console.log('Updating marks API to auto-calculate remarks...\n');

const filePath = 'api/marks/index.js';
let content = fs.readFileSync(filePath, 'utf8');

// Update INSERT statement
const oldInsert = `INSERT INTO marks (
          student_id, subject, term, class_name, academic_year,
          test1, test2, test3, test4, exam,
          ca1, ca2, class_score, exam_score, total,
          created_at, updated_at
        ) VALUES (
          \${dbStudentId},
          \${scoreData.subject},
          \${scoreData.term},
          \${studentClassName},
          \${academicYear},
          \${test1}, \${test2}, \${test3}, \${test4}, \${exam},
          \${scoreData.ca1 || null},
          \${scoreData.ca2 || null},
          \${classScore},
          \${examScore},
          \${total},
          NOW(),
          NOW()
        )`;

const newInsert = `INSERT INTO marks (
          student_id, subject, term, class_name, academic_year,
          test1, test2, test3, test4, exam,
          ca1, ca2, class_score, exam_score, total, remark,
          created_at, updated_at
        ) VALUES (
          \${dbStudentId},
          \${scoreData.subject},
          \${scoreData.term},
          \${studentClassName},
          \${academicYear},
          \${test1}, \${test2}, \${test3}, \${test4}, \${exam},
          \${scoreData.ca1 || null},
          \${scoreData.ca2 || null},
          \${classScore},
          \${examScore},
          \${total},
          \${remark},
          NOW(),
          NOW()
        )`;

content = content.replace(oldInsert, newInsert);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Updated INSERT statement to include remark\n');

