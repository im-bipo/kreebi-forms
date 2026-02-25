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
  onSelectField,
  onSelectStep,
  onRemoveField,
  onPrevStep,
  onNextStep,
  onAddStep,
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
        onPrev={onPrevStep}
        onNext={onNextStep}
        onAddStep={onAddStep}
        onSelectStep={onSelectStep}
      />

      <div
        ref={setNodeRef}
        className={`krefrm-form-preview__fields ${
          isOver ? "is-drag-over" : ""
        }`}
      >
        {fields.length === 0 ? (
          <div className="krefrm-form-preview__empty">
            {__(
              "Drag a field here or click Add from the sidebar.",
              "kreebi-forms",
            )}
          </div>
        ) : (
          <SortableContext
            items={fieldIds}
            strategy={verticalListSortingStrategy}
          >
            {fields.map((field, idx) => (
              <SortableFieldCard
                key={field._uid}
                field={field}
                fieldIndex={idx}
                isSelected={
                  selection?.type === "field" &&
                  selection?.stepIndex === currentStepIndex &&
                  selection?.fieldIndex === idx
                }
                onSelect={() => onSelectField(currentStepIndex, idx)}
                onRemove={() => onRemoveField(currentStepIndex, idx)}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
}
