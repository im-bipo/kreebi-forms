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
  isSelected,
  onSelect,
  onRemove,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field._uid,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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
        </label>
        <input
          type={field.type || "text"}
          placeholder={field.placeholder || ""}
          disabled
          className="krefrm-field-card__input"
        />
      </div>

      {/* Quick remove */}
      <Button
        variant="tertiary"
        isSmall
        isDestructive
        className="krefrm-field-card__remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        title={__("Remove field", "kreebi-forms")}
      >
        ✕
      </Button>
    </div>
  );
}
