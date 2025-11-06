import { useReducer, useCallback } from 'react';

// Modal action types
const OPEN_MODAL = 'OPEN_MODAL';
const CLOSE_MODAL = 'CLOSE_MODAL';
const CLOSE_ALL_MODALS = 'CLOSE_ALL_MODALS';

// Reducer to manage modal state
const modalReducer = (state, action) => {
  switch (action.type) {
    case OPEN_MODAL:
      return {
        ...state,
        [action.modalName]: {
          isOpen: true,
          data: action.data || null
        }
      };
    case CLOSE_MODAL:
      return {
        ...state,
        [action.modalName]: {
          isOpen: false,
          data: null
        }
      };
    case CLOSE_ALL_MODALS:
      return Object.keys(state).reduce((acc, key) => {
        acc[key] = { isOpen: false, data: null };
        return acc;
      }, {});
    default:
      return state;
  }
};

/**
 * Custom hook to manage multiple modal states
 * @param {Array} modalNames - Array of modal names to manage
 * @returns {Object} - Object containing modal states and control functions
 */
export const useModalManager = (modalNames = []) => {
  // Initialize state with all modals closed
  const initialState = modalNames.reduce((acc, name) => {
    acc[name] = { isOpen: false, data: null };
    return acc;
  }, {});

  const [state, dispatch] = useReducer(modalReducer, initialState);

  // Open a specific modal with optional data
  const openModal = useCallback((modalName, data = null) => {
    dispatch({ type: OPEN_MODAL, modalName, data });
  }, []);

  // Close a specific modal
  const closeModal = useCallback((modalName) => {
    dispatch({ type: CLOSE_MODAL, modalName });
  }, []);

  // Close all modals
  const closeAllModals = useCallback(() => {
    dispatch({ type: CLOSE_ALL_MODALS });
  }, []);

  // Helper function to check if a modal is open
  const isModalOpen = useCallback((modalName) => {
    return state[modalName]?.isOpen || false;
  }, [state]);

  // Helper function to get modal data
  const getModalData = useCallback((modalName) => {
    return state[modalName]?.data || null;
  }, [state]);

  return {
    modalStates: state,
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    getModalData
  };
};

export default useModalManager;
