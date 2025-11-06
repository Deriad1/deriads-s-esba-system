import React, { createContext, useContext, useState, useCallback } from "react";

const LoadingContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState({});

  const setLoading = useCallback((key, isLoading, message = null) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        isLoading,
        message
      }
    }));
  }, []);

  const isLoading = useCallback((key) => {
    return loadingStates[key]?.isLoading || false;
  }, [loadingStates]);

  const getLoadingMessage = useCallback((key) => {
    return loadingStates[key]?.message || "Loading...";
  }, [loadingStates]);

  const clearLoading = useCallback((key) => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  return (
    <LoadingContext.Provider value={{ 
      loadingStates, 
      setLoading, 
      isLoading, 
      getLoadingMessage,
      clearLoading
    }}>
      {children}
    </LoadingContext.Provider>
  );
};

export default LoadingContext;