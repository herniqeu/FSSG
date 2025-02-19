import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Brain, BookText, LayoutDashboard } from 'lucide-react';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { NavBar } from './components/ui/tubelight-navbar';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import Focus from './pages/Focus';
import Notes from './pages/Notes';
import Dashboard from './pages/Dashboard';

function RootRouteHandler() {
  const location = useLocation();
  
  // If we're coming from another page (has state), show Dashboard
  if (location.state?.from) {
    return <Dashboard />;
  }
  
  // For initial load or direct URL access, redirect to Notes
  return <Navigate to="/notes" replace />;
}

function App() {
  const location = useLocation();

  const navItems = [
    { name: 'Focus', url: '/focus', icon: Brain },
    { name: 'Notes', url: '/notes', icon: BookText },
    { name: 'Dashboard', url: '/', icon: LayoutDashboard }
  ];

  const getDirection = (pathname: string) => {
    const paths = ['focus', 'notes', ''];
    const currentIndex = paths.indexOf(pathname.split('/')[1]);
    const prevPath = location.state?.from || '';
    const prevIndex = paths.indexOf(prevPath.split('/')[1]);

    return currentIndex > prevIndex ? -1 : 1;
  };

  const pageVariants: Variants = {
    initial: (direction: number) => ({
      x: direction > 0 ? '-50%' : '50%',
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        x: { 
          type: "tween", 
          duration: 0.3,
          ease: "easeOut"
        },
        opacity: { 
          duration: 0.2
        }
      }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '50%' : '-50%',
      opacity: 0,
      transition: {
        x: { 
          type: "tween",
          duration: 0.3,
          ease: "easeIn"
        },
        opacity: { 
          duration: 0.2
        }
      }
    })
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <KeyboardShortcuts />
      <NavBar items={navItems} />
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={getDirection(location.pathname)}>
          <motion.div
            key={location.pathname}
            custom={getDirection(location.pathname)}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 overflow-hidden"
          >
            <Routes location={location}>
              <Route path="/notes" element={<Notes />} />
              <Route path="/focus" element={<Focus />} />
              <Route 
                path="/" 
                element={<RootRouteHandler />}
              />
              <Route 
                path="*" 
                element={<Navigate to="/notes" replace />}
              />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;