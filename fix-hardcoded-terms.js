import fs from 'fs';
import path from 'path';

/**
 * Script to fix hardcoded term values in component files
 * Replaces 'Term 1', 'Term 2', 'Term 3' with settings.term || DEFAULT_TERM
 */

const filesToUpdate = [
  'src/pages/FormMasterPage.jsx',
  'src/pages/ClassTeacherPage.jsx',
  'src/pages/SchoolSetupPage.jsx'
];

const requiredImports = {
  DEFAULT_TERM: 'import { DEFAULT_TERM } from "../constants/terms";',
  useGlobalSettings: 'import { useGlobalSettings } from "../context/GlobalSettingsContext";'
};

function addImportIfMissing(content, importName, importStatement) {
  if (content.includes(importStatement)) {
    console.log(`  ✓ Import for ${importName} already exists`);
    return content;
  }

  // Find the last import statement
  const importRegex = /^import .+ from .+;$/gm;
  const imports = content.match(importRegex);

  if (imports && imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.indexOf(lastImport);
    const insertPosition = lastImportIndex + lastImport.length;

    content = content.slice(0, insertPosition) + '\n' + importStatement + content.slice(insertPosition);
    console.log(`  ✓ Added import for ${importName}`);
  } else {
    console.log(`  ⚠ Could not find import section for ${importName}`);
  }

  return content;
}

function addHookIfMissing(content) {
  // Check if useGlobalSettings hook is already called
  if (content.includes('useGlobalSettings()')) {
    console.log('  ✓ useGlobalSettings hook already called');
    return content;
  }

  // Find the component function and add the hook call
  const componentMatch = content.match(/const \w+Page = \(\) => \{/);
  if (componentMatch) {
    const hookCall = '\n  const { settings } = useGlobalSettings();';
    const insertPosition = componentMatch.index + componentMatch[0].length;

    content = content.slice(0, insertPosition) + hookCall + content.slice(insertPosition);
    console.log('  ✓ Added useGlobalSettings hook call');
  } else {
    console.log('  ⚠ Could not find component function to add hook');
  }

  return content;
}

function replaceHardcodedTerms(content) {
  let replacements = 0;

  // Replace term: 'Term 3' with term: settings.term || DEFAULT_TERM
  const pattern1 = /term:\s*['"]Term [123]['"]/g;
  const matches1 = content.match(pattern1);
  if (matches1) {
    replacements += matches1.length;
  }
  content = content.replace(pattern1, 'term: settings.term || DEFAULT_TERM');

  // Replace term='Term 3' with term={settings.term || DEFAULT_TERM}
  const pattern2 = /term=['"]Term [123]['"]/g;
  const matches2 = content.match(pattern2);
  if (matches2) {
    replacements += matches2.length;
  }
  content = content.replace(pattern2, 'term={settings.term || DEFAULT_TERM}');

  console.log(`  ✓ Replaced ${replacements} hardcoded term values`);
  return content;
}

function processFile(filePath) {
  console.log(`\n📝 Processing ${filePath}...`);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Add required imports
    content = addImportIfMissing(content, 'DEFAULT_TERM', requiredImports.DEFAULT_TERM);
    content = addImportIfMissing(content, 'useGlobalSettings', requiredImports.useGlobalSettings);

    // Add hook call if needed
    content = addHookIfMissing(content);

    // Replace hardcoded term values
    content = replaceHardcodedTerms(content);

    // Write back if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ File updated successfully`);
      return true;
    } else {
      console.log(`  ℹ No changes needed`);
      return false;
    }
  } catch (error) {
    console.error(`  ❌ Error processing file: ${error.message}`);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing hardcoded term values in component files...\n');

  let updatedCount = 0;
  let errorCount = 0;

  for (const file of filesToUpdate) {
    try {
      if (processFile(file)) {
        updatedCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to process ${file}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   Files processed: ${filesToUpdate.length}`);
  console.log(`   Files updated: ${updatedCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log('='.repeat(60));

  if (errorCount > 0) {
    console.log('\n⚠ Some files had errors. Please review manually.');
    process.exit(1);
  } else {
    console.log('\n✅ All files processed successfully!');
    process.exit(0);
  }
}

main();
