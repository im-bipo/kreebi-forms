import Toast from "./Toast";

export default function ToastContainer({ toasts = [], onClose }) {
  if (!Array.isArray(toasts) || toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="krefrm-toast-viewport"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}
