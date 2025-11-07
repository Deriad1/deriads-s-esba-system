import fs from 'fs';

/**
 * Script to update API files to use helper functions
 */

const updates = {
  'api/students/index.js': {
    imports: [
      "import { mapStudentFromDb } from '../../src/utils/studentIdHelpers.js';"
    ],
    replacements: [
      {
        description: 'Replace manual field mapping with helper function',
        old: `    // Map snake_case to camelCase for frontend compatibility
    const students = Array.isArray(result) ? result : (result.rows || []);
    const mappedStudents = students.map(student => ({
      id: student.id,
      idNumber: student.id_number,
      firstName: student.first_name,
      lastName: student.last_name,
      className: student.class_name,
      gender: student.gender,
      term: student.term,
      academicYear: student.academic_year,
      createdAt: student.created_at,
      updatedAt: student.updated_at
    }));`,
        new: `    // Map snake_case to camelCase for frontend compatibility using helper
    const students = Array.isArray(result) ? result : (result.rows || []);
    const mappedStudents = students.map(student => mapStudentFromDb(student));`
      }
    ]
  },
  'api/marks/index.js': {
    imports: [
      "import { isNumericStudentId } from '../../src/utils/studentIdHelpers.js';"
    ],
    replacements: [
      {
        description: 'Replace isNaN check with helper function',
        old: `    // If studentId is not numeric, look it up by id_number
    if (isNaN(scoreData.studentId)) {`,
        new: `    // If studentId is not numeric, look it up by id_number
    // Use helper to check if it's a numeric ID or id_number format
    if (!isNumericStudentId(scoreData.studentId)) {`
      }
    ]
  }
};

function addImportIfMissing(content, importStatement) {
  if (content.includes(importStatement)) {
    return { content, added: false };
  }

  // Find the last import statement
  const importRegex = /^import .+ from .+;$/gm;
  const imports = content.match(importRegex);

  if (imports && imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.indexOf(lastImport);
    const insertPosition = lastImportIndex + lastImport.length;

    content = content.slice(0, insertPosition) + '\n' + importStatement + content.slice(insertPosition);
    return { content, added: true };
  }

  return { content, added: false };
}

function processFile(filePath, config) {
  console.log(`\n📝 Processing ${filePath}...`);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let changes = 0;

    // Add imports
    if (config.imports) {
      for (const importStatement of config.imports) {
        const result = addImportIfMissing(content, importStatement);
        content = result.content;
        if (result.added) {
          console.log(`  ✓ Added import: ${importStatement.split("'")[1]}`);
          changes++;
        } else {
          console.log(`  ℹ Import already exists: ${importStatement.split("'")[1]}`);
        }
      }
    }

    // Apply replacements
    if (config.replacements) {
      for (const replacement of config.replacements) {
        if (content.includes(replacement.old)) {
          content = content.replace(replacement.old, replacement.new);
          console.log(`  ✓ ${replacement.description}`);
          changes++;
        } else {
          console.log(`  ⚠ Could not find code to replace: ${replacement.description}`);
        }
      }
    }

    // Write back if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ File updated successfully (${changes} changes)`);
      return true;
    } else {
      console.log(`  ℹ No changes needed`);
      return false;
    }
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return false;
  }
}

function main() {
  console.log('🔧 Updating API files to use helper functions...\n');

  let updatedCount = 0;
  let errorCount = 0;

  for (const [filePath, config] of Object.entries(updates)) {
    try {
      if (processFile(filePath, config)) {
        updatedCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to process ${filePath}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   Files processed: ${Object.keys(updates).length}`);
  console.log(`   Files updated: ${updatedCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log('='.repeat(60));

  if (errorCount > 0) {
    console.log('\n⚠ Some files had errors. Please review manually.');
    process.exit(1);
  } else {
    console.log('\n✅ All API files processed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart the development server: npm run dev');
    console.log('   2. Test the APIs to ensure they work correctly');
    console.log('   3. Run the database cleanup migration');
    process.exit(0);
  }
}

main();
