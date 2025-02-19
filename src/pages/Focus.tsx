import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points } from 'three';
import { motion, steps, AnimatePresence } from 'framer-motion';
import { KeyboardShortcuts } from '../components/KeyboardShortcuts';
import { KEYBOARD_SHORTCUTS, getOS } from '../lib/utils';
import { HelpCircle } from 'lucide-react';

interface FocusSession {
  id: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
}

interface ParticleSphereProps {
  isFocusing: boolean;
  // Called when the user has pressed for the required duration (1.5s).
  onLongPress: () => void;
}

/**
 * A particle sphere that rotates slowly while focusing;
 * uses randomly generated positions to create a denser look.
 * Includes a smooth transition when starting/stopping rotation.
 * Now supports a 1.5s press to start focusing.
 */
function ParticleSphere({ isFocusing, onLongPress }: ParticleSphereProps) {
  const sphereRef = useRef<Points>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredRef = useRef(false);

  // Store random point positions for the particle sphere
  const [positions] = useState(() => {
    const numPoints = 2000; // Increase for a denser sphere
    const radius = 2.2; // Increased from 1.4 for a bigger sphere
    const tempPositions = new Float32Array(numPoints * 3);

    for (let i = 0; i < numPoints; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * 2 * Math.PI;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      tempPositions[i * 3] = x;
      tempPositions[i * 3 + 1] = y;
      tempPositions[i * 3 + 2] = z;
    }
    return tempPositions;
  });

  // Keep track of rotation speed in a ref for smoothing
  const rotationSpeed = useRef(0);
  const currentScale = useRef(1);

  // For handling 1.5s press
  const [isPressing, setIsPressing] = useState(false);
  const [pressStartTime, setPressStartTime] = useState<number | null>(null);

  // Reset the long press state when focusing state changes
  useEffect(() => {
    hasTriggeredRef.current = false;
  }, [isFocusing]);

  // onPointerDown: start measuring press time
  const handlePointerDown = () => {
    if (hasTriggeredRef.current) return; // Prevent multiple triggers
    
    setIsPressing(true);
    setPressStartTime(Date.now());
    
    // Clear any existing timeout
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    
    // Set new timeout for long press
    longPressTimeoutRef.current = setTimeout(() => {
      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        onLongPress();
      }
    }, 1500);
  };

  // onPointerUp: cleanup
  const handlePointerUp = () => {
    setIsPressing(false);
    setPressStartTime(null);
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
  };

  // Handle pointer out - ensure smooth transition back
  const handlePointerOut = () => {
    setIsPressing(false);
    setPressStartTime(null);
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);

  // Rotate the particle sphere with smooth transitioning
  // Also animate scale while pressing
  useFrame((_, delta) => {
    // Make the sphere spin more slowly
    const targetSpeed = isFocusing ? 0.02 : 0.05;
    rotationSpeed.current += (targetSpeed - rotationSpeed.current) * 0.1;

    if (sphereRef.current) {
      // Apply rotation
      sphereRef.current.rotation.y += rotationSpeed.current * delta;

      // Calculate target scale based on state
      let targetScale = 1;
      if (isPressing && pressStartTime !== null) {
        const elapsed = Date.now() - pressStartTime;
        const fraction = Math.min(elapsed / 1500, 1);
        // Use easeOutQuad for smooth press animation
        const eased = 1 - Math.pow(1 - fraction, 2);
        targetScale = 1 + 0.2 * eased;
      }

      // Smoothly interpolate current scale to target with slower speed
      currentScale.current += (targetScale - currentScale.current) * (delta * 3);
      sphereRef.current.scale.setScalar(currentScale.current);
    }
  });

  return (
    <points
      ref={sphereRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOut={handlePointerOut}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffa600"
        size={0.03}
        sizeAttenuation
      />
    </points>
  );
}

