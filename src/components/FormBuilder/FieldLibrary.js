/**
 * FieldLibrary – left sidebar listing available field types.
 *
 * Each field type can be:
 *  - Dragged onto the form preview (handled by @dnd-kit).
 *  - Clicked via "Add" to append to the current step.
 */

import { __ } from "@wordpress/i18n";
import { Button } from "@wordpress/components";
import { useDraggable } from "@dnd-kit/core";
import FIELD_TYPES from "./fieldTypes";

function DraggableFieldType({ fieldType, onAdd }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-${fieldType.type}`,
    data: {
      origin: "library",
      fieldDefaults: fieldType.defaults,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`krefrm-field-type ${isDragging ? "is-dragging" : ""}`}
      {...listeners}
      {...attributes}
    >
      <span className="krefrm-field-type__icon">{fieldType.icon}</span>
      <span className="krefrm-field-type__label">{fieldType.label}</span>
      <Button
        variant="tertiary"
        isSmall
        className="krefrm-field-type__add"
        onClick={(e) => {
          e.stopPropagation();
          onAdd(fieldType.defaults);
        }}
      >
        {__("Add", "kreebi-forms")}
      </Button>
    </div>
  );
}

export default function FieldLibrary({ onAdd }) {
  return (
    <div className="krefrm-field-library">
      <h3 className="krefrm-field-library__title">
        {__("Fields", "kreebi-forms")}
      </h3>
      <div className="krefrm-field-library__list">
        {FIELD_TYPES.map((ft) => (
          <DraggableFieldType key={ft.type} fieldType={ft} onAdd={onAdd} />
        ))}
      </div>
    </div>
  );
}
