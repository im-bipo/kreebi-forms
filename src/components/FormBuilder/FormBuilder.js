/**
 * FormBuilder – top-level visual form builder component.
 *
 * Provides:
 *  - Toggle between Visual Editor and JSON View.
 *  - Three-column layout: FieldLibrary | FormPreview | SettingsPanel.
 *  - Drag-and-drop powered by SortableJS.
 *
 * Props:
 *  initialData  {Object}   optional initial form JSON (for editing)
 *  onSave       {Function} called with the final JSON when the user saves
 *  onCancel     {Function} called when the user cancels
 *  saveLabel    {string}   label for the save button (defaults to "Save Form")
 *  isEditing    {Boolean}  whether we're editing an existing form
 */

import { useState, useCallback, useEffect, useRef } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { Button } from "@wordpress/components";
import Sortable from "sortablejs";

import useFormBuilder from "./useFormBuilder";
import FieldLibrary from "./FieldLibrary";
import FormPreview from "./FormPreview";
import SettingsPanel from "./SettingsPanel";
import JsonEditor from "./JsonEditor";
import FIELD_TYPES from "./fieldTypes";
import { getIntegration } from "../../integrations/registry";

/**
 * @param {Object}  props.enabledIntegrations       Map of integrationId → boolean
 * @param {Object}  props.globalIntegrationSettings  Map of settingsKey → settings object
 * @param {string}  props.initialTab                Initial view to show (e.g., "email-notification")
 * @param {Function} props.onTabChange              Called when user switches tabs; receives (tabName)
 */
