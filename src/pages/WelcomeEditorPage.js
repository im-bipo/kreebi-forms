import { __ } from "@wordpress/i18n";
import { Button } from "@wordpress/components";

export default function WelcomeEditorPage({ navigate = () => {} }) {
  return (
    <div className="krefrm-welcome-editor">
      <div className="krefrm-welcome-editor__container">
        <div className="krefrm-welcome-editor__header">
          <h1 className="krefrm-welcome-editor__main-title">
            {__("Welcome to Kreebi Forms", "kreebi-forms")}
          </h1>
          <p className="krefrm-welcome-editor__main-subtitle">
            {__("You are ready to build your first form.", "kreebi-forms")}
          </p>
        </div>

        <div className="krefrm-welcome-editor__content">
          <div className="krefrm-welcome-editor__footer">
            <div className="krefrm-welcome-editor__footer-content">
              <p className="krefrm-welcome-editor__footer-text">
                {__(
                  "Start with the drag-and-drop editor and create forms in minutes.",
                  "kreebi-forms",
                )}
              </p>
              <Button
                variant="primary"
                size="large"
                onClick={() => navigate("form")}
                className="krefrm-welcome-editor__submit-btn"
              >
                {__("Continue", "kreebi-forms")}
              </Button>
              <p className="krefrm-welcome-editor__consent-text">
                {__(
                  "By installing this plugin, you accept the",
                  "kreebi-forms",
                )}{" "}
                <a
                  href="https://kreebiforms.com/terms-and-condition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {__("Terms and Conditions", "kreebi-forms")}
                </a>{" "}
                {__("and", "kreebi-forms")}{" "}
                <a
                  href="https://kreebiforms.com/pravicy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {__("Privacy Policy", "kreebi-forms")}
                </a>{" "}
                {__("of Kreebi Forms.", "kreebi-forms")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
