import React, { useRef, useEffect } from 'react';

/**
 * Mobile-optimized score entry component
 * Features:
 * - Numeric keypad activation on mobile
 * - Tab/Enter key navigation
 * - Large touch targets
 * - Auto-focus and auto-advance
 */
const MobileScoreEntry = ({
  student,
  value,
  onChange,
  onNext,
  autoFocus = false,
  maxScore = 100,
  placeholder = "Score"
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e) => {
    // Enter or Tab key moves to next field
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (onNext) {
        onNext();
      }
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;

    // Only allow numbers and decimal point
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      const numVal = parseFloat(val);

      // Validate range
      if (val === '' || (numVal >= 0 && numVal <= maxScore)) {
        onChange(val);

        // Auto-advance if score is complete (2-3 digits entered)
        if (val.length >= 2 && !val.includes('.') && numVal <= maxScore) {
          setTimeout(() => {
            if (onNext) onNext();
          }, 300); // Small delay for better UX
        }
      }
    }
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="number"
        inputMode="decimal"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        min="0"
        max={maxScore}
        step="0.01"
        className="w-full px-4 py-3 text-lg font-semibold text-center border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
        aria-label={`Score for ${student?.name || 'student'}`}
      />
    </div>
  );
};

export default MobileScoreEntry;
