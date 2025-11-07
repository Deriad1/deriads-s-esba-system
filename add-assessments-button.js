import fs from 'fs';

console.log('Adding Manage Assessments button...\n');

const file = 'src/pages/AdminDashboardPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// Find the Promote Students button and add Assessments button after it
const promoteButton = `            <button
              className="glass-card-golden flex flex-col items-center justify-center min-h-[220px]"
              onClick={() => openModal('classPromotionWithStudents')}
            >
              <div className="text-4xl mb-4">📚</div>
              <div className="text-xl font-bold mb-2 text-shadow">Promote Students</div>
              <div className="text-sm text-gray-700 text-shadow">Select class → review students → promote</div>
            </button>`;

const assessmentsButton = `            <button
              className="glass-card-golden flex flex-col items-center justify-center min-h-[220px]"
              onClick={() => openModal('classPromotionWithStudents')}
            >
              <div className="text-4xl mb-4">📚</div>
              <div className="text-xl font-bold mb-2 text-shadow">Promote Students</div>
              <div className="text-sm text-gray-700 text-shadow">Select class → review students → promote</div>
            </button>
            <button
              className="glass-card-golden flex flex-col items-center justify-center min-h-[220px]"
              onClick={() => openModal('assessments')}
            >
              <div className="text-4xl mb-4">📝</div>
              <div className="text-xl font-bold mb-2 text-shadow">Manage Assessments</div>
              <div className="text-sm text-gray-700 text-shadow">Create midterm, mock exams & more</div>
            </button>`;

if (content.includes('Manage Assessments')) {
  console.log('ℹ️  Assessments button already exists');
} else {
  content = content.replace(promoteButton, assessmentsButton);
  fs.writeFileSync(file, content, 'utf8');
  console.log('✅ Added Manage Assessments button');
}

