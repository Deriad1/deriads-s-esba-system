import fs from 'fs';

console.log('Adding AssessmentsManagementModal component...\n');

const file = 'src/pages/AdminDashboardPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const modalComponent = `
      <Suspense fallback={<LoadingSpinner message="Loading..." />}>
        {isModalOpen('assessments') && (
          <AssessmentsManagementModal
            isOpen={isModalOpen('assessments')}
            onClose={() => closeModal('assessments')}
          />
        )}
      </Suspense>`;

if (content.includes("isModalOpen('assessments')")) {
  console.log('ℹ️  AssessmentsManagementModal component already added');
} else {
  // Add before the closing </> and );
  content = content.replace(
    '    </>\n  );\n};',
    `    ${modalComponent}\n    </>\n  );\n};`
  );
  fs.writeFileSync(file, content, 'utf8');
  console.log('✅ Added AssessmentsManagementModal component');
}

console.log('\n✅ AdminDashboardPage integration complete!');
console.log('\nYou can now:');
console.log('1. Restart dev server: npm run dev');
console.log('2. Go to Admin Dashboard');
console.log('3. Click "Manage Assessments" button');
console.log('4. Create Midterm Exam, Mock Exam, etc.');

