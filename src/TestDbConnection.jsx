import React, { useEffect, useState } from 'react';
import { testDbSetup } from './verify-db-connection';

const TestDbConnection = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const result = testDbSetup();
      setTestResult(result);
    } catch (error) {
      console.error('Error testing database setup:', error);
      setTestResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="p-4">Testing database connection...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Database Connection Test</h2>
      {testResult?.error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {testResult.error}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className={testResult?.isImportSuccessful ? 'text-green-600' : 'text-red-600'}>
            Import Status: {testResult?.isImportSuccessful ? '✅ Success' : '❌ Failed'}
          </p>
          <p>Type: {testResult?.type}</p>
        </div>
      )}
    </div>
  );
};

export default TestDbConnection;