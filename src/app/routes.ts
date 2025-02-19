import { Home, BookOpen, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Route {
  name: string;
  url: string;
  icon: LucideIcon;
}

export const routes: Route[] = [
  {
    name: 'Focus',
    url: '/focus',
    icon: Target
  },
  {
    name: 'Notes',
    url: '/notes',
    icon: BookOpen
  },
  {
    name: 'Dashboard',
    url: '/',
    icon: Home
  }
]; 