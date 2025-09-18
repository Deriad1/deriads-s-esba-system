import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTermKey, getCurrentTermKey } from "../utils/termHelpers";

const TermContext = createContext();

export const useTermContext = () => {
  const context = useContext(TermContext);
  if (!context) {
    throw new Error('useTermContext must be used within a TermContextProvider');
  }
  return context;
};

export const TermContextProvider = ({ children }) => {
  const [currentTerm, setCurrentTerm] = useState('First Term');
  const [currentYear, setCurrentYear] = useState('2024/2025');

  // Term-specific data operations
  const getTermData = (dataType) => {
    const key = getCurrentTermKey(dataType);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  };

  const setTermData = (dataType, data) => {
    const key = getCurrentTermKey(dataType);
    localStorage.setItem(key, JSON.stringify(data));
  };

  const clearTermData = (dataType) => {
    const key = getCurrentTermKey(dataType);
    localStorage.removeItem(key);
  };

  const clearAllTermData = () => {
    const dataTypes = ['teachers', 'learners', 'students', 'classes', 'grades', 'attendance'];
    dataTypes.forEach(type => clearTermData(type));
  };

  // Initialize term and year from localStorage
  useEffect(() => {
    const storedTerm = localStorage.getItem('currentTerm');
    const storedYear = localStorage.getItem('currentAcademicYear');
    
    if (storedTerm) {
      setCurrentTerm(storedTerm);
    }
    
    if (storedYear) {
      setCurrentYear(storedYear);
    }
  }, []);

  // Update localStorage when term or year changes
  useEffect(() => {
    localStorage.setItem('currentTerm', currentTerm);
    localStorage.setItem('currentAcademicYear', currentYear);
  }, [currentTerm, currentYear]);

  const value = {
    currentTerm,
    currentYear,
    setCurrentTerm,
    setCurrentYear,
    getTermKey,
    getCurrentTermKey,
    getTermData,
    setTermData,
    clearTermData,
    clearAllTermData,
    
    // Utility functions
    getAvailableTerms: () => ['First Term', 'Second Term', 'Third Term'],
    getTermProgress: () => {
      const terms = ['First Term', 'Second Term', 'Third Term'];
      const currentIndex = terms.indexOf(currentTerm);
      return {
        current: currentIndex + 1,
        total: terms.length,
        percentage: ((currentIndex + 1) / terms.length) * 100
      };
    },
    
    // Check if this is a fresh term (no data exists)
    isTermFresh: (dataType) => {
      const data = getTermData(dataType);
      return !data || data.length === 0;
    },
    
    // Get all terms data for current academic year
    getAllTermsData: (dataType) => {
      const terms = ['First Term', 'Second Term', 'Third Term'];
      const allData = {};
      
      terms.forEach(term => {
        const key = getTermKey(term, currentYear, dataType);
        const data = localStorage.getItem(key);
        allData[term] = data ? JSON.parse(data) : [];
      });
      
      return allData;
    }
  };

  return (
    <TermContext.Provider value={value}>
      {children}
    </TermContext.Provider>
  );
};

export default TermContext;