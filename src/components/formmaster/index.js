/**
 * FormMaster Main View Components
 *
 * Centralized exports for the two main views in FormMasterPage:
 * 1. ManageClassView - For form masters to manage their assigned class
 * 2. EnterScoresView - For subject teachers to enter scores
 *
 * These are high-level view components that:
 * - Orchestrate multiple child components
 * - Handle view-specific logic and layout
 * - Connect to useFormMasterState hook for state management
 *
 * Architecture:
 * - Phase 2: Main view structure with placeholders
 * - Phase 3: Individual tab components will be extracted
 * - Phase 4+: Additional features and optimizations
 *
 * Usage:
 * import { ManageClassView, EnterScoresView } from '@/components/formmaster';
 */

// Main view components
export { default as ManageClassView } from './ManageClassView';
export { default as EnterScoresView } from './EnterScoresView';

// Re-export shared components for convenience
export * from './shared';
