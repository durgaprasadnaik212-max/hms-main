import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
}

interface SocketContextType {
  socket: Socket | null;
  addToast: (toast: Omit<Toast, 'id'>) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('emergency-alert', (data: any) => {
      addToast({
        type: 'error',
        title: 'EMERGENCY ALERT',
        message: `${data.type} at ${data.location}`,
      });
      // Play sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log("Audio play failed", e));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <SocketContext.Provider value={{ socket, addToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              layout
              className={cn(
                "pointer-events-auto p-4 rounded-lg shadow-lg border flex items-start gap-3 relative overflow-hidden",
                toast.type === 'error' && "bg-red-50 border-red-200 text-red-900",
                toast.type === 'success' && "bg-emerald-50 border-emerald-200 text-emerald-900",
                toast.type === 'warning' && "bg-amber-50 border-amber-200 text-amber-900",
                toast.type === 'info' && "bg-blue-50 border-blue-200 text-blue-900",
              )}
            >
              {toast.type === 'error' && <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />}
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />}
              {toast.type === 'info' && <Info className="w-5 h-5 shrink-0 text-blue-600" />}
              
              <div className="flex-1">
                {toast.title && <div className="font-semibold text-sm mb-1">{toast.title}</div>}
                <div className="text-sm opacity-90">{toast.message}</div>
              </div>

              <button 
                onClick={() => removeToast(toast.id)}
                className="text-current opacity-50 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
