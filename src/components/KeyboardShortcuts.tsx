import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { KEYBOARD_SHORTCUTS, isInputElement, getAdjacentPath, PagePath, getOS } from '../lib/utils';
import { Dialog } from './ui/dialog';
import { useState } from 'react';

interface KeyboardShortcutsProps {
  onToggleTimer?: () => void;
  onStartFocus?: () => void;
  onCreateNote?: () => void;
  onEditTitle?: () => void;
}

export function KeyboardShortcuts({
  onToggleTimer,
  onStartFocus,
  onCreateNote,
  onEditTitle
}: KeyboardShortcutsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const os = getOS();
  const shortcuts = KEYBOARD_SHORTCUTS[os === 'mac' ? 'MAC' : 'WINDOWS'];

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Show shortcuts dialog when pressing '?' with Alt/Option
      if (event.altKey && event.key === '?') {
        event.preventDefault();
        setShowShortcuts(true);
        return;
      }

      const { altKey, key } = event;
      const shortcut = `${altKey ? 'alt+' : ''}${key === 'ArrowLeft' ? '←' : key === 'ArrowRight' ? '→' : key.toLowerCase()}`;

      // Navigation shortcuts should work even when in input
      if (shortcut === shortcuts.NAVIGATION.LEFT || shortcut === shortcuts.NAVIGATION.RIGHT) {
        event.preventDefault();
        
        let currentPath: PagePath;
        if (location.pathname === '/') {
          currentPath = 'dashboard';
        } else {
          const path = location.pathname.slice(1);
          currentPath = (path === 'dashboard' ? 'dashboard' : path) as PagePath;
        }
        
        const direction = shortcut === shortcuts.NAVIGATION.LEFT ? 'left' : 'right';
        const nextPath = getAdjacentPath(currentPath, direction);
        const targetPath = nextPath === 'dashboard' ? '/' : `/${nextPath}`;

        navigate(targetPath, { state: { from: location.pathname } });
        return;
      }

      // Don't trigger other shortcuts if user is typing in an input
      if (isInputElement(document.activeElement as HTMLElement)) {
        return;
      }

      // Notes page shortcuts
      if (location.pathname === '/notes') {
        if (shortcut === shortcuts.NOTES.NEW_FILE && onCreateNote) {
          event.preventDefault();
          onCreateNote();
        } else if (shortcut === shortcuts.NOTES.EDIT_TITLE && onEditTitle) {
          event.preventDefault();
          onEditTitle();
        }
      }

      // Focus page shortcuts
      if (location.pathname === '/focus') {
        if (shortcut === shortcuts.FOCUS.TOGGLE_TIMER && onToggleTimer) {
          event.preventDefault();
          onToggleTimer();
        } else if (shortcut === shortcuts.FOCUS.START_FOCUS && onStartFocus) {
          event.preventDefault();
          onStartFocus();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, location.pathname, onToggleTimer, onStartFocus, onCreateNote, onEditTitle, shortcuts]);

  return (
    <>
      <Dialog 
        isOpen={showShortcuts} 
        onClose={() => setShowShortcuts(false)}
        className="max-w-lg"
      >
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4">Keyboard Shortcuts ({os === 'mac' ? 'Mac' : 'Windows'})</h2>
            <p className="text-sm text-gray-600 mb-4">
              Press {os === 'mac' ? '⌥ + ?' : 'Alt + ?'} to show this dialog
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Navigation</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Previous Page</div>
                <div className="font-mono">{shortcuts.NAVIGATION.DISPLAY.LEFT}</div>
                <div>Next Page</div>
                <div className="font-mono">{shortcuts.NAVIGATION.DISPLAY.RIGHT}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>New Note</div>
                <div className="font-mono">{shortcuts.NOTES.DISPLAY.NEW_FILE}</div>
                <div>Edit Title</div>
                <div className="font-mono">{shortcuts.NOTES.DISPLAY.EDIT_TITLE}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Focus</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Toggle Timer</div>
                <div className="font-mono">{shortcuts.FOCUS.DISPLAY.TOGGLE_TIMER}</div>
                <div>Start Focus</div>
                <div className="font-mono">{shortcuts.FOCUS.DISPLAY.START_FOCUS}</div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
} 