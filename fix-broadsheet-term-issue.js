import fs from 'fs';

/**
 * Script to fix broadsheet term mismatch issue
 * Makes broadsheet printing use the admin-selected term from global settings
 */

console.log('🔧 Fixing broadsheet term mismatch issue...\n');

// Fix 1: Update printingService.js
console.log('1. Updating printingService.js...');
try {
  let content = fs.readFileSync('src/services/printingService.js', 'utf8');

  // Update function signature
  content = content.replace(
    /async printSubjectBroadsheet\(className, subject, schoolInfo, teacherName = ''\) \{/,
    "async printSubjectBroadsheet(className, subject, schoolInfo, teacherName = '', term = null) {"
  );

  // Update getClassBroadsheet call
  content = content.replace(
    /const broadsheetData = await getClassBroadsheet\(className\);/,
    `// Use term from parameter, fallback to schoolInfo.term
      const termToUse = term || schoolInfo.term;
      const broadsheetData = await getClassBroadsheet(className, termToUse);`
  );

  fs.writeFileSync('src/services/printingService.js', content, 'utf8');
  console.log('  ✅ Updated printingService.js\n');
} catch (error) {
  console.error('  ❌ Error updating printingService.js:', error.message, '\n');
}

// Fix 2: Update SubjectTeacherPage.jsx
console.log('2. Updating SubjectTeacherPage.jsx...');
try {
  let content = fs.readFileSync('src/pages/SubjectTeacherPage.jsx', 'utf8');
  let changes = 0;

  // Add useGlobalSettings import if not present
  if (!content.includes('useGlobalSettings')) {
    content = content.replace(
      /import { useAuth } from ['"]\.\.\/context\/AuthContext['"]/,
      `import { useAuth } from '../context/AuthContext';\nimport { useGlobalSettings } from '../context/GlobalSettingsContext';`
    );
    changes++;
  }

  // Add hook call if not present
  if (!content.includes('const { settings } = useGlobalSettings()')) {
    content = content.replace(
      /const { user } = useAuth\(\);/,
      `const { user } = useAuth();\n  const { settings } = useGlobalSettings();`
    );
    changes++;
  }

  // Update printSubjectBroadsheet call
  content = content.replace(
    /printingService\.printSubjectBroadsheet\(\s*selectedClass,\s*selectedSubject,\s*schoolInfo\s*\)/g,
    `printingService.printSubjectBroadsheet(\n        selectedClass,\n        selectedSubject,\n        schoolInfo,\n        '', // teacherName\n        settings.term // term from global settings\n      )`
  );
  changes++;

  fs.writeFileSync('src/pages/SubjectTeacherPage.jsx', content, 'utf8');
  console.log(`  ✅ Updated SubjectTeacherPage.jsx (${changes} changes)\n`);
} catch (error) {
  console.error('  ❌ Error updating SubjectTeacherPage.jsx:', error.message, '\n');
}

// Fix 3: Update FormMasterPage.jsx
console.log('3. Updating FormMasterPage.jsx...');
try {
  let content = fs.readFileSync('src/pages/FormMasterPage.jsx', 'utf8');

  // Update both printSubjectBroadsheet calls
  content = content.replace(
    /printingService\.printSubjectBroadsheet\(\s*selectedClass,\s*subject,\s*schoolInfo\s*\)/g,
    `printingService.printSubjectBroadsheet(\n        selectedClass,\n        subject,\n        schoolInfo,\n        '', // teacherName\n        settings.term || DEFAULT_TERM // term from global settings\n      )`
  );

  content = content.replace(
    /printingService\.printSubjectBroadsheet\(\s*printClass,\s*subject,\s*schoolInfo,\s*''\s*\)/g,
    `printingService.printSubjectBroadsheet(\n        printClass,\n        subject,\n        schoolInfo,\n        '', // teacherName\n        settings.term || DEFAULT_TERM // term from global settings\n      )`
  );

  fs.writeFileSync('src/pages/FormMasterPage.jsx', content, 'utf8');
  console.log('  ✅ Updated FormMasterPage.jsx\n');
} catch (error) {
  console.error('  ❌ Error updating FormMasterPage.jsx:', error.message, '\n');
}

// Fix 4: Update ClassTeacherPage.jsx
console.log('4. Updating ClassTeacherPage.jsx...');
try {
  let content = fs.readFileSync('src/pages/ClassTeacherPage.jsx', 'utf8');

  // Update printSubjectBroadsheet call
  content = content.replace(
    /printingService\.printSubjectBroadsheet\(\s*selectedClass,\s*selectedSubject,\s*schoolInfo,\s*teacherName\s*\)/g,
    `printingService.printSubjectBroadsheet(\n        selectedClass,\n        selectedSubject,\n        schoolInfo,\n        teacherName,\n        settings.term || DEFAULT_TERM // term from global settings\n      )`
  );

  fs.writeFileSync('src/pages/ClassTeacherPage.jsx', content, 'utf8');
  console.log('  ✅ Updated ClassTeacherPage.jsx\n');
} catch (error) {
  console.error('  ❌ Error updating ClassTeacherPage.jsx:', error.message, '\n');
}

// Fix 5: Update AdminDashboardPage.jsx
console.log('5. Updating AdminDashboardPage.jsx...');
try {
  let content = fs.readFileSync('src/pages/AdminDashboardPage.jsx', 'utf8');
  let changes = 0;

  // Add useGlobalSettings import if not present
  if (!content.includes('useGlobalSettings')) {
    content = content.replace(
      /import { useAuth } from ['"]\.\.\/context\/AuthContext['"]/,
      `import { useAuth } from '../context/AuthContext';\nimport { useGlobalSettings } from '../context/GlobalSettingsContext';`
    );
    changes++;
  }

  // Add hook call if not present
  if (!content.includes('const { settings } = useGlobalSettings()')) {
    content = content.replace(
      /const AdminDashboardPage = \(\) => \{/,
      `const AdminDashboardPage = () => {\n  const { settings } = useGlobalSettings();`
    );
    changes++;
  }

  // Update printSubjectBroadsheet call
  content = content.replace(
    /printingService\.printSubjectBroadsheet\(\s*selectedClass,\s*subject,\s*schoolInfo,\s*''\s*\/\/ Teacher name can be fetched from teachers list if needed\s*\)/g,
    `printingService.printSubjectBroadsheet(\n        selectedClass,\n        subject,\n        schoolInfo,\n        '', // teacherName\n        settings.term // term from global settings\n      )`
  );
  changes++;

  fs.writeFileSync('src/pages/AdminDashboardPage.jsx', content, 'utf8');
  console.log(`  ✅ Updated AdminDashboardPage.jsx (${changes} changes)\n`);
} catch (error) {
  console.error('  ❌ Error updating AdminDashboardPage.jsx:', error.message, '\n');
}

// Fix 6: Update HeadTeacherPage.jsx
console.log('6. Updating HeadTeacherPage.jsx...');
try {
  let content = fs.readFileSync('src/pages/HeadTeacherPage.jsx', 'utf8');
  let changes = 0;

  // Add useGlobalSettings import if not present
  if (!content.includes('useGlobalSettings')) {
    content = content.replace(
      /import { useAuth } from ['"]\.\.\/context\/AuthContext['"]/,
      `import { useAuth } from '../context/AuthContext';\nimport { useGlobalSettings } from '../context/GlobalSettingsContext';`
    );
    changes++;
  }

  // Add hook call if not present
  if (!content.includes('const { settings } = useGlobalSettings()')) {
    content = content.replace(
      /const { user } = useAuth\(\);/,
      `const { user } = useAuth();\n  const { settings } = useGlobalSettings();`
    );
    changes++;
  }

  // Update printSubjectBroadsheet call
  content = content.replace(
    /printingService\.printSubjectBroadsheet\(\s*printClass,\s*printSubject,\s*schoolInfo\s*\)/g,
    `printingService.printSubjectBroadsheet(\n        printClass,\n        printSubject,\n        schoolInfo,\n        '', // teacherName\n        settings.term // term from global settings\n      )`
  );
  changes++;

  fs.writeFileSync('src/pages/HeadTeacherPage.jsx', content, 'utf8');
  console.log(`  ✅ Updated HeadTeacherPage.jsx (${changes} changes)\n`);
} catch (error) {
  console.error('  ❌ Error updating HeadTeacherPage.jsx:', error.message, '\n');
}

// Fix 7: Update GlobalSettingsContext.jsx
console.log('7. Updating GlobalSettingsContext.jsx...');
try {
  let content = fs.readFileSync('src/context/GlobalSettingsContext.jsx', 'utf8');

  // Add import if not present
  if (!content.includes("from '../constants/terms'")) {
    content = content.replace(
      /import { createContext, useContext, useState, useEffect } from 'react';/,
      `import { createContext, useContext, useState, useEffect } from 'react';\nimport { DEFAULT_TERM } from '../constants/terms';`
    );
  }

  // Update default term
  content = content.replace(
    /term: 'Term 1',/,
    `term: DEFAULT_TERM, // 'Third Term' from constants`
  );

  fs.writeFileSync('src/context/GlobalSettingsContext.jsx', content, 'utf8');
  console.log('  ✅ Updated GlobalSettingsContext.jsx\n');
} catch (error) {
  console.error('  ❌ Error updating GlobalSettingsContext.jsx:', error.message, '\n');
}

console.log('='.repeat(70));
console.log('✅ All fixes applied successfully!\n');
console.log('📋 Next steps:');
console.log('  1. Restart the development server: npm run dev');
console.log('  2. Clear localStorage or update term in School Setup');
console.log('  3. Test printing a subject broadsheet');
console.log('  4. Verify the PDF header matches the selected term');
console.log('  5. Verify the data and positions are correct');
console.log('='.repeat(70));
