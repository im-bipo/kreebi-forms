/**
 * FieldLibrary – left sidebar listing available field types.
 *
 * Each field type can be:
 *  - Dragged onto the form preview (handled by SortableJS).
 *  - Clicked via "Add" to append to the current step.
 */

import { useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { Button } from "@wordpress/components";
import FIELD_TYPES from "./fieldTypes";

function LibraryFieldType({ fieldType, onAdd }) {
  return (
    <div className="krefrm-field-type" data-field-type={fieldType.type}>
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`krefrm-field-library ${isCollapsed ? "is-collapsed" : ""}`}
    >
      <h3 className="krefrm-field-library__title">
        {__("Fields", "kreebi-forms")}
      </h3>
      <button
        type="button"
        className="krefrm-field-library__collapse"
        onClick={() => setIsCollapsed((prev) => !prev)}
      >
        {isCollapsed ? __("Show", "kreebi-forms") : __("Hide", "kreebi-forms")}
      </button>
      <div className="krefrm-field-library__list">
        {FIELD_TYPES.map((ft) => (
          <LibraryFieldType key={ft.type} fieldType={ft} onAdd={onAdd} />
        ))}
      </div>
    </div>
  );
}
