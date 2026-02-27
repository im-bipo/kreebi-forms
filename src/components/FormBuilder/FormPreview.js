/**
 * FormPreview – the main content area of the visual editor.
 *
 * Shows the current step's fields in a sortable list. Supports:
 *  - Reordering fields via drag-and-drop.
 *  - Dropping new fields from the FieldLibrary.
 *  - Selecting fields for editing in the SettingsPanel.
 */

import { __ } from "@wordpress/i18n";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import SortableFieldCard from "./SortableFieldCard";
import StepNavigation from "./StepNavigation";

export default function FormPreview({
  steps,
  currentStepIndex,
  selection,
  insertIndex,
  onSelectField,
  onSelectStep,
  onRemoveField,
  onMoveFieldBy,
}) {
  const step = steps[currentStepIndex];
  const fields = step?.fields || [];
  const fieldIds = fields.map((f) => f._uid);

  // Make the preview area droppable for library items
  const { setNodeRef, isOver } = useDroppable({
    id: "form-preview-droppable",
    data: { stepIndex: currentStepIndex },
  });

  return (
    <div className="krefrm-form-preview">
      <StepNavigation
        steps={steps}
        currentStepIndex={currentStepIndex}
        onSelectStep={onSelectStep}
      />

      <div
        ref={setNodeRef}
        className={`krefrm-form-preview__fields krefrm-preview-grid ${
          isOver ? "is-drag-over" : ""
        }`}
      >
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
          <SortableContext
            items={fieldIds}
            strategy={verticalListSortingStrategy}
          >
            {fields.map((field, idx) => (
              <div key={field._uid} className="krefrm-field-item">
                {insertIndex === idx && (
                  <div className="krefrm-drop-placeholder" />
                )}
                <SortableFieldCard
                  field={field}
                  fieldIndex={idx}
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
            ))}
            {insertIndex === fields.length && (
              <div className="krefrm-drop-placeholder" />
            )}
          </SortableContext>
        )}
      </div>
    </div>
  );
}
