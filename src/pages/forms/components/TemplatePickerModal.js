import { __ } from "@wordpress/i18n";
import { Modal } from "@wordpress/components";
import { TEMPLATES, TEMPLATE_ICONS } from "../template-catalog";

export default function TemplatePickerModal({
  isOpen,
  onClose,
  onPickTemplate,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      title={__("Choose a template", "kreebi-forms")}
      onRequestClose={onClose}
      className="krefrm-picker-modal"
    >
      <p className="krefrm-picker-subtitle">
        {__(
          "Pick a template to start quickly, or create a blank form.",
          "kreebi-forms",
        )}
      </p>
      <div className="krefrm-picker-grid">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.key}
            className="krefrm-picker-card"
            onClick={() => onPickTemplate(tpl)}
          >
            <span className="krefrm-picker-card__icon" aria-hidden="true">
              {TEMPLATE_ICONS[tpl.key]}
            </span>
            <span className="krefrm-picker-card__label">{tpl.label}</span>
          </button>
        ))}
      </div>
      <div className="krefrm-picker-divider" aria-hidden="true" />
    </Modal>
  );
}
