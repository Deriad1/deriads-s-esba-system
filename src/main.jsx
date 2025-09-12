import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { TermContextProvider } from "./context/TermContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

// Suppress PDF.js worker warnings and other browser extension errors
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && 
        args[0].includes('moz-chunked-arraybuffer')) {
      return; // Suppress PDF.js worker warning
    }
    originalWarn.apply(console, args);
  };
  
  console.error = (...args) => {
    const errorMsg = args[0]?.toString() || '';
    const suppressedErrors = [
      'Resource::kQuotaBytes quota exceeded',
      'contentscript.js',
      'check_if_pdf',
      'Failed to load resource: the server responded with a status of 500',
      'Cannot read properties of undefined (reading \'frame\')',
      'moz-chunked-arraybuffer',
      'XMLHttpRequestResponseType'
    ];
    
    const shouldSuppress = suppressedErrors.some(msg => 
      errorMsg.includes(msg)
    );
    
    if (!shouldSuppress) {
      originalError.apply(console, args);
    }
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>        {/* Only one Router here */}
        <AuthProvider>
          <TermContextProvider>
            <App />
          </TermContextProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
