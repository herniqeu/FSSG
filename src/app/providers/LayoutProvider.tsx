import { ReactNode } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { RouteTransitionProvider } from './RouteTransitionProvider';

interface LayoutProviderProps {
  children: ReactNode;
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  return (
    <RouteTransitionProvider>
      <MainLayout>
        {children}
      </MainLayout>
    </RouteTransitionProvider>
  );
} 