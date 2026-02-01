import { useState, useCallback, useMemo } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastListeners: ((toast: Toast) => void)[] = [];
let toasts: Toast[] = [];

export function useToast() {
  const [, setTick] = useState(0);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const newToast: Toast = {
      ...toast,
      id: Math.random().toString(36).substring(7),
    };
    toasts.push(newToast);
    toastListeners.forEach(listener => listener(newToast));
    setTick(Math.random());

    // Auto remove after 3 seconds
    setTimeout(() => {
      removeToast(newToast.id);
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    toasts = toasts.filter(t => t.id !== id);
    setTick(Math.random());
  }, []);

  const toast = useMemo(() => ({
    success: (message: string) => addToast({ message, type: 'success' }),
    error: (message: string) => addToast({ message, type: 'error' }),
    info: (message: string) => addToast({ message, type: 'info' }),
  }), [addToast]);

  return {
    toast,
    toasts,
    removeToast,
  };
}
