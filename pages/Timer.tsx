import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMemory } from '../contexts/MemoryContext';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';

export const Timer: React.FC = () => {
  const { updateMemory, memory } = useMemory();
  const getModeDuration = useCallback((targetMode: 'focus' | 'short' | 'long') => {
    if (targetMode === 'focus') return 25 * 60;
    if (targetMode === 'short') return 5 * 60;
    return 15 * 60;
  }, []);

  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'short' | 'long'>('focus');
  const [timeLeft, setTimeLeft] = useState(getModeDuration('focus'));
  const [sessions, setSessions] = useState(0);
  const endTimeRef = useRef<number | null>(null);
  const completionHandledRef = useRef(false);
  const intervalRef = useRef<number | null>(null);

  const handleComplete = useCallback(() => {
    completionHandledRef.current = false;
    if (mode === 'focus') {
      const newSessions = sessions + 1;
      setSessions(newSessions);
      updateMemory({ 
        pomodoroSessions: memory.pomodoroSessions + 1,
        totalFocusTime: memory.totalFocusTime + 25 
      });

      if (newSessions % 4 === 0) {
        setMode('long');
        setTimeLeft(getModeDuration('long'));
      } else {
        setMode('short');
        setTimeLeft(getModeDuration('short'));
      }
    } else {
      setMode('focus');
      setTimeLeft(getModeDuration('focus'));
    }
  }, [mode, sessions, updateMemory, memory.pomodoroSessions, memory.totalFocusTime, getModeDuration]);

  useEffect(() => {
    if (!isActive) return;

    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
    }

    const tick = () => {
      if (!endTimeRef.current) return;
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0 && !completionHandledRef.current) {
        completionHandledRef.current = true;
        setIsActive(false);
        endTimeRef.current = null;
        handleComplete();
      }
    };

    tick();
    intervalRef.current = window.setInterval(tick, 100);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isActive, handleComplete, timeLeft]);

  // Handle page visibility changes (user switches tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden - timer continues in background via endTimeRef
        return;
      } else {
        // Tab visible again - recalculate remaining time
        if (isActive && endTimeRef.current) {
          const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive]);

  const toggleTimer = () => {
    if (isActive) {
      setIsActive(false);
      endTimeRef.current = null;
      return;
    }

    completionHandledRef.current = false;
    setIsActive(true);
  };

  const resetTimer = () => {
    setIsActive(false);
    completionHandledRef.current = false;
    endTimeRef.current = null;
    setMode('focus');
    setTimeLeft(getModeDuration('focus'));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const total = getModeDuration(mode);
    return ((total - timeLeft) / total) * 100;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
       <div className="mb-8 text-center">
         <h2 className="font-serif text-3xl font-bold text-slate-900">Đồng hồ Pomodoro</h2>
         <p className="text-slate-500 mt-2">Phương pháp tập trung tiêu chuẩn</p>
       </div>

       <div className="relative w-80 h-80 flex items-center justify-center bg-white rounded-full shadow-2xl border-8 border-cream-100">
         <div 
            className="absolute inset-0 rounded-full border-8 border-sage-500 transition-all duration-1000"
            style={{ 
              clipPath: `inset(0 0 ${100 - getProgress()}% 0)`
            }}
         />
         
         <div className="z-10 text-center">
            <div className={`text-6xl font-bold font-mono text-slate-800 mb-2`}>
              {formatTime(timeLeft)}
            </div>
            <p className="uppercase tracking-widest text-sm font-semibold text-slate-400">
              {mode === 'focus' ? 'Tập trung' : 'Nghỉ ngơi'}
            </p>
         </div>
       </div>

       <div className="flex gap-6 mt-12">
         <button 
           onClick={toggleTimer}
           className="w-16 h-16 rounded-2xl bg-slate-800 text-cream-50 flex items-center justify-center hover:bg-slate-700 hover:scale-105 transition-all shadow-lg shadow-slate-800/20"
         >
           {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
         </button>
         <button 
           onClick={resetTimer}
           className="w-16 h-16 rounded-2xl bg-white text-slate-600 border border-cream-200 flex items-center justify-center hover:bg-cream-50 hover:scale-105 transition-all"
         >
           <RotateCcw className="w-6 h-6" />
         </button>
       </div>

       <div className="mt-12 flex gap-8">
         <div className={`flex flex-col items-center ${mode === 'focus' ? 'opacity-100' : 'opacity-40'}`}>
            <Brain className="w-6 h-6 mb-2 text-slate-700" />
            <span className="text-xs font-bold uppercase tracking-wider">Tập trung</span>
            <span className="text-xs text-slate-400">25 phút</span>
         </div>
         <div className="w-px h-10 bg-cream-300"></div>
         <div className={`flex flex-col items-center ${mode !== 'focus' ? 'opacity-100' : 'opacity-40'}`}>
            <Coffee className="w-6 h-6 mb-2 text-sage-600" />
            <span className="text-xs font-bold uppercase tracking-wider">Nghỉ</span>
            <span className="text-xs text-slate-400">5 phút</span>
         </div>
       </div>
    </div>
  );
};
