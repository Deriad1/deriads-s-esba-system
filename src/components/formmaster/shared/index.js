/**
 * FormMaster Shared Components
 *
 * Centralized exports for all shared/reusable components used
 * across different tabs and views in the FormMaster feature.
 *
 * These components are designed to be:
 * - Reusable across multiple tabs
 * - Self-contained with clear prop interfaces
 * - Well-documented with PropTypes
 * - Consistent in styling and behavior
 *
 * Usage:
 * import { DraftIndicator, SyncStatusPanel } from '@/components/formmaster/shared';
 */

// Status and sync indicators
export { default as DraftIndicator } from './DraftIndicator';
export { default as SyncStatusPanel } from './SyncStatusPanel';

// Data tables and displays
export { default as ScoresTable } from './ScoresTable';

// Additional shared components can be exported here as they are created
// Examples for future phases:
// export { default as StudentRow } from './StudentRow';
// export { default as LoadingOverlay } from './LoadingOverlay';
// export { default as ErrorMessage } from './ErrorMessage';
