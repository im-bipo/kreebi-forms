import { useCallback, useEffect, useMemo, useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";

const TYPE_COLORS = {
  success: {
    bg: "#e6f1fb",
    border: "#2271b1",
    text: "#1f3f67",
    icon: "#2271b1",
  },
  error: {
    bg: "#feefef",
    border: "#eca3a3",
    text: "#7a2222",
    icon: "#b12d2d",
  },
  warning: {
    bg: "#fff7e8",
    border: "#f1c980",
    text: "#7a4a05",
    icon: "#b06a00",
  },
  info: {
    bg: "#ebf4ff",
    border: "#9ec0f6",
    text: "#17467f",
    icon: "#2271b1",
  },
};

export default function Toast({
  id,
  type = "info",
  title = "",
  message = "",
  actions = [],
  color = {},
  duration = 5000,
  onClose,
}) {
  const [isLeaving, setIsLeaving] = useState(false);

  const palette = useMemo(() => {
    const base = TYPE_COLORS[type] || TYPE_COLORS.info;

    return {
      background: color.bgColor || color.background || base.bg,
      border: color.borderColor || color.border || base.border,
      text: color.textColor || color.text || base.text,
      icon: color.iconColor || color.icon || base.icon,
    };
  }, [color, type]);

  const beginClose = useCallback(() => {
    setIsLeaving(true);
  }, []);

  useEffect(() => {
    if (typeof duration !== "number" || duration <= 0) {
      return undefined;
    }

    const timer = setTimeout(() => {
      beginClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, beginClose]);

  useEffect(() => {
    if (!isLeaving) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onClose?.(id);
    }, 220);

    return () => clearTimeout(timer);
  }, [id, isLeaving, onClose]);

  const handleActionClick = useCallback(
    (action) => {
      if (typeof action?.onClick === "function") {
        action.onClick();
      }

      if (action?.closeOnClick !== false) {
        beginClose();
      }
    },
    [beginClose],
  );

  const hasActions = Array.isArray(actions) && actions.length > 0;
  const hasProgress = typeof duration === "number" && duration > 0;

  return (
    <div
      className={`krefrm-toast krefrm-toast--${type} ${
        isLeaving ? "is-leaving" : ""
      }`}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      style={{
        "--krefrm-toast-bg": palette.background,
        "--krefrm-toast-border": palette.border,
        "--krefrm-toast-text": palette.text,
        "--krefrm-toast-icon": palette.icon,
      }}
    >
      {hasProgress && (
        <div className="krefrm-toast__progress">
          <span
            className="krefrm-toast__progress-bar"
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      )}

      <div className="krefrm-toast__row">
        <div className="krefrm-toast__body">
          {title && <p className="krefrm-toast__title">{title}</p>}
          <p className="krefrm-toast__message">{message}</p>

          {hasActions && (
            <div className="krefrm-toast__actions">
              {actions.map((action, index) => (
                <button
                  key={`${id}_action_${index}`}
                  type="button"
                  className={`krefrm-toast__action ${
                    action?.variant === "primary" ? "is-primary" : ""
                  }`}
                  onClick={() => handleActionClick(action)}
                >
                  {action?.label || __("Action", "kreebi-forms")}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className="krefrm-toast__close"
          onClick={beginClose}
          aria-label={__("Dismiss notification", "kreebi-forms")}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}
