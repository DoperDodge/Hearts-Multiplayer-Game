import React, { useEffect, useState } from 'react';

interface ToastData {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

let toastId = 0;
const toastListeners: ((toast: ToastData) => void)[] = [];

export function showToast(message: string, type: ToastData['type'] = 'info') {
  const toast: ToastData = { id: ++toastId, message, type };
  toastListeners.forEach(l => l(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const handler = (toast: ToastData) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 3000);
    };
    toastListeners.push(handler);
    return () => {
      const idx = toastListeners.indexOf(handler);
      if (idx >= 0) toastListeners.splice(idx, 1);
    };
  }, []);

  const typeColors = {
    info: 'border-pixel-clubs bg-pixel-surface',
    success: 'border-pixel-green bg-pixel-surface',
    warning: 'border-pixel-gold bg-pixel-surface',
    error: 'border-pixel-accent bg-pixel-surface',
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pixel-panel ${typeColors[toast.type]} text-[8px] font-pixel px-4 py-3 animate-slide-up max-w-[280px]`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
