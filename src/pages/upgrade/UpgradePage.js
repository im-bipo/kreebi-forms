import { __ } from "@wordpress/i18n";
import { Button } from "@wordpress/components";

const COMPARISON_ROWS = [
  {
    name: __("Basic Form Builder", "kreebi-forms"),
    free: true,
    pro: true,
    meaning: __(
      "Build and publish clean, functional forms quickly with essential fields and layout controls.",
      "kreebi-forms",
    ),
  },
  {
    name: __("Email Notifications", "kreebi-forms"),
    free: true,
    pro: true,
    meaning: __(
      "Send confirmation or alert emails automatically when a form is submitted.",
      "kreebi-forms",
    ),
  },
  {
    name: __("Advanced Field Types", "kreebi-forms"),
    free: false,
    pro: true,
    meaning: __(
      "Use richer field options to capture structured, high-quality data with less user friction.",
      "kreebi-forms",
    ),
  },
  {
    name: __("Multi-Step Forms", "kreebi-forms"),
    free: false,
    pro: true,
    meaning: __(
      "Split long forms into steps to improve completion rate and create a smoother user experience.",
      "kreebi-forms",
    ),
  },
  {
    name: __("Custom CSS & HTML IDs", "kreebi-forms"),
    free: false,
    pro: true,
    meaning: __(
      "Assign custom classes and IDs for precise styling, integrations, and front-end behavior control.",
      "kreebi-forms",
    ),
  },
  {
    name: __("Conditional Logic", "kreebi-forms"),
    free: false,
    pro: true,
    meaning: __(
      "Show or hide fields dynamically based on answers, keeping forms relevant and shorter.",
      "kreebi-forms",
    ),
  },
  {
    name: __("Form Analytics", "kreebi-forms"),
    free: false,
    pro: true,
    meaning: __(
      "Track performance data to understand drop-offs, optimize forms, and increase conversions.",
      "kreebi-forms",
    ),
  },
  {
    name: __("Webhook Integration", "kreebi-forms"),
    free: false,
    pro: true,
    meaning: __(
      "Automatically forward submissions to an external URL or service via webhooks.",
      "kreebi-forms",
    ),
  },
  {
    name: __("Google Sheets Integration", "kreebi-forms"),
    free: false,
    pro: true,
    meaning: __(
      "Send submission data directly to a Google Sheet for real-time tracking and collaboration.",
      "kreebi-forms",
    ),
  },
  {
    name: __("One-Click Open/Close", "kreebi-forms"),
    free: false,
    pro: true,
    meaning: __(
      "Easily enable or disable a form with a single click from the dashboard.",
      "kreebi-forms",
    ),
  },
];

export default function UpgradePage() {
  return (
    <div className="krefrm-upgrade-page">
      <div className="krefrm-upgrade-container">
        <div className="krefrm-upgrade-hero">
          <p className="krefrm-upgrade-badge">
            {__("Limited Time Offer", "kreebi-forms")}
          </p>
          <img
            src={`${
              (window.krefrmAdmin && window.krefrmAdmin.pluginUrl) || ""
            }assets/photos/kreebi-forms-light.png`}
            alt={__("Kreebi Forms", "kreebi-forms")}
            className="krefrm-upgrade-logo-light"
          />
          <h2 className="krefrm-upgrage-title">
            {__("Upgrade to Kreebi Forms Pro for $0", "kreebi-forms")}
          </h2>
          <p className="krefrm-upgrade-subtitle">
            {__(
              "Get premium features today at no cost for this limited offer.",
              "kreebi-forms",
            )}
          </p>
          <div className="krefrm-upgrade-price-row">
            <span className="krefrm-upgrade-price">$0</span>
            <span className="krefrm-upgrade-old-price">$49</span>
          </div>
          <Button
            variant="primary"
            isLarge
            href="admin.php?page=krefrm_forms#upgrade-to-pro"
          >
            {__("Claim $0 Pro Offer", "kreebi-forms")}
          </Button>
        </div>

        <div className="krefrm-upgrade-compare-wrap">
          <h3>{__("Free vs Pro", "kreebi-forms")}</h3>
          <p>{__("See exactly what you unlock with Pro.", "kreebi-forms")}</p>

          <div className="krefrm-upgrade-compare-table-wrap">
            <table className="krefrm-upgrade-compare-table">
              <thead>
                <tr>
                  <th>{__("Feature", "kreebi-forms")}</th>
                  <th>{__("Free", "kreebi-forms")}</th>
                  <th>{__("Pro", "kreebi-forms")}</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>
                      <span
                        className={`krefrm-upgrade-mark ${
                          row.free ? "is-yes" : "is-no"
                        }`}
                        aria-label={
                          row.free
                            ? __("Yes", "kreebi-forms")
                            : __("No", "kreebi-forms")
                        }
                      >
                        {row.free ? "✓" : "✕"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`krefrm-upgrade-mark ${
                          row.pro ? "is-yes" : "is-no"
                        }`}
                        aria-label={
                          row.pro
                            ? __("Yes", "kreebi-forms")
                            : __("No", "kreebi-forms")
                        }
                      >
                        {row.pro ? "✓" : "✕"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="krefrm-upgrade-feature-meanings">
            <h4>{__("What each feature means", "kreebi-forms")}</h4>
            <div className="krefrm-upgrade-meaning-grid">
              {COMPARISON_ROWS.map((row) => (
                <section
                  key={`${row.name}-meaning`}
                  className="krefrm-upgrade-meaning-card"
                >
                  <h5>{row.name}</h5>
                  <p>{row.meaning}</p>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
