import { __ } from "@wordpress/i18n";
import { DASHBOARD_SECTIONS } from "./dashboard-sections-meta";

export default function ScreenOptionsModal({
  isOpen,
  onOpen,
  onClose,
  visibility,
  onToggleSection,
}) {
  if (!isOpen) {
    return (
      <button
        type="button"
        className="krefrm-dashboard-screen-options-fab"
        aria-haspopup="dialog"
        aria-expanded="false"
        aria-label={__("Open dashboard settings", "kreebi-forms")}
        onClick={onOpen}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        className="krefrm-dashboard-screen-options-fab"
        aria-haspopup="dialog"
        aria-expanded="true"
        aria-label={__("Open dashboard settings", "kreebi-forms")}
        onClick={onOpen}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      <div
        className="krefrm-dashboard-screen-options-overlay"
        role="presentation"
        onClick={onClose}
      >
        <div
          className="krefrm-dashboard-screen-options-modal"
          role="dialog"
          aria-modal="true"
          aria-label={__("Dashboard screen options", "kreebi-forms")}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="krefrm-dashboard-screen-options-modal-head">
            <h3 className="krefrm-dashboard-screen-options-modal-title">
              {__("Dashboard Options", "kreebi-forms")}
            </h3>
            <button
              type="button"
              className="krefrm-dashboard-screen-options-close"
              aria-label={__("Close settings", "kreebi-forms")}
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <p className="krefrm-dashboard-screen-options-title">
            {__("Enable or disable dashboard sections.", "kreebi-forms")}
          </p>

          <div className="krefrm-dashboard-screen-options-modal-body">
            {DASHBOARD_SECTIONS.map((section) => {
              return (
                <label
                  key={section.id}
                  className="krefrm-dashboard-screen-options-item"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(visibility[section.id])}
                    onChange={() => onToggleSection(section.id)}
                    disabled={section.id === "welcome"}
                  />
                  <span>
                    {__(section.label, "kreebi-forms")}
                    {section.id === "welcome" && (
                      <small style={{ marginLeft: 8, color: "#6b7280" }}>
                        {__("Required", "kreebi-forms")}
                      </small>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
