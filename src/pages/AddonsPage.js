import { useEffect, useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { Button, Spinner } from "@wordpress/components";

export default function AddonsPage() {
  const { restUrl, nonce } = window.krefrmAdmin || {};
  const [loading, setLoading] = useState(true);
  const [addons, setAddons] = useState([]);
  const [error, setError] = useState("");
  const [installationStates, setInstallationStates] = useState({});

  const installedAddons = addons.filter((plugin) =>
    Boolean(plugin?.isActiveByPrefixVar),
  );
  const notInstalledAddons = addons.filter(
    (plugin) => !plugin?.isActiveByPrefixVar,
  );

  useEffect(() => {
    fetch(`${restUrl}/plugin-addons`, {
      cache: "no-store",
      headers: { "X-WP-Nonce": nonce },
    })
      .then((r) => {
        if (!r.ok) {
          throw new Error("Failed to load plugin catalog");
        }
        return r.json();
      })
      .then((data) => {
        setAddons(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => {
        setError(
          __(
            "Unable to load addons right now. Please refresh and try again.",
            "kreebi-forms",
          ),
        );
      })
      .finally(() => setLoading(false));
  }, [restUrl, nonce]);

  const handleInstallPlugin = async (slug) => {
    setInstallationStates((prev) => ({
      ...prev,
      [slug]: { loading: true, error: null, success: false },
    }));

    try {
      const response = await fetch(`${restUrl}/plugin-addons/install`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": nonce,
        },
        body: JSON.stringify({ slug }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || __("Failed to install plugin", "kreebi-forms"),
        );
      }

      setInstallationStates((prev) => ({
        ...prev,
        [slug]: { loading: false, error: null, success: true },
      }));

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setInstallationStates((prev) => ({
        ...prev,
        [slug]: {
          loading: false,
          error: err.message,
          success: false,
        },
      }));
    }
  };

  const renderSection = (title, subtitle, items, sectionClassName) => (
    <section className={`krefrm-addons-section ${sectionClassName}`}>
      <header className="krefrm-addons-section__header">
        <h3 className="krefrm-addons-section__title">{title}</h3>
        <p className="krefrm-addons-section__subtitle">{subtitle}</p>
      </header>

      {items.length === 0 ? (
        <div className="krefrm-addons-section__empty">
          {__("No addons found in this section.", "kreebi-forms")}
        </div>
      ) : (
        <div className="krefrm-addons-grid">
          {items.map((plugin) => {
            const showSettingsAction =
              Boolean(plugin?.isActiveByPrefixVar) &&
              Boolean(plugin?.settingUrl);
            const isExternalRedirect =
              Boolean(plugin?.externalUrl) &&
              !Boolean(plugin?.downloadUrl) &&
              !plugin?.isActiveByPrefixVar;

            return (
              <article key={plugin.slug} className="krefrm-addon-card">
                <div className="krefrm-addon-card__top">
                  <div className="krefrm-addon-card__icon-wrap">
                    {plugin.icon ? (
                      <img
                        src={plugin.icon}
                        alt={plugin.name || plugin.slug}
                        className="krefrm-addon-card__icon"
                      />
                    ) : (
                      <div className="krefrm-addon-card__icon-placeholder" />
                    )}
                  </div>

                  <div className="krefrm-addon-card__content">
                    <div className="krefrm-addon-card__header-row">
                      <div>
                        <h4 className="krefrm-addon-card__title">
                          {plugin.name || plugin.slug}
                        </h4>
                        <span
                          className={`krefrm-addon-card__status-badge ${
                            plugin?.isActiveByPrefixVar
                              ? "is-installed"
                              : "is-available"
                          }`}
                        >
                          {plugin?.isActiveByPrefixVar
                            ? __("Installed", "kreebi-forms")
                            : __("Available", "kreebi-forms")}
                        </span>
                      </div>

                      <div className="krefrm-addon-card__button-area">
                        {showSettingsAction && (
                          <Button
                            variant="secondary"
                            className="krefrm-addon-card__button"
                            href={plugin.settingUrl}
                          >
                            {__("Settings", "kreebi-forms")}
                          </Button>
                        )}

                        {!showSettingsAction && !isExternalRedirect && (
                          <Button
                            variant="secondary"
                            className="krefrm-addon-card__button"
                            onClick={() => handleInstallPlugin(plugin.slug)}
                            disabled={
                              installationStates[plugin.slug]?.loading ||
                              installationStates[plugin.slug]?.success
                            }
                          >
                            {installationStates[plugin.slug]?.loading && (
                              <>
                                <Spinner />{" "}
                                {__("Installing...", "kreebi-forms")}
                              </>
                            )}
                            {installationStates[plugin.slug]?.success &&
                              __("Installed!", "kreebi-forms")}
                            {!installationStates[plugin.slug]?.loading &&
                              !installationStates[plugin.slug]?.success &&
                              __("Install Now", "kreebi-forms")}
                          </Button>
                        )}

                        {!showSettingsAction && isExternalRedirect && (
                          <Button
                            variant="secondary"
                            className="krefrm-addon-card__button"
                            onClick={() =>
                              window.open(plugin.externalUrl, "_blank")
                            }
                          >
                            {__("Get Plugin", "kreebi-forms")}
                          </Button>
                        )}
                      </div>
                    </div>

                    <p className="krefrm-addon-card__description line-clamp-2">
                      {plugin.description ||
                        __("No description available.", "kreebi-forms")}
                    </p>

                    {installationStates[plugin.slug]?.error && (
                      <p className="krefrm-addon-card__error">
                        {installationStates[plugin.slug].error}
                      </p>
                    )}

                    <p className="krefrm-addon-card__author">
                      {__("By", "kreebi-forms")}{" "}
                      {plugin.author || __("Unknown", "kreebi-forms")}
                    </p>
                  </div>
                </div>

                <div className="krefrm-addon-card__meta">
                  <span className="krefrm-addon-card__version-label">
                    {__("Latest Version:", "kreebi-forms")}
                  </span>
                  <span className="krefrm-addon-card__version-value">
                    {plugin.latestVersion || "-"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <section className="krefrm-addons-page">
      <header className="krefrm-addons-page__header">
        <h2 className="krefrm-addons-page__title">
          {__("Addons", "kreebi-forms")}
        </h2>
        <p className="krefrm-addons-page__subtitle">
          {__(
            "Extend the features with additional plugins and addons:",
            "kreebi-forms",
          )}
        </p>
      </header>

      {error && <p className="krefrm-error">{error}</p>}

      {loading && (
        <div className="krefrm-addons-skeleton-grid" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="krefrm-addon-skeleton-card">
              <div className="krefrm-addon-skeleton-card__top">
                <div className="krefrm-addon-skeleton-card__icon" />
                <div className="krefrm-addon-skeleton-card__content">
                  <div className="krefrm-addon-skeleton-card__line is-title" />
                  <div className="krefrm-addon-skeleton-card__line" />
                  <div className="krefrm-addon-skeleton-card__line" />
                  <div className="krefrm-addon-skeleton-card__line is-small" />
                </div>
              </div>
              <div className="krefrm-addon-skeleton-card__meta" />
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="krefrm-addons-sections">
          {renderSection(
            __("Installed Addons", "kreebi-forms"),
            __(
              "These addons are active and ready to configure.",
              "kreebi-forms",
            ),
            installedAddons,
            "is-installed",
          )}

          {renderSection(
            __("Available Addons", "kreebi-forms"),
            __(
              "Install these addons to unlock additional capabilities.",
              "kreebi-forms",
            ),
            notInstalledAddons,
            "is-available",
          )}
        </div>
      )}
    </section>
  );
}
