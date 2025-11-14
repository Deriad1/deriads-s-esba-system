// Local development server for API routes
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
// Increase limit to handle large base64-encoded images (school logos)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Import and mount API routes
const importRoute = async (path) => {
  try {
    const module = await import(path);
    return module.default || module;
  } catch (error) {
    console.error(`Failed to import ${path}:`, error.message);
    return null;
  }
};

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const handler = await importRoute('./api/auth/login/index.js');
  if (handler) await handler(req, res);
});

app.get('/api/auth/verify', async (req, res) => {
  const handler = await importRoute('./api/auth/verify/index.js');
  if (handler) await handler(req, res);
});

// Students routes
app.all('/api/students', async (req, res) => {
  const handler = await importRoute('./api/students/index.js');
  if (handler) await handler(req, res);
});

// Student promotion route
app.post('/api/students/promote', async (req, res) => {
  const handler = await importRoute('./api/students/promote.js');
  if (handler) await handler(req, res);
});

// Teachers routes
app.all('/api/teachers', async (req, res) => {
  const handler = await importRoute('./api/teachers/index.js');
  if (handler) await handler(req, res);
});

// Classes routes
app.all('/api/classes', async (req, res) => {
  const handler = await importRoute('./api/classes/index.js');
  if (handler) await handler(req, res);
});

// Class subjects route (must come after /api/classes)
app.get('/api/classes/subjects', async (req, res) => {
  const handler = await importRoute('./api/classes/subjects.js');
  if (handler) await handler(req, res);
});

// Marks routes
app.all('/api/marks', async (req, res) => {
  const handler = await importRoute('./api/marks/index.js');
  if (handler) await handler(req, res);
});

// Settings routes
app.all('/api/settings', async (req, res) => {
  const handler = await importRoute('./api/settings/index.js');
  if (handler) await handler(req, res);
});

// Analytics routes - specific endpoints
app.all('/api/analytics/stats', async (req, res) => {
  const handler = await importRoute('./api/analytics/stats/index.js');
  if (handler) await handler(req, res);
});

app.all('/api/analytics/trends', async (req, res) => {
  const handler = await importRoute('./api/analytics/trends/index.js');
  if (handler) await handler(req, res);
});

app.all('/api/analytics/teacher-progress', async (req, res) => {
  const handler = await importRoute('./api/analytics/teacher-progress/index.js');
  if (handler) await handler(req, res);
});

app.all('/api/analytics/all-marks', async (req, res) => {
  const handler = await importRoute('./api/analytics/all-marks/index.js');
  if (handler) await handler(req, res);
});

app.all('/api/analytics/class-performance', async (req, res) => {
  const handler = await importRoute('./api/analytics/class-performance/index.js');
  if (handler) await handler(req, res);
});

// Assessments routes
app.all('/api/assessments', async (req, res) => {
  const handler = await importRoute('./api/assessments/index.js');
  if (handler) await handler(req, res);
});

// Assessment scores routes
app.all('/api/assessment-scores', async (req, res) => {
  const handler = await importRoute('./api/assessments/scores.js');
  if (handler) await handler(req, res);
});

// Assessment aggregates routes
app.all('/api/assessment-aggregates', async (req, res) => {
  const handler = await importRoute('./api/assessments/aggregates.js');
  if (handler) await handler(req, res);
});

// Student assessment scores route (all subjects for a student)
app.all('/api/student-assessment-scores', async (req, res) => {
  const handler = await importRoute('./api/assessments/scores.js');
  if (handler) await handler(req, res);
});

// Archives routes
app.all('/api/archives', async (req, res) => {
  const handler = await importRoute('./api/archives/index.js');
  if (handler) await handler(req, res);
});

// Remarks routes
app.all('/api/remarks', async (req, res) => {
  const handler = await importRoute('./api/remarks/index.js');
  if (handler) await handler(req, res);
});

// Broadsheet routes
app.all('/api/broadsheet', async (req, res) => {
  const handler = await importRoute('./api/broadsheet/index.js');
  if (handler) await handler(req, res);
});

// PDF generation
app.post('/api/generate-bulk-pdfs', async (req, res) => {
  const handler = await importRoute('./api/generate-bulk-pdfs.js');
  if (handler) await handler(req, res);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Dev server running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Dev API server running on http://localhost:${PORT}`);
  console.log(`📡 Ready to handle API requests from Vite on port 9000`);
});
