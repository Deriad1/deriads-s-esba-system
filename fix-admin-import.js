import fs from 'fs';

const file = 'src/pages/AdminDashboardPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// Check if already imported
if (content.includes("useGlobalSettings")) {
  if (!content.includes("import { useGlobalSettings }")) {
    // Add import after useNotification
    content = content.replace(
      'import { useNotification } from "../context/NotificationContext";',
      'import { useNotification } from "../context/NotificationContext";\nimport { useGlobalSettings } from "../context/GlobalSettingsContext";'
    );
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('✅ Added useGlobalSettings import to AdminDashboardPage.jsx');
  } else {
    console.log('✅ Import already exists');
  }
} else {
  console.log('⚠️  useGlobalSettings not used in this file');
}
