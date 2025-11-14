import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * ModalPortal Component
 * Renders modal content in a React Portal at document.body level
 * Ensures modals always appear on top of page content
 */
const ModalPortal = ({ children, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';

      // Handle escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape' && onClose) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);

      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(children, document.body);
};

export default ModalPortal;
