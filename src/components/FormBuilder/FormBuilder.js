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
import { useEffect } from "@wordpress/element";
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

import useFormBuilder from "./useFormBuilder";
import FieldLibrary from "./FieldLibrary";
import FormPreview from "./FormPreview";
import SettingsPanel from "./SettingsPanel";
import JsonEditor from "./JsonEditor";
import DragOverlayCard from "./DragOverlayCard";
import QuickBuilder from "../QuickBuilder"; // used as additional view

export default function FormBuilder({
  initialData = {},
  onSave,
  onCancel,
  saveLabel,
}) {
  const builder = useFormBuilder(initialData);
  const [view, setView] = useState("visual"); // "quick" | "visual" | "json" | "settings"
  const [activeDrag, setActiveDrag] = useState(null);
  const [insertIndex, setInsertIndex] = useState(null);

  // Require a small move before activating drag (avoids accidental drag on click)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  /* Auto-select first field when none selected */
  useEffect(() => {
    if (view !== "visual") return;
    const step = builder.steps[builder.currentStepIndex];
    const hasFields = Array.isArray(step?.fields) && step.fields.length > 0;
    const hasSelection = !!builder.selection;
    if (hasFields && !hasSelection) {
      builder.setSelection({
        type: "field",
        stepIndex: builder.currentStepIndex,
        fieldIndex: 0,
      });
    }
  }, [view, builder.steps, builder.currentStepIndex, builder.selection]);

  /* ─── Drag handlers ─── */

  const handleDragStart = useCallback((event) => {
    setActiveDrag(event.active);
    setInsertIndex(null);
  }, []);

  const handleDragOver = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over) {
        setInsertIndex(null);
        return;
      }

      const step = builder.steps[builder.currentStepIndex];
      const fields = step?.fields || [];

      if (over.id === "form-preview-droppable") {
        setInsertIndex(fields.length);
        return;
      }

      const overIndex = fields.findIndex((f) => f._uid === over.id);
      if (overIndex === -1) {
        setInsertIndex(fields.length);
        return;
      }

      const overRect = over.rect;
      const activeRect =
        active.rect.current?.translated || active.rect.current?.initial;

      if (!overRect || !activeRect) {
        setInsertIndex(overIndex);
        return;
      }

      // For single-column layout, only consider vertical (Y-axis) positioning
      const activeCenterY = activeRect.top + activeRect.height / 2;
      const overCenterY = overRect.top + overRect.height / 2;

      const shouldInsertAfter = activeCenterY > overCenterY;
      setInsertIndex(overIndex + (shouldInsertAfter ? 1 : 0));
    },
    [builder.steps, builder.currentStepIndex],
  );

  const handleDragEnd = useCallback(
    (event) => {
      setActiveDrag(null);
      const { active, over } = event;
      const step = builder.steps[builder.currentStepIndex];
      const fields = step?.fields || [];

      if (!over) {
        setInsertIndex(null);
        return;
      }

      const activeData = active.data.current;
      const targetIndex =
        typeof insertIndex === "number"
          ? insertIndex
          : fields.findIndex((f) => f._uid === over.id);

      // --- Dropped from the library onto the preview ---
      if (activeData?.origin === "library") {
        const safeIndex =
          typeof targetIndex === "number" && targetIndex >= 0
            ? targetIndex
            : fields.length;
        builder.insertFieldAt(
          { ...activeData.fieldDefaults },
          builder.currentStepIndex,
          safeIndex,
        );
        setInsertIndex(null);
        return;
      }

      // --- Reordering existing fields ---
      if (active.id !== over.id) {
        if (!step) return;
        const oldIndex = step.fields.findIndex((f) => f._uid === active.id);
        const newIndex =
          typeof targetIndex === "number" && targetIndex >= 0
            ? targetIndex
            : step.fields.findIndex((f) => f._uid === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          builder.moveFieldToIndex(
            builder.currentStepIndex,
            oldIndex,
            newIndex,
          );
        }
      }

      setInsertIndex(null);
    },
    [builder, insertIndex],
  );

  const handleDragCancel = useCallback(() => {
    setActiveDrag(null);
    setInsertIndex(null);
  }, []);

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
      {view !== "quick" && (
        <div className="krefrm-builder__topbar">
          <div className="krefrm-builder__toggle">
            <button
              type="button"
              className={`krefrm-builder__toggle-btn ${
                view === "quick" ? "is-active" : ""
              }`}
              onClick={() => setView("quick")}
            >
              {__("Quick Editor", "kreebi-forms")}
            </button>
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
      )}

      {/* ─── Form name / desc (visual only) ─── */}
      {view === "visual" && (
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
      )}

      {/* ─── View body ─── */}
      {view === "quick" && (
        <QuickBuilder
          initialData={builder.getJson()}
          onSave={(json) => builder.setFromJson(json)}
          onAdvanced={(json) => {
            builder.setFromJson(json);
            setView("visual");
          }}
        />
      )}

      {view === "json" && (
        <JsonEditor getJson={builder.getJson} onApply={builder.setFromJson} />
      )}

      {view === "visual" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="krefrm-builder__columns">
            <FieldLibrary onAdd={(defaults) => builder.addField(defaults)} />

            <FormPreview
              steps={builder.steps}
              currentStepIndex={builder.currentStepIndex}
              selection={builder.selection}
              insertIndex={insertIndex}
              onSelectField={selectField}
              onSelectStep={selectStep}
              onUpdateStep={builder.updateStep}
              onRemoveField={builder.removeField}
              onMoveFieldBy={builder.moveFieldBy}
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

          <DragOverlay dropAnimation={null} adjustScale={false}>
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
