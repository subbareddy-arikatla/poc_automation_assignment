'use client';

import { useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
  };

  const showSuccessToast = (message) => showToast(message, 'success');
  const showErrorToast = (message) => showToast(message, 'error');
  const showWarningToast = (message) => showToast(message, 'warning');

  return { toast, showSuccessToast, showErrorToast, showWarningToast };
}

export function Toast({ toast }) {
  if (!toast.show) return null;

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`${colors[toast.type]} text-white px-6 py-3 rounded-lg shadow-lg`}>
        {toast.message}
      </div>
    </div>
  );
}