export default function Focus() {
  const [isFocusing, setIsFocusing] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [focusDuration, setFocusDuration] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // New states for timer configuration
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [configuredMinutes, setConfiguredMinutes] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  // Only keep increment interval state
  const [incrementInterval, setIncrementInterval] = useState<NodeJS.Timeout | null>(null);
  const [incrementType, setIncrementType] = useState<'hours' | 'minutes' | null>(null);
  const [incrementSpeed, setIncrementSpeed] = useState(1);

  const os = getOS();
  const shortcuts = KEYBOARD_SHORTCUTS[os === 'mac' ? 'MAC' : 'WINDOWS'];

  const startIncrementing = (type: 'hours' | 'minutes') => {
    setIncrementType(type);
    setIncrementSpeed(1);
    const interval = setInterval(() => {
      setConfiguredMinutes(prev => {
        const currentValue = prev || 0;
        // Exponential increase: speed doubles every second (10 intervals)
        setIncrementSpeed(speed => Math.min(speed * 1.1, 30));
        return Math.min(currentValue + Math.floor(incrementSpeed), 720);
      });
    }, 100);
    setIncrementInterval(interval);
  };

  const startDecrementing = (type: 'hours' | 'minutes') => {
    setIncrementType(type);
    setIncrementSpeed(1);
    const interval = setInterval(() => {
      setConfiguredMinutes(prev => {
        const currentValue = prev || 0;
        // Exponential increase: speed doubles every second (10 intervals)
        setIncrementSpeed(speed => Math.min(speed * 1.1, 30));
        return Math.max(currentValue - Math.floor(incrementSpeed), 0);
      });
    }, 100);
    setIncrementInterval(interval);
  };

  const stopIncrementing = () => {
    if (incrementInterval) {
      clearInterval(incrementInterval);
      setIncrementInterval(null);
    }
    setIncrementType(null);
    setIncrementSpeed(1);
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (incrementInterval) {
        clearInterval(incrementInterval);
      }
    };
  }, [incrementInterval]);

  // Update focus time and progress every second if focusing
  useEffect(() => {
    console.log('[Focus Debug] Focus effect triggered', { isFocusing, startTime, configuredMinutes });
    
    let interval: NodeJS.Timeout | null = null;
    if (isFocusing && startTime !== null) {
      interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setFocusDuration(elapsed);
        
        // Update progress if timer is configured
        if (configuredMinutes) {
          const progressPercent = Math.min((elapsed / (configuredMinutes * 60)) * 100, 100);
          setProgress(progressPercent);
          
          // End session if time is up
          if (progressPercent >= 100) {
            console.log('[Focus Debug] Timer completed, ending session');
            setIsFocusing(false);
            setStartTime(null);
            
            // Save the session to local storage
            const session: FocusSession = {
              id: crypto.randomUUID(),
              startTime: new Date(startTime).toISOString(),
              endTime: new Date().toISOString(),
              duration: configuredMinutes * 60
            };
            
            const sessions = JSON.parse(localStorage.getItem('focusSessions') || '[]');
            localStorage.setItem('focusSessions', JSON.stringify([...sessions, session]));
          }
        }
      }, 1000);
    }
    return () => {
      if (interval) {
        console.log('[Focus Debug] Cleaning up interval');
        clearInterval(interval);
      }
    };
  }, [isFocusing, startTime, configuredMinutes]);

  // Handle completion message display
  useEffect(() => {
    if (!isFocusing && focusDuration > 0) {
      setShowCompletion(true);
      const timer = setTimeout(() => {
        setShowCompletion(false);
        setFocusDuration(0);
      }, 3000); // Show completion message for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isFocusing, focusDuration]);

  const handleLongPress = () => {
    console.log('[Focus Debug] handleLongPress triggered', { isFocusing, startTime });
    
    if (!isFocusing) {
      // Start focusing
      setIsFocusing(true);
      const now = Date.now();
      setStartTime(now);
      setFocusDuration(0);
      setShowCompletion(false);
      setProgress(0);
      
      // Save session start to local storage
      const session: FocusSession = {
        id: crypto.randomUUID(),
        startTime: new Date(now).toISOString(),
        endTime: null,
        duration: null
      };
      
      const sessions = JSON.parse(localStorage.getItem('focusSessions') || '[]');
      localStorage.setItem('focusSessions', JSON.stringify([...sessions, session]));
    } else {
      // Ending the focus session
      const endTime = new Date().toISOString();
      const duration = Math.floor((Date.now() - (startTime || 0)) / 1000);
      
      setIsFocusing(false);
      setStartTime(null);
      
      // Update the session in local storage
      const sessions = JSON.parse(localStorage.getItem('focusSessions') || '[]');
      const updatedSessions = sessions.map((session: FocusSession) => {
        if (session.endTime === null) {
          return {
            ...session,
            endTime,
            duration
          };
        }
        return session;
      });
      localStorage.setItem('focusSessions', JSON.stringify(updatedSessions));
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 relative">
        <KeyboardShortcuts 
          onToggleTimer={() => setShowTimerModal(true)}
          onStartFocus={handleLongPress}
        />
        {/* Progress bar */}
        {isFocusing && configuredMinutes && (
          <div className="fixed top-0 left-0 w-full h-1 bg-white/10">
            <div 
              className="h-full bg-[#ffa600]/80 transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Timer configuration modal */}
        <AnimatePresence>
          {showTimerModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-[#2C2520]/30 backdrop-blur-sm flex items-center justify-center z-50"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowTimerModal(false);
                }
              }}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ 
                  type: "spring",
                  duration: 0.4,
                  bounce: 0.3
                }}
                className="bg-[#F5F0E6] bg-opacity-95 backdrop-blur-md p-8 rounded-lg shadow-lg ring-1 ring-[#E6D5BC]/50 w-64 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowTimerModal(false)}
                  className="absolute right-4 top-4 text-[#2C2520]/50 hover:text-[#2C2520]/70 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                
                <div className="flex flex-col items-center pt-4">
                  {/* Minutes Display */}
                  <div className="flex flex-col items-center">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onMouseDown={() => startIncrementing('minutes')}
                      onMouseUp={() => stopIncrementing()}
                      onMouseLeave={() => stopIncrementing()}
                      onClick={() => {
                        setConfiguredMinutes(prev => Math.min((prev || 0) + 1, 720));
                      }}
                      className="text-[#2C2520]/60 hover:text-[#2C2520]/80 p-2 transition-colors rounded-full hover:bg-[#E6D5BC]/30"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </motion.button>
                    <div className="text-7xl font-medium text-[#2C2520] my-4 select-none tabular-nums">
                      {configuredMinutes || 0}
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onMouseDown={() => startDecrementing('minutes')}
                      onMouseUp={() => stopIncrementing()}
                      onMouseLeave={() => stopIncrementing()}
                      onClick={() => {
                        setConfiguredMinutes(prev => Math.max((prev || 0) - 1, 0));
                      }}
                      className="text-[#2C2520]/60 hover:text-[#2C2520]/80 p-2 transition-colors rounded-full hover:bg-[#E6D5BC]/30"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.button>
                  </div>
                  <span className="text-[#2C2520]/50 mt-2 font-medium">minutes</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top-right "help" icon with tooltip */}
        <div
          className="absolute top-4 right-4 flex flex-col items-end z-50"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="cursor-pointer bg-white/20 hover:bg-white/30 transition-all duration-200 rounded-full w-8 h-8 flex items-center justify-center backdrop-blur-sm ring-1 ring-white/25">
            <HelpCircle className="w-4 h-4 text-[#363332]/70" />
          </div>
          <div className={`absolute top-full right-0 transition-all duration-300 ease-out ${showTooltip ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}>
            <div className="w-72 mt-3 p-4 bg-white/95 text-[#363332]/90 rounded-lg shadow-lg text-sm backdrop-blur-sm ring-1 ring-black/5">
              <h3 className="font-medium mb-2 text-[#363332]">Shortcuts</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-center">
                  <span className="text-[#363332]/80">Toggle timer</span>
                  <kbd className="px-2 py-1 bg-[#F5F2EA] rounded text-xs text-[#363332]/70">
                    {shortcuts.FOCUS.DISPLAY.TOGGLE_TIMER}
                  </kbd>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-[#363332]/80">Start/Stop focus</span>
                  <kbd className="px-2 py-1 bg-[#F5F2EA] rounded text-xs text-[#363332]/70">
                    {shortcuts.FOCUS.DISPLAY.START_FOCUS}
                  </kbd>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-[#363332]/80">Previous/Next page</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 bg-[#F5F2EA] rounded text-xs text-[#363332]/70">
                      {shortcuts.NAVIGATION.DISPLAY.LEFT}
                    </kbd>
                    <kbd className="px-2 py-1 bg-[#F5F2EA] rounded text-xs text-[#363332]/70">
                      {shortcuts.NAVIGATION.DISPLAY.RIGHT}
                    </kbd>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        <div className="fixed bottom-8 left-8">
          <div className={`text-base uppercase tracking-wider font-medium text-[#363332]/80 transition-all duration-500 ease-in-out ${isFocusing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            Focusing
          </div>
        </div>

        {/* Completion Message - Moved to bottom-center */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
          <div className={`text-base uppercase tracking-wider font-medium text-[#363332]/80 transition-all duration-500 ease-in-out ${showCompletion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            Completed {Math.floor(focusDuration)}s focusing
          </div>
        </div>

        {/* Timer configuration button and status */}
        <div className="fixed bottom-8 right-8 flex flex-col items-end gap-2">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTimerModal(true)}
              className="bg-white/20 hover:bg-white/30 transition-all duration-200 rounded-full p-2 backdrop-blur-sm ring-1 ring-white/25"
            >
              <svg
                className="w-5 h-5 text-[#363332]/70"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </motion.button>
            <AnimatePresence>
              {configuredMinutes && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm text-[#363332]/70 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                    {configuredMinutes}m timer set
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setConfiguredMinutes(null)}
                    className="bg-white/20 hover:bg-white/30 transition-all duration-200 rounded-full p-2 backdrop-blur-sm ring-1 ring-white/25"
                    title="Disable timer"
                  >
                    <svg
                      className="w-4 h-4 text-[#363332]/70"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="relative w-full flex items-center justify-center">
          <Canvas
            style={{
              width: '600px',
              height: '600px',
              pointerEvents: 'auto',
            }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[0, 5, 5]} />
            <ParticleSphere
              isFocusing={isFocusing}
              onLongPress={handleLongPress}
            />
          </Canvas>
        </div>
      </div>
    </>
  );
}
