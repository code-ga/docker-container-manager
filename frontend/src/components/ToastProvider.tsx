import React, { useEffect, useState } from 'react';
import { ToastContainer, type ToastProps } from './ui/Toast';
import { toastManager } from '../lib/toast';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  useEffect(() => {
    // Subscribe to toast manager updates
    const unsubscribe = toastManager.subscribe((toastMessages) => {
      // Convert ToastMessage[] to ToastProps[]
      const convertedToasts: ToastProps[] = toastMessages.map(msg => ({
        id: msg.id,
        type: msg.type,
        title: msg.title,
        message: msg.message,
        duration: msg.duration,
        onClose: (id: string) => toastManager.removeToast(id)
      }));
      setToasts(convertedToasts);
    });

    return unsubscribe;
  }, []);

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onRemove={(id) => toastManager.removeToast(id)} />
    </>
  );
};