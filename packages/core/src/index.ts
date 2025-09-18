// 新核心包导出

export * from './foundation';
export * from './services/base';

// Temporary legacy re-exports for UI compatibility during refactor (types-only)
// Note: legacy type interfaces are available from the legacy package directly
export * from './compat';