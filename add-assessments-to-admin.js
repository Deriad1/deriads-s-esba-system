import fs from 'fs';

console.log('Adding Assessments feature to AdminDashboardPage...\n');

const file = 'src/pages/AdminDashboardPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add lazy import
if (!content.includes('AssessmentsManagementModal')) {
  content = content.replace(
    'const ArchiveViewer = lazy(() => import("../components/ArchiveViewerEnhanced"));',
    `const ArchiveViewer = lazy(() => import("../components/ArchiveViewerEnhanced"));
const AssessmentsManagementModal = lazy(() => import("../components/AssessmentsManagementModal"));`
  );
  console.log('✅ Added AssessmentsManagementModal lazy import');
} else {
  console.log('ℹ️  AssessmentsManagementModal import already exists');
}

// 2. Add modal name to useModalManager
const modalManagerPattern = /const \{\s*openModal[\s\S]*?\} = useModalManager\(\[[\s\S]*?\]\);/;
const match = content.match(modalManagerPattern);

if (match && !match[0].includes('assessments')) {
  const updatedModalManager = match[0].replace(
    /(\]\);)$/,
    `, 'assessments'$1`
  );
  content = content.replace(match[0], updatedModalManager);
  console.log('✅ Added "assessments" to modal manager');
} else {
  console.log('ℹ️  Modal manager already updated or not found');
}

fs.writeFileSync(file, content, 'utf8');

console.log('\n✅ AdminDashboardPage updated successfully!');
console.log('\nNext: Add the "Manage Assessments" button to the UI');
console.log('Look for the buttons section in the component render');

