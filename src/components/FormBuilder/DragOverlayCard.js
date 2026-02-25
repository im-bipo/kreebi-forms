/**
 * DragOverlayCard – the ghost card shown while dragging.
 */

import { __ } from "@wordpress/i18n";

export default function DragOverlayCard({ field }) {
  if (!field) return null;

  return (
    <div className="krefrm-field-card krefrm-field-card--overlay">
      <span className="krefrm-field-card__handle">⠿</span>
      <div className="krefrm-field-card__body">
        <label className="krefrm-field-card__label">
          {field.name || field.defaults?.name || __("Field", "kreebi-forms")}
        </label>
        <input
          type="text"
          disabled
          placeholder={field.placeholder || field.defaults?.placeholder || ""}
          className="krefrm-field-card__input"
        />
      </div>
    </div>
  );
}
