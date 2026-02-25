/**
 * FormBuilder – top-level visual form builder component.
 *
 * Provides:
 *  - Toggle between Visual Editor and JSON View.
 *  - Three-column layout: FieldLibrary | FormPreview | SettingsPanel.
 *  - Drag-and-drop context via @dnd-kit.
 *
 * Props:
 *  initialData  {Object}   optional initial form JSON (for editing)
 *  onSave       {Function} called with the final JSON when the user saves
 *  onCancel     {Function} called when the user cancels
 *  saveLabel    {string}   label for the save button (defaults to "Save Form")
 */

import { useState, useCallback } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { Button } from "@wordpress/components";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import useFormBuilder from "./useFormBuilder";
import FieldLibrary from "./FieldLibrary";
import FormPreview from "./FormPreview";
import SettingsPanel from "./SettingsPanel";
import JsonEditor from "./JsonEditor";
import DragOverlayCard from "./DragOverlayCard";

export default function FormBuilder({
  initialData = {},
  onSave,
  onCancel,
  saveLabel,
}) {
  const builder = useFormBuilder(initialData);
  const [view, setView] = useState("visual"); // "visual" | "json"
  const [activeDrag, setActiveDrag] = useState(null);

  // Require a small move before activating drag (avoids accidental drag on click)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  /* ─── Drag handlers ─── */

  const handleDragStart = useCallback((event) => {
    setActiveDrag(event.active);
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      setActiveDrag(null);
      const { active, over } = event;

      if (!over) return;

      const activeData = active.data.current;

      // --- Dropped from the library onto the preview ---
      if (activeData?.origin === "library") {
        // Dropped on the droppable container or on a field inside it
        builder.addField({ ...activeData.fieldDefaults });
        return;
      }

      // --- Reordering existing fields ---
      if (active.id !== over.id) {
        const step = builder.steps[builder.currentStepIndex];
        if (!step) return;
        const oldIndex = step.fields.findIndex((f) => f._uid === active.id);
        const newIndex = step.fields.findIndex((f) => f._uid === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          builder.reorderFields(builder.currentStepIndex, oldIndex, newIndex);
        }
      }
    },
    [builder],
  );

  /* ─── Save ─── */

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(builder.getJson());
    }
  }, [onSave, builder]);

  /* ─── Selection helpers ─── */

  const selectField = useCallback(
    (stepIndex, fieldIndex) => {
      builder.setSelection({ type: "field", stepIndex, fieldIndex });
    },
    [builder],
  );

  const selectStep = useCallback(() => {
    builder.setSelection({
      type: "step",
      stepIndex: builder.currentStepIndex,
    });
  }, [builder]);

  /* ─── Render ─── */

  return (
    <div className="krefrm-builder">
      {/* ─── Top bar ─── */}
      <div className="krefrm-builder__topbar">
        <div className="krefrm-builder__toggle">
          <button
            type="button"
            className={`krefrm-builder__toggle-btn ${
              view === "visual" ? "is-active" : ""
            }`}
            onClick={() => setView("visual")}
          >
            {__("Visual Editor", "kreebi-forms")}
          </button>
          <button
            type="button"
            className={`krefrm-builder__toggle-btn ${
              view === "json" ? "is-active" : ""
            }`}
            onClick={() => setView("json")}
          >
            {__("JSON View", "kreebi-forms")}
          </button>
        </div>

        <div className="krefrm-builder__topbar-actions">
          {onCancel && (
            <Button variant="tertiary" onClick={onCancel}>
              {__("Cancel", "kreebi-forms")}
            </Button>
          )}
          <Button variant="primary" onClick={handleSave}>
            {saveLabel || __("Save Form", "kreebi-forms")}
          </Button>
        </div>
      </div>

      {/* ─── Form name / desc ─── */}
      <div className="krefrm-builder__meta">
        <input
          type="text"
          className="krefrm-builder__name-input"
          placeholder={__("Form Name", "kreebi-forms")}
          value={builder.formName}
          onChange={(e) => builder.setFormName(e.target.value)}
        />
        <input
          type="text"
          className="krefrm-builder__desc-input"
          placeholder={__("Description (optional)", "kreebi-forms")}
          value={builder.formDesc}
          onChange={(e) => builder.setFormDesc(e.target.value)}
        />
      </div>

      {/* ─── View body ─── */}
      {view === "json" ? (
        <JsonEditor getJson={builder.getJson} onApply={builder.setFromJson} />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="krefrm-builder__columns">
            <FieldLibrary onAdd={(defaults) => builder.addField(defaults)} />

            <FormPreview
              steps={builder.steps}
              currentStepIndex={builder.currentStepIndex}
              selection={builder.selection}
              onSelectField={selectField}
              onSelectStep={selectStep}
              onRemoveField={builder.removeField}
              onPrevStep={() =>
                builder.setCurrentStepIndex(
                  Math.max(0, builder.currentStepIndex - 1),
                )
              }
              onNextStep={() =>
                builder.setCurrentStepIndex(
                  Math.min(
                    builder.steps.length - 1,
                    builder.currentStepIndex + 1,
                  ),
                )
              }
              onAddStep={builder.addStep}
            />

            <SettingsPanel
              selection={builder.selection}
              steps={builder.steps}
              onUpdateStep={builder.updateStep}
              onRemoveStep={builder.removeStep}
              onUpdateField={builder.updateField}
              onRemoveField={builder.removeField}
            />
          </div>

          <DragOverlay>
            {activeDrag ? (
              <DragOverlayCard
                field={
                  activeDrag.data.current?.origin === "library"
                    ? activeDrag.data.current.fieldDefaults
                    : builder.steps[builder.currentStepIndex]?.fields?.find(
                        (f) => f._uid === activeDrag.id,
                      )
                }
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
