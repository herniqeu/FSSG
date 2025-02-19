import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const KEYBOARD_SHORTCUTS = {
  WINDOWS: {
    NAVIGATION: {
      LEFT: 'alt+←',
      RIGHT: 'alt+→',
      DISPLAY: {
        LEFT: 'Alt + ←',
        RIGHT: 'Alt + →'
      }
    },
    NOTES: {
      NEW_FILE: 'alt+n',
      EDIT_TITLE: 'alt+e',
      DISPLAY: {
        NEW_FILE: 'Alt + N',
        EDIT_TITLE: 'Alt + E'
      }
    },
    FOCUS: {
      TOGGLE_TIMER: 'alt+t',
      START_FOCUS: 'alt+s',
      DISPLAY: {
        TOGGLE_TIMER: 'Alt + T',
        START_FOCUS: 'Alt + S'
      }
    }
  },
  MAC: {
    NAVIGATION: {
      LEFT: 'alt+←',
      RIGHT: 'alt+→',
      DISPLAY: {
        LEFT: '⌥ + ←',
        RIGHT: '⌥ + →'
      }
    },
    NOTES: {
      NEW_FILE: 'alt+n',
      EDIT_TITLE: 'alt+e',
      DISPLAY: {
        NEW_FILE: '⌥ + N',
        EDIT_TITLE: '⌥ + E'
      }
    },
    FOCUS: {
      TOGGLE_TIMER: 'alt+t',
      START_FOCUS: 'alt+s',
      DISPLAY: {
        TOGGLE_TIMER: '⌥ + T',
        START_FOCUS: '⌥ + S'
      }
    }
  }
} as const;

export type PagePath = "focus" | "notes" | "dashboard";

export const PAGE_ORDER: PagePath[] = [
  "focus",
  "notes",
  "dashboard",
] as const;

// Helper function to get next/previous page in circular order
export function getAdjacentPath(
  currentPath: PagePath,
  direction: "left" | "right"
): PagePath {
  console.log('getAdjacentPath input:', { currentPath, direction });
  
  const currentIndex = PAGE_ORDER.indexOf(currentPath);
  console.log('Current index in PAGE_ORDER:', currentIndex);
  
  if (currentIndex === -1) {
    console.log('Path not found in PAGE_ORDER, returning focus');
    return "focus"; // fallback if somehow unknown
  }

  let nextIndex: number;
  if (direction === "left") {
    // If we're at the first item, wrap around to the last
    nextIndex = currentIndex === 0 ? PAGE_ORDER.length - 1 : currentIndex - 1;
  } else {
    // If we're at the last item, wrap to the first
    nextIndex = currentIndex === PAGE_ORDER.length - 1 ? 0 : currentIndex + 1;
  }

  console.log('Next index:', nextIndex);
  const result = PAGE_ORDER[nextIndex];
  console.log('Returning next path:', result);
  
  return result;
}

export function isInputElement(element: HTMLElement | null): boolean {
  if (!element) return false;
  const tagName = element.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea';
}

// Helper function to detect OS
export function getOS() {
  const platform = navigator.platform.toLowerCase();
  if (platform.includes('mac')) return 'mac';
  return 'windows';
} 