import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

export const DebugOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<{ type: 'log' | 'error' | 'warn'; msg: string; time: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Intercept Console
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (type: 'log' | 'error' | 'warn', args: any[]) => {
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      const time = new Date().toLocaleTimeString().split(' ')[0];
      setLogs(prev => [...prev.slice(-49), { type, msg, time }]); // Keep last 50
    };

    console.log = (...args) => {
      addLog('log', args);
      originalLog.apply(console, args);
    };
    console.error = (...args) => {
      addLog('error', args);
      originalError.apply(console, args);
    };
    console.warn = (...args) => {
      addLog('warn', args);
      originalWarn.apply(console, args);
    };

    // 2. Log System Capabilities on Mount
    setTimeout(() => {
      console.log("--- SYSTEM CHECK ---");
      console.log("User Agent:", navigator.userAgent);
      
      const checkCSS = (prop: string, val: string) => {
        const supported = CSS.supports(prop, val);
        console.log(`CSS ${prop}: ${val} = ${supported ? '✅' : '❌'}`);
      };

      // FIX: Use percentages/units so strict parsers return true
      checkCSS('clip-path', 'polygon(0% 0%, 10% 10%, 20% 0%)');
      checkCSS('-webkit-clip-path', 'polygon(0% 0%, 10% 10%, 20% 0%)');
      checkCSS('backdrop-filter', 'blur(10px)');
      checkCSS('-webkit-backdrop-filter', 'blur(10px)');
      checkCSS('transform-style', 'preserve-3d');
      checkCSS('-webkit-transform-style', 'preserve-3d');
      console.log("--------------------");
    }, 1000);

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-0 left-0 z-[9999] bg-red-600 text-white text-[10px] px-2 py-1 opacity-50 hover:opacity-100 font-mono"
      >
        DEBUG LOGS
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black/90 text-green-400 font-mono text-xs pointer-events-auto">
      <div className="flex justify-between items-center p-2 border-b border-green-900 bg-black">
        <span className="font-bold">CONSOLE DEBUGGER</span>
        <div className="flex gap-2">
            <button onClick={() => setLogs([])} className="border border-green-700 px-2 py-1">CLEAR</button>
            <button onClick={() => setIsOpen(false)} className="bg-red-900 text-white px-3 py-1">CLOSE</button>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1">
        {logs.map((l, i) => (
          <div key={i} className={cn("border-b border-green-900/30 pb-0.5 break-all", 
            l.type === 'error' && "text-red-400",
            l.type === 'warn' && "text-yellow-400"
          )}>
            <span className="opacity-50 mr-2">[{l.time}]</span>
            {l.msg}
          </div>
        ))}
      </div>
    </div>
  );
};