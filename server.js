import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes - Import all your API endpoints
// Auth routes
import authLogin from './api/auth/login/index.js';
import authVerify from './api/auth/verify/index.js';
import authChangePassword from './api/auth/change-password/index.js';

// Analytics routes
import analyticsStats from './api/analytics/stats/index.js';
import analyticsTrends from './api/analytics/trends/index.js';
import analyticsTeacherProgress from './api/analytics/teacher-progress/index.js';
import analyticsClassPerformance from './api/analytics/class-performance/index.js';
import analyticsAllMarks from './api/analytics/all-marks/index.js';

// Student routes
import students from './api/students/index.js';
import studentsPromote from './api/students/promote.js';
import studentsBulkPromote from './api/students/bulk-promote.js';
import studentsPromotionHistory from './api/students/promotion-history.js';

// Other routes
import teachers from './api/teachers/index.js';
import classes from './api/classes/index.js';
import marks from './api/marks/index.js';
import broadsheet from './api/broadsheet/index.js';
import remarks from './api/remarks/index.js';
import settings from './api/settings/index.js';
import archives from './api/archives/index.js';
import assessments from './api/assessments/index.js';
import assessmentScores from './api/assessments/scores.js';
import assessmentAggregates from './api/assessments/aggregates.js';

// Register API routes
app.use('/api/auth/login', authLogin);
app.use('/api/auth/verify', authVerify);
app.use('/api/auth/change-password', authChangePassword);

app.use('/api/analytics/stats', analyticsStats);
app.use('/api/analytics/trends', analyticsTrends);
app.use('/api/analytics/teacher-progress', analyticsTeacherProgress);
app.use('/api/analytics/class-performance', analyticsClassPerformance);
app.use('/api/analytics/all-marks', analyticsAllMarks);

app.use('/api/students', students);
app.use('/api/students/promote', studentsPromote);
app.use('/api/students/bulk-promote', studentsBulkPromote);
app.use('/api/students/promotion-history', studentsPromotionHistory);

app.use('/api/teachers', teachers);
app.use('/api/classes', classes);
app.use('/api/marks', marks);
app.use('/api/broadsheet', broadsheet);
app.use('/api/remarks', remarks);
app.use('/api/settings', settings);
app.use('/api/archives', archives);
app.use('/api/assessments', assessments);
app.use('/api/assessments/scores', assessmentScores);
app.use('/api/assessments/aggregates', assessmentAggregates);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// All remaining requests return the React app, so it can handle routing
// Express v5 requires regex pattern instead of '*'
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});
