import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext.jsx";
import { GlobalSettingsProvider } from "./context/GlobalSettingsContext.jsx";
import { TermContextProvider } from "./context/TermContext.jsx";
import { OnlineOfflineProvider } from "./context/OnlineOfflineContext.jsx";
import { UsersProvider } from "./context/UsersContext.jsx";
import "./index.css";

// Suppress PDF.js worker warnings and other browser extension errors
if (typeof window !== 'undefined') {
  // keep window globals if some libs expect them
  if (!window.global) window.global = window;
  // any other small shims can go here
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <GlobalSettingsProvider>
            <TermContextProvider>
              <OnlineOfflineProvider>
                <UsersProvider>
                  <App />
                </UsersProvider>
              </OnlineOfflineProvider>
            </TermContextProvider>
          </GlobalSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

