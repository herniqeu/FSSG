import { createContext, useContext, ReactNode } from 'react';
import { useRouteTransition } from '../hooks/useRouteTransition';
import { PathDirection } from '../types/navigation';

interface RouteTransitionContextType {
  direction: PathDirection;
  pathname: string;
}

const RouteTransitionContext = createContext<RouteTransitionContextType | null>(null);

interface RouteTransitionProviderProps {
  children: ReactNode;
}

export function RouteTransitionProvider({ children }: RouteTransitionProviderProps) {
  const transition = useRouteTransition();

  return (
    <RouteTransitionContext.Provider value={transition}>
      {children}
    </RouteTransitionContext.Provider>
  );
}

export function useRouteTransitionContext() {
  const context = useContext(RouteTransitionContext);
  if (!context) {
    throw new Error('useRouteTransitionContext must be used within a RouteTransitionProvider');
  }
  return context;
} 