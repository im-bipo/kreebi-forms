/**
 * FormPreview – the main content area of the visual editor.
 *
 * Shows the current step's fields in a sortable list. Supports:
 *  - Reordering fields via SortableJS.
 *  - Dropping new fields from the FieldLibrary.
 *  - Selecting fields for editing in the SettingsPanel.
 */

import { __ } from "@wordpress/i18n";
import SortableFieldCard from "./SortableFieldCard";
import StepNavigation from "./StepNavigation";

export default function FormPreview({
  steps,
  currentStepIndex,
  selection,
  onSelectField,
  onSelectStep,
  onRemoveField,
  onMoveFieldBy,
  onUpdateStep,
}) {
  const step = steps[currentStepIndex];
  const fields = step?.fields || [];

  return (
    <div className="krefrm-form-preview">
      <StepNavigation
        steps={steps}
        currentStepIndex={currentStepIndex}
        onSelectStep={onSelectStep}
        onUpdateStep={onUpdateStep}
      />

      <div className="krefrm-form-preview__fields krefrm-preview-grid">
        <div className="krefrm-form-preview__sortable-list">
          {fields.length === 0 ? (
            <div className="krefrm-form-preview__empty">
              <div className="krefrm-empty-state">
                <div className="krefrm-empty-state__icon">+</div>
                <div className="krefrm-empty-state__title">
                  {__("Drag fields here", "kreebi-forms")}
                </div>
                <div className="krefrm-empty-state__subtitle">
                  {__("or click Add", "kreebi-forms")}
                </div>
              </div>
            </div>
          ) : (
            fields.map((field, idx) => (
              <div key={field._uid} className="krefrm-field-item">
                <SortableFieldCard
                  field={field}
                  isSelected={
                    selection?.type === "field" &&
                    selection?.stepIndex === currentStepIndex &&
                    selection?.fieldIndex === idx
                  }
                  onSelect={() => onSelectField(currentStepIndex, idx)}
                  onRemove={() => onRemoveField(currentStepIndex, idx)}
                  onMoveUp={() => onMoveFieldBy(currentStepIndex, idx, -1)}
                  onMoveDown={() => onMoveFieldBy(currentStepIndex, idx, 1)}
                  canMoveUp={idx > 0}
                  canMoveDown={idx < fields.length - 1}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
