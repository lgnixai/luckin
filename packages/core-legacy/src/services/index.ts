/**
 * Legacy Services - Compatibility wrappers for new service architecture
 * @author LGINX AI Corporation
 * @version 3.0.0
 * @deprecated Use services from @lgnixai/luckin-core instead
 */

// Re-export new services
export * from '@lgnixai/luckin-core';

// Legacy service wrappers
export * from './legacy-editor-service';
export * from './legacy-theme-service';
export * from './legacy-command-service';
export * from './legacy-notification-service';