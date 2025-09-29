// Global toast manager for use outside React components
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

class ToastManager {
  private listeners: ((toasts: ToastMessage[]) => void)[] = [];
  private toasts: ToastMessage[] = [];

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  subscribe(listener: (toasts: ToastMessage[]) => void): () => void {
    this.listeners.push(listener);
    // Immediately call with current toasts
    listener([...this.toasts]);

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  addToast(type: ToastMessage['type'], title: string, message?: string, duration = 5000): string {
    const id = this.generateId();
    const toast: ToastMessage = {
      id,
      type,
      title,
      message,
      duration
    };

    this.toasts.push(toast);
    this.notifyListeners();

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }

    return id;
  }

  removeToast(id: string): void {
    const index = this.toasts.findIndex(toast => toast.id === id);
    if (index > -1) {
      this.toasts.splice(index, 1);
      this.notifyListeners();
    }
  }

  showSuccess(title: string, message?: string): string {
    return this.addToast('success', title, message);
  }

  showError(title: string, message?: string): string {
    return this.addToast('error', title, message);
  }

  showWarning(title: string, message?: string): string {
    return this.addToast('warning', title, message);
  }

  showInfo(title: string, message?: string): string {
    return this.addToast('info', title, message);
  }

  getToasts(): ToastMessage[] {
    return [...this.toasts];
  }
}

export const toastManager = new ToastManager();