import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LogoWatermark from '../components/LogoWatermark';

const LoginPage = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [schoolName, setSchoolName] = useState('DERIAD\'S eSBA');
  const [schoolLogo, setSchoolLogo] = useState('');

  useEffect(() => {
    // Get school name and logo from localStorage
    const storedSchoolName = localStorage.getItem('schoolName');
    const storedSchoolLogo = localStorage.getItem('schoolLogo');
    
    if (storedSchoolName) {
      setSchoolName(storedSchoolName);
    }
    
    if (storedSchoolLogo) {
      setSchoolLogo(storedSchoolLogo);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    // Added a white transparent overlay using a pseudo-element
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: 'url(/group-african-kids-learning-together.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* White transparent overlay */}
      <div 
        className="absolute inset-0 bg-white"
        style={{ opacity: 0.3 }}
      ></div>
      
      {/* School Logo Watermark */}
      <LogoWatermark opacity={0.08} size="450px" />
      
      {/* Glass Morphism Login Form */}
      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-xl p-8 rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 relative z-10">
        <div>
          <div className="flex justify-center mb-4">
            {schoolLogo ? (
              <img 
                src={schoolLogo} 
                alt="School Logo" 
                className="h-16 w-16 object-contain"
              />
            ) : (
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
            )}
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {schoolName}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            eSBA System Login
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white/50 backdrop-blur-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white/50 backdrop-blur-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50/70 border border-red-200 rounded-md p-4 backdrop-blur-sm">
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-center backdrop-blur-sm bg-white/30 p-4 rounded-lg">
            <div className="text-sm text-gray-600">
              <strong>Demo Accounts:</strong>
            </div>
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <div>Admin: admin@school.com / admin123</div>
              <div>Teacher: teacher1@example.com / teacher123</div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;