import fs from 'fs';

const file = 'src/pages/SchoolSetupPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// Remove duplicate useGlobalSettings import
const lines = content.split('\n');
const seen = new Set();
const filtered = lines.filter(line => {
  // Check if line imports useGlobalSettings
  if (line.includes('useGlobalSettings') && line.includes('import')) {
    if (seen.has('useGlobalSettings')) {
      console.log('Removing duplicate import:', line.trim());
      return false; // Skip this line
    }
    seen.add('useGlobalSettings');
  }
  return true;
});

content = filtered.join('\n');
fs.writeFileSync(file, content, 'utf8');
console.log('✅ Fixed duplicate import in SchoolSetupPage.jsx');
