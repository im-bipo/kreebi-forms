/**
 * SortableFieldCard – a single field rendered inside the form preview.
 *
 * Wraps each field in @dnd-kit/sortable so it can be reordered.
 * Clicking selects it; the Settings Panel shows its properties.
 */

import { __ } from "@wordpress/i18n";
import { Button } from "@wordpress/components";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableFieldCard({
  field,
  fieldIndex,
  colSpan = 12,
  isSelected,
  onSelect,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) {
  const animateLayoutChanges = ({ isSorting, wasDragging }) =>
    isSorting || wasDragging;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field._uid,
    animateLayoutChanges,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    gridColumn: `span ${colSpan}`,
  };

  const widthLabel =
    colSpan === 12
      ? "Full"
      : colSpan === 8
      ? "2/3"
      : colSpan === 6
      ? "1/2"
      : "1/3";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`krefrm-field-card ${isSelected ? "is-selected" : ""} ${
        isDragging ? "is-dragging" : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Drag handle */}
      <span
        className="krefrm-field-card__handle"
        {...attributes}
        {...listeners}
        title={__("Drag to reorder", "kreebi-forms")}
      >
        ⠿
      </span>

      {/* Field preview */}
      <div className="krefrm-field-card__body">
        <label className="krefrm-field-card__label">
          {field.name || __("(untitled)", "kreebi-forms")}
          {field.required && <span className="krefrm-required-star"> *</span>}
          {colSpan < 12 && (
            <span className="krefrm-field-card__width-badge">{widthLabel}</span>
          )}
        </label>
        <input
          type={field.type || "text"}
          placeholder={field.placeholder || ""}
          disabled
          className="krefrm-field-card__input"
        />
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
            if (
              window.confirm(
                __("Remove this field? This cannot be undone.", "kreebi-forms"),
              )
            ) {
              onRemove();
            }
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
    </div>
  );
}
