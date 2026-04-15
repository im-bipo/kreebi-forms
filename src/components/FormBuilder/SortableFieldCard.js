/**
 * SortableFieldCard – a single field rendered inside the form preview.
 *
 * Used as a SortableJS item so it can be reordered by drag handle.
 * Clicking selects it; the Settings Panel shows its properties.
 */

import { useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { Button, Modal } from "@wordpress/components";

export default function SortableFieldCard({
  field,
  isSelected,
  onSelect,
  onRequestSettingsAttention,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    setIsDeleteModalOpen(false);
    onRemove();
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  return (
    <div
      className={`krefrm-field-card ${isSelected ? "is-selected" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
        if (isSelected) {
          onRequestSettingsAttention?.();
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onSelect();
        onRequestSettingsAttention?.();
      }}
    >
      {/* Drag handle */}
      <span
        className="krefrm-field-card__handle"
        title={__("Drag to reorder", "kreebi-forms")}
      >
        ⠿
      </span>

      {/* Field preview */}
      <div className="krefrm-field-card__body">
        <label className="krefrm-field-card__label">
          {field.name || __("(untitled)", "kreebi-forms")}
          {field.required && <span className="krefrm-required-star"> *</span>}
        </label>
        {field.type === "textarea" ? (
          <textarea
            placeholder={field.placeholder || ""}
            disabled
            className="krefrm-field-card__input"
            rows={3}
          />
        ) : (
          <input
            type={field.type || "text"}
            placeholder={field.placeholder || ""}
            disabled
            className="krefrm-field-card__input"
          />
        )}
      </div>

      <div className="krefrm-field-card__actions">
        <div className="krefrm-field-card__reorder">
          <button
            type="button"
            className="krefrm-icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={!canMoveUp}
            title={__("Move up", "kreebi-forms")}
            aria-label={__("Move up", "kreebi-forms")}
          >
            ▲
          </button>
          <button
            type="button"
            className="krefrm-icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={!canMoveDown}
            title={__("Move down", "kreebi-forms")}
            aria-label={__("Move down", "kreebi-forms")}
          >
            ▼
          </button>
        </div>
        <Button
          variant="tertiary"
          isSmall
          isDestructive
          className="krefrm-field-card__remove"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteClick();
          }}
          title={__("Remove field", "kreebi-forms")}
          aria-label={__("Remove field", "kreebi-forms")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </Button>
      </div>

      {isDeleteModalOpen && (
        <Modal
          title={__("Remove Field", "kreebi-forms")}
          onRequestClose={handleCancelDelete}
          isDismissible={true}
          shouldCloseOnClickOutside={false}
        >
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <p style={{ marginBottom: "24px" }}>
              {__("Remove this field? This cannot be undone.", "kreebi-forms")}
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
              }}
            >
              <Button variant="secondary" onClick={handleCancelDelete}>
                {__("Cancel", "kreebi-forms")}
              </Button>
              <Button
                variant="primary"
                isDestructive
                onClick={handleConfirmDelete}
              >
                {__("Remove", "kreebi-forms")}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
