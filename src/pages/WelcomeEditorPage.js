import { useEffect, useMemo, useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { Button, Notice, Spinner } from "@wordpress/components";

const EDITOR_OPTIONS = [
  {
    id: "drag_drop",
    title: __("Drag & Drop Editor", "kreebi-forms"),
    description: __(
      "Use the advanced drag-and-drop builder for full design control.",
      "kreebi-forms",
    ),
    imageName: "advance-builder-drag-and-drop.png",
  },
  {
    id: "quick",
    title: __("Quick Edit", "kreebi-forms"),
    description: __(
      "Create and edit forms quickly with the simplified editor.",
      "kreebi-forms",
    ),
    imageName: "quick-builder.png",
  },
];

function buildImageCandidates(pluginUrl, imageName) {
  return [
    `${pluginUrl}assets/photos/${imageName}`,
    `${pluginUrl}assets/phots/kreebi-forms.png`,
    `${pluginUrl}assets/photos/kreebi-forms.png`,
  ];
}

export default function WelcomeEditorPage({ navigate = () => {} }) {
  const { restUrl, nonce, pluginUrl = "" } = window.krefrmAdmin || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [selectedEditor, setSelectedEditor] = useState("drag_drop");
  const [imageFallbackIndex, setImageFallbackIndex] = useState({
    quick: 0,
    drag_drop: 0,
  });

  const editorImages = useMemo(
    () =>
      EDITOR_OPTIONS.reduce((acc, option) => {
        acc[option.id] = buildImageCandidates(pluginUrl, option.imageName);
        return acc;
      }, {}),
    [pluginUrl],
  );

  useEffect(() => {
    let isMounted = true;

    fetch(`${restUrl}/settings`, {
      cache: "no-store",
      headers: { "X-WP-Nonce": nonce },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) {
          return;
        }

        const defaultEditor =
          data?.defaultEditor === "quick" ? "quick" : "drag_drop";
        setSelectedEditor(defaultEditor);
      })
      .catch(() => {
        if (isMounted) {
          setSelectedEditor("drag_drop");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [restUrl, nonce]);

  const handleImageError = (editorId, totalSources) => {
    setImageFallbackIndex((prev) => ({
      ...prev,
      [editorId]: Math.min((prev[editorId] || 0) + 1, totalSources - 1),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSavedMessage("");

    try {
      const response = await fetch(`${restUrl}/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": nonce,
        },
        body: JSON.stringify({ defaultEditor: selectedEditor }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data?.message ||
            __("Failed to save the default editor.", "kreebi-forms"),
        );
        return;
      }

      setSavedMessage(
        __("Default editor saved. Opening forms…", "kreebi-forms"),
      );
      setTimeout(() => navigate("form"), 400);
    } catch (saveError) {
      setError(
        __("Network error while saving default editor.", "kreebi-forms"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="krefrm-welcome-editor">
      <div className="krefrm-welcome-editor__container">
        <div className="krefrm-welcome-editor__header">
          <h1 className="krefrm-welcome-editor__main-title">
            {__("Welcome to Kreebi Forms", "kreebi-forms")}
          </h1>
          <p className="krefrm-welcome-editor__main-subtitle">
            {__("Pick your preferred editor to get started", "kreebi-forms")}
          </p>
        </div>

        <div className="krefrm-welcome-editor__content">
          {loading ? (
            <div className="krefrm-welcome-editor__loading">
              <Spinner />
            </div>
          ) : (
            <>
              <div className="krefrm-welcome-editor__options">
                {EDITOR_OPTIONS.map((option) => {
                  const sources = editorImages[option.id] || [];
                  const sourceIndex = imageFallbackIndex[option.id] || 0;
                  const imageSrc =
                    sources[
                      Math.min(sourceIndex, Math.max(sources.length - 1, 0))
                    ] || `${pluginUrl}assets/photos/kreebi-forms.png`;
                  const canFallback = sourceIndex < sources.length - 1;
                  const isSelected = selectedEditor === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`krefrm-welcome-editor__option ${
                        isSelected ? "is-selected" : ""
                      }`}
                      onClick={() => setSelectedEditor(option.id)}
                    >
                      <div className="krefrm-welcome-editor__option-visual">
                        <img
                          className="krefrm-welcome-editor__option-image"
                          src={imageSrc}
                          alt={option.title}
                          onError={
                            canFallback
                              ? () =>
                                  handleImageError(option.id, sources.length)
                              : undefined
                          }
                        />
                      </div>
                      <div className="krefrm-welcome-editor__option-info">
                        <h3 className="krefrm-welcome-editor__option-title">
                          {option.title}
                        </h3>
                        <p className="krefrm-welcome-editor__option-description">
                          {option.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="krefrm-welcome-editor__option-check">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="krefrm-welcome-editor__footer">
                {error && (
                  <Notice
                    status="error"
                    isDismissible
                    onDismiss={() => setError("")}
                  >
                    {error}
                  </Notice>
                )}

                {savedMessage && (
                  <Notice status="success" isDismissible={false}>
                    {savedMessage}
                  </Notice>
                )}

                <div className="krefrm-welcome-editor__footer-content">
                  <p className="krefrm-welcome-editor__footer-text">
                    {__(
                      "You can switch editors later from the forms screen.",
                      "kreebi-forms",
                    )}
                  </p>
                  <Button
                    variant="primary"
                    size="large"
                    onClick={handleSave}
                    disabled={saving}
                    className="krefrm-welcome-editor__submit-btn"
                  >
                    {saving
                      ? __("Saving…", "kreebi-forms")
                      : __("Save and Continue", "kreebi-forms")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
