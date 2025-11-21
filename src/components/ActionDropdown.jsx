import { useState, useRef, useEffect } from 'react';

/**
 * Mobile-friendly dropdown component for action buttons
 * Features:
 * - Touch-friendly targets (min 48px height)
 * - Click-outside-to-close
 * - Smooth animations
 * - Accessible keyboard navigation
 */
const ActionDropdown = ({
    label,
    icon = '▼',
    items = [],
    disabled = false,
    buttonClassName = '',
    dropdownClassName = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    const handleItemClick = (item) => {
        if (item.onClick) {
            item.onClick();
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Dropdown Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full glass-button px-4 py-3 rounded-xl text-white border-2 border-white/30 hover:border-white/50 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg flex items-center justify-center gap-2 ${buttonClassName}`}
                style={{ minHeight: '44px', fontSize: '16px' }}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <span>{label}</span>
                <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    {icon}
                </span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className={`absolute z-50 mt-2 w-full min-w-[200px] bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 overflow-hidden animate-slideDown ${dropdownClassName}`}
                    role="menu"
                >
                    {items.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => handleItemClick(item)}
                            disabled={item.disabled}
                            className={`w-full px-4 py-3 text-left transition-colors font-medium flex items-center gap-2 ${item.disabled
                                    ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                                    : 'hover:bg-blue-50 text-gray-800 hover:text-blue-600'
                                } ${index !== items.length - 1 ? 'border-b border-gray-200' : ''}`}
                            style={{ minHeight: '48px', fontSize: '15px' }}
                            role="menuitem"
                            title={item.title || ''}
                        >
                            {item.icon && <span className="text-lg">{item.icon}</span>}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ActionDropdown;
