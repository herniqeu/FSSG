import { ReactNode } from 'react';
import { NavBar } from '../../components/ui/tubelight-navbar';
import { routes, type Route } from '../routes';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const navItems: Route[] = routes.map(({ name, url, icon }) => ({
    name,
    url,
    icon
  }));

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <NavBar items={navItems} />
      <div className="flex-1 relative overflow-hidden">
        {children}
      </div>
    </div>
  );
} 