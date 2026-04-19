import { __ } from "@wordpress/i18n";
import { Button, Modal } from "@wordpress/components";

export default function WelcomeEditorPage({
  onClose = () => {},
  onContinue = () => {},
}) {
  return (
    <Modal
      className="krefrm-welcome-modal"
      title={__("Welcome", "kreebi-forms")}
      onRequestClose={onClose}
    >
      <div className="krefrm-welcome-editor">
        <div className="krefrm-welcome-editor__header">
          <h1 className="krefrm-welcome-editor__main-title">
            {__("Welcome to Kreebi Forms", "kreebi-forms")}
          </h1>
          <p className="krefrm-welcome-editor__main-subtitle">
            {__("Would you like to continue to Kreebi Forms?", "kreebi-forms")}
          </p>
        </div>

        <div className="krefrm-welcome-editor__content">
          <div className="krefrm-welcome-editor__footer">
            <div className="krefrm-welcome-editor__footer-content">
              <p className="krefrm-welcome-editor__footer-text">
                {__(
                  "Click continue to open your forms dashboard.",
                  "kreebi-forms",
                )}
              </p>
              <Button
                variant="primary"
                size="large"
                onClick={onContinue}
                className="krefrm-welcome-editor__submit-btn"
              >
                {__("Continue", "kreebi-forms")}
              </Button>
              <Button
                variant="secondary"
                size="large"
                onClick={onClose}
                className="krefrm-welcome-editor__submit-btn"
              >
                {__("Not now", "kreebi-forms")}
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
    </Modal>
  );
}
