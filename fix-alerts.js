/**
 * Script to document alert() replacements
 *
 * This script lists all the alert() calls that need to be replaced
 * with showNotification() from the NotificationContext
 */

const files = [
  'src/components/PrintReportModal.jsx',
  'src/pages/SchoolSetupPage.jsx',
  'src/components/AdminSettingsPanel.jsx',
  'src/pages/ManageUsersPage.jsx',
  'src/components/ClassManagementModal.jsx',
  'src/components/TeacherSubjectAssignment.jsx',
  'src/components/EditTeacherModal.jsx',
  'src/components/FormMasterAssignmentModal.jsx'
];

console.log('Files with alert() calls that need fixing:');
console.log('==============================================\n');

files.forEach((file, index) => {
  console.log(`${index + 1}. ${file}`);
});

console.log('\n==============================================');
console.log('To fix: Import useNotification and replace alert() with showNotification()');
console.log('Example:');
console.log('  import { useNotification } from \'../context/NotificationContext\';');
console.log('  const { showNotification } = useNotification();');
console.log('  showNotification({ message: \'...\', type: \'success|error|warning|info\' });');