export default function FormBuilder({
  initialData = {},
  onSave,
  onCancel,
  saveLabel,
  isEditing = false,
  formId = "",
  enabledIntegrations = {},
  globalIntegrationSettings = {},
  initialTab = null,
  onTabChange = () => {},
}) {
  const builder = useFormBuilder(initialData);

  // Convert initialTab to internal view format
  // "quick-edit" (legacy) -> "visual", "json-view" -> "json", "email-notification" -> "intg:email-notification", etc.
  const getInitialView = () => {
    if (!initialTab) return "visual"; // default
    if (initialTab === "quick-edit") return "visual";
    if (initialTab === "json-view") return "json";
    if (initialTab.startsWith("intg:")) return initialTab;
    return `intg:${initialTab}`; // treat other tabs as integrations
  };

  const [view, setView] = useState(getInitialView()); // "visual" | "json" | "settings"
  const [nameError, setNameError] = useState("");
  const [shakeNameInput, setShakeNameInput] = useState(false);
  const [settingsAttention, setSettingsAttention] = useState(false);
  const settingsAttentionTimeoutRef = useRef(null);
  const settingsAttentionLastTriggerRef = useRef(0);

  // Function for integrations to trigger form save with current state
  const triggerFormSave = useCallback(() => {
    if (onSave) {
      onSave(builder.getJson());
    }
  }, [onSave, builder]);

  // Helper to change view and notify parent about tab changes
  const handleViewChange = useCallback(
    (newView) => {
      setView(newView);

      // Convert internal view format back to tab name for parent
      let tabName = null;
      if (newView === "visual") {
        tabName = null; // default, no tab param
      } else if (newView === "json") {
        // JSON View is treated as an integration tab for URL consistency
        tabName = "json-view";
      } else if (newView.startsWith("intg:")) {
        tabName = newView.replace("intg:", "");
      }

      onTabChange(tabName);
    },
    [onTabChange],
  );

  const triggerNameValidationFeedback = useCallback(() => {
    setShakeNameInput(false);
    if (typeof window !== "undefined" && window.requestAnimationFrame) {
      window.requestAnimationFrame(() => setShakeNameInput(true));
      return;
    }
    setShakeNameInput(true);
  }, []);

  const handleFormNameChange = useCallback(
    (event) => {
      const value = event.target.value;
      builder.setFormName(value);
      if (nameError && value.trim()) {
        setNameError("");
      }
    },
    [builder, nameError],
  );

  useEffect(() => {
    if (!shakeNameInput) return undefined;
    const timer = setTimeout(() => setShakeNameInput(false), 320);
    return () => clearTimeout(timer);
  }, [shakeNameInput]);

  useEffect(
    () => () => {
      if (settingsAttentionTimeoutRef.current) {
        clearTimeout(settingsAttentionTimeoutRef.current);
      }
    },
    [],
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

  useEffect(() => {
    if (view !== "visual") return undefined;

    const libraryList = document.querySelector(".krefrm-field-library__list");
    const previewList = document.querySelector(
      ".krefrm-form-preview__sortable-list",
    );

    if (!libraryList || !previewList) return undefined;

    const fieldDefaultsByType = FIELD_TYPES.reduce((acc, fieldType) => {
      acc[fieldType.type] = fieldType.defaults;
      return acc;
    }, {});

    const librarySortable = Sortable.create(libraryList, {
      group: { name: "krefrm-fields", pull: "clone", put: false },
      sort: false,
      animation: 180,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
      draggable: ".krefrm-field-type",
      filter: ".krefrm-field-type__add",
      preventOnFilter: false,
      forceFallback: true,
      fallbackTolerance: 8,
      ghostClass: "is-sortable-ghost",
      chosenClass: "is-sortable-chosen",
      dragClass: "is-sortable-drag",
    });

    const previewSortable = Sortable.create(previewList, {
      group: { name: "krefrm-fields", pull: false, put: true },
      animation: 180,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
      draggable: ".krefrm-field-item",
      filter: ".krefrm-field-card__actions, .krefrm-field-card__actions *",
      preventOnFilter: false,
      emptyInsertThreshold: 18,
      forceFallback: true,
      fallbackTolerance: 8,
      ghostClass: "is-sortable-ghost",
      chosenClass: "is-sortable-chosen",
      dragClass: "is-sortable-drag",
      onAdd: (event) => {
        if (event.from !== libraryList) return;
        const fieldType = event.item.getAttribute("data-field-type");
        const defaults = fieldDefaultsByType[fieldType];

        if (defaults) {
          builder.insertFieldAt(
            { ...defaults },
            builder.currentStepIndex,
            event.newIndex || 0,
          );
        }

        event.item.remove();
      },
      onEnd: (event) => {
        if (event.from !== previewList || event.to !== previewList) return;
        if (
          typeof event.oldIndex !== "number" ||
          typeof event.newIndex !== "number"
        ) {
          return;
        }
        if (event.oldIndex === event.newIndex) return;

        builder.moveFieldToIndex(
          builder.currentStepIndex,
          event.oldIndex,
          event.newIndex,
        );
      },
    });

    return () => {
      librarySortable.destroy();
      previewSortable.destroy();
    };
  }, [
    view,
    builder.currentStepIndex,
    builder.insertFieldAt,
    builder.moveFieldToIndex,
  ]);

  /* ─── Save ─── */

  const handleSave = useCallback(() => {
    const trimmedName = (builder.formName || "").trim();
    if (!trimmedName) {
      setNameError(__("Form name cannot be empty", "kreebi-forms"));
      if (view !== "visual") {
        handleViewChange("visual");
      }
      triggerNameValidationFeedback();
      return;
    }

    setNameError("");
    const jsonToSave = { ...builder.getJson(), name: trimmedName };
    if (onSave) {
      onSave(jsonToSave);
    }
  }, [onSave, builder, view, handleViewChange, triggerNameValidationFeedback]);

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

  const triggerSettingsAttention = useCallback(() => {
    const now = Date.now();
    if (now - settingsAttentionLastTriggerRef.current < 180) {
      return;
    }
    settingsAttentionLastTriggerRef.current = now;

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.vibrate === "function"
    ) {
      navigator.vibrate([18, 30, 18]);
    }

    setSettingsAttention(false);
    if (typeof window !== "undefined" && window.requestAnimationFrame) {
      window.requestAnimationFrame(() => setSettingsAttention(true));
    } else {
      setSettingsAttention(true);
    }

    if (settingsAttentionTimeoutRef.current) {
      clearTimeout(settingsAttentionTimeoutRef.current);
    }

    settingsAttentionTimeoutRef.current = setTimeout(() => {
      setSettingsAttention(false);
      settingsAttentionTimeoutRef.current = null;
    }, 360);
  }, []);

  /* ─── Integration tab helpers ─── */

  /**
   * Returns tabs for enabled integrations to be shown after the core tabs.
   * Each tab is { id, label, viewKey } where viewKey is the value to set `view` to.
   */
  const integrationTabs = Object.entries(enabledIntegrations)
    .filter(([, isOn]) => isOn)
    .reduce((acc, [id]) => {
      const integration = getIntegration(id);
      if (!integration) return acc;
      const { config } = integration;

      if (config.usesJsonEditorTab) {
        // JSON View maps to the existing "json" view slot
        acc.push({ id, label: config.tabLabel, viewKey: "json" });
      } else if (integration.FormTab) {
        // Standard integration settings panel
        acc.push({ id, label: config.tabLabel, viewKey: `intg:${id}` });
      }
      return acc;
    }, []);

  /* ─── Render ─── */

  return (
    <div className="krefrm-builder">
      {view === "visual" && (
        <div className="krefrm-builder-editor-header">
          <div>
            <h2 className="krefrm-builder-editor-header__title">
              {__("Drag & Drop Editor", "kreebi-forms")}
            </h2>
            <p className="krefrm-builder-editor-header__subtitle">
              {__(
                "Build your form visually with full drag-and-drop control.",
                "kreebi-forms",
              )}
            </p>
          </div>
        </div>
      )}

      {/* ─── Top bar ─── */}
      <div className="krefrm-builder__topbar">
        <div className="krefrm-builder__toggle">
          <button
            type="button"
            className={`krefrm-builder__toggle-btn ${
              view === "visual" ? "is-active" : ""
            }`}
            onClick={() => handleViewChange("visual")}
          >
            {__("Visual Editor", "kreebi-forms")}
          </button>

          {/* Integration tabs (JSON View, Email Notification, etc.) */}
          {integrationTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`krefrm-builder__toggle-btn ${
                view === tab.viewKey ? "is-active" : ""
              }`}
              onClick={() => handleViewChange(tab.viewKey)}
            >
              {tab.label}
            </button>
          ))}
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

      {/* ─── Form name / desc (visual only) ─── */}
      {view === "visual" && (
        <div className="krefrm-builder__meta">
          <div className="krefrm-builder__name-field">
            <input
              type="text"
              className={`krefrm-builder__name-input ${
                nameError ? "is-invalid" : ""
              } ${shakeNameInput ? "is-shaking" : ""}`}
              placeholder={__("Form Name", "kreebi-forms")}
              value={builder.formName}
              onChange={handleFormNameChange}
            />
            {nameError && (
              <p className="krefrm-builder__name-error">{nameError}</p>
            )}
          </div>
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
      {view === "json" && (
        <JsonEditor getJson={builder.getJson} onApply={builder.setFromJson} />
      )}

      {/* Integration settings panels */}
      {view.startsWith("intg:") &&
        (() => {
          const integrationId = view.replace("intg:", "");
          const integration = getIntegration(integrationId);
          if (!integration?.FormTab) return null;
          const { FormTab, config } = integration;
          const formSettings = builder.formIntegrations[integrationId] || {};
          const globalSettings = config.settingsKey
            ? globalIntegrationSettings[config.settingsKey] || {}
            : {};
          const availableFields = builder.steps
            .flatMap((step) => step?.fields || [])
            .map((field) => ({ name: field?.name || "" }));
          return (
            <div className="krefrm-intg-panel">
              <FormTab
                globalSettings={globalSettings}
                formSettings={formSettings}
                availableFields={availableFields}
                formId={formId}
                onSave={triggerFormSave}
                isEditing={isEditing}
                onChange={(updated) =>
                  builder.setFormIntegration(integrationId, updated)
                }
              />
            </div>
          );
        })()}

      {view === "visual" && (
        <div className="krefrm-builder__columns">
          <FieldLibrary onAdd={(defaults) => builder.addField(defaults)} />

          <FormPreview
            steps={builder.steps}
            currentStepIndex={builder.currentStepIndex}
            selection={builder.selection}
            onSelectField={selectField}
            onRequestSettingsAttention={triggerSettingsAttention}
            onSelectStep={selectStep}
            onUpdateStep={builder.updateStep}
            onRemoveField={builder.removeField}
            onMoveFieldBy={builder.moveFieldBy}
          />

          <SettingsPanel
            isAttentionActive={settingsAttention}
            selection={builder.selection}
            steps={builder.steps}
            onUpdateStep={builder.updateStep}
            onRemoveStep={builder.removeStep}
            onUpdateField={builder.updateField}
            onRemoveField={builder.removeField}
          />
        </div>
      )}
    </div>
  );
}
