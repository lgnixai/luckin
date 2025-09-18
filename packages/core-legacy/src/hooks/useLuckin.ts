import React, { useContext } from 'react';
import type { IUseLuckinReturn } from '../types';

// This will be provided by the UI package
const LuckinContext = React.createContext<IUseLuckinReturn | null>(null);

export function useLuckin(): IUseLuckinReturn {
  const context = useContext(LuckinContext);
  if (!context) {
    throw new Error('useLuckin must be used within a LuckinProvider');
  }
  return context;
}

export { LuckinContext };
