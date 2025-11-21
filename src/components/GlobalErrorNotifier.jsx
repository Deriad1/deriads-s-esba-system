import { useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';

/**
 * GlobalErrorNotifier
 * Listens for global errors and unhandled promise rejections
 * and displays them using the notification system.
 */
const GlobalErrorNotifier = () => {
    const { showNotification } = useNotification();

    useEffect(() => {
        const handleError = (event) => {
            // Ignore ResizeObserver loop errors which are benign
            if (event.message && event.message.includes('ResizeObserver loop limit exceeded')) {
                return;
            }

            // Ignore extension errors
            if (event.filename && (
                event.filename.includes('contentscript.js') ||
                event.filename.includes('moz-extension') ||
                event.filename.includes('chrome-extension')
            )) {
                return;
            }

            console.error('Global error caught:', event.error);

            showNotification({
                type: 'error',
                title: 'System Error',
                message: event.message || 'An unexpected error occurred',
                duration: 7000
            });
        };

        const handleUnhandledRejection = (event) => {
            // Ignore benign errors
            if (event.reason && event.reason.message && (
                event.reason.message.includes('ResizeObserver loop limit exceeded') ||
                event.reason.message.includes('quota exceeded')
            )) {
                return;
            }

            console.error('Unhandled rejection caught:', event.reason);

            showNotification({
                type: 'error',
                title: 'Async Error',
                message: event.reason?.message || 'An operation failed unexpectedly',
                duration: 7000
            });
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, [showNotification]);

    return null;
};

export default GlobalErrorNotifier;
