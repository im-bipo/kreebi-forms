import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "@wordpress/element";
import ToastContainer from "./ToastContainer";

const ToastContext = createContext(null);
const DEFAULT_TOAST_DURATION = 5000;

function createToastId() {
  return `krefrm_toast_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((toastId) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  const show = useCallback((payload) => {
    const config =
      typeof payload === "string" ? { message: payload || "" } : payload || {};

    const nextToast = {
      id: config.id || createToastId(),
      type: config.type || "info",
      title: config.title || "",
      message: config.message || "",
      actions: Array.isArray(config.actions) ? config.actions : [],
      icon: config.icon || null,
      color: config.color || {},
      duration:
        typeof config.duration === "number"
          ? config.duration
          : DEFAULT_TOAST_DURATION,
    };

    setToasts((prev) => [...prev, nextToast]);
    return nextToast.id;
  }, []);

  const toastApi = useMemo(
    () => ({
      show,
      dismiss,
      clear,
      success: (message, options = {}) =>
        show({ ...options, type: "success", message }),
      error: (message, options = {}) =>
        show({ ...options, type: "error", message }),
      warning: (message, options = {}) =>
        show({ ...options, type: "warning", message }),
      info: (message, options = {}) =>
        show({ ...options, type: "info", message }),
    }),
    [clear, dismiss, show],
  );

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      <ToastContainer toasts={toasts} onClose={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}
