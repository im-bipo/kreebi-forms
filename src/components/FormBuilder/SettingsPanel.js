/**
 * SettingsPanel – right sidebar that changes based on selection.
 *
 *  - Step selected  → step name editor + delete step button.
 *  - Field selected → field name, type, placeholder, required.
 *  - Nothing selected → helper text.
 */

import { __ } from "@wordpress/i18n";
import {
  TextControl,
  SelectControl,
  ToggleControl,
  Button,
} from "@wordpress/components";
import FIELD_TYPES from "./fieldTypes";

const TYPE_OPTIONS = FIELD_TYPES.map((ft) => ({
  label: ft.label,
  value: ft.type,
}));

export default function SettingsPanel({
  selection,
  steps,
  onUpdateStep,
  onRemoveStep,
  onUpdateField,
  onRemoveField,
}) {
  if (!selection) {
    return (
      <div className="krefrm-settings-panel">
        <div className="krefrm-settings-panel__empty">
          {__("Select a step or field to edit its settings.", "kreebi-forms")}
        </div>
      </div>
    );
  }

  /* ─── Step settings ─── */
  if (selection.type === "step") {
    const step = steps[selection.stepIndex];
    if (!step) return null;

    return (
      <div className="krefrm-settings-panel">
        <h3 className="krefrm-settings-panel__title">
          {__("Step Settings", "kreebi-forms")}
        </h3>

        <TextControl
          label={__("Step Name", "kreebi-forms")}
          value={step.name || ""}
          onChange={(val) => onUpdateStep(selection.stepIndex, { name: val })}
        />

        {steps.length > 1 && (
          <Button
            variant="secondary"
            isDestructive
            isSmall
            onClick={() => onRemoveStep(selection.stepIndex)}
            style={{ marginTop: 12 }}
          >
            {__("Delete Step", "kreebi-forms")}
          </Button>
        )}
      </div>
    );
  }

  /* ─── Field settings ─── */
  if (selection.type === "field") {
    const field = steps[selection.stepIndex]?.fields?.[selection.fieldIndex];
    if (!field) return null;

    const update = (patch) =>
      onUpdateField(selection.stepIndex, selection.fieldIndex, patch);

    return (
      <div className="krefrm-settings-panel">
        <h3 className="krefrm-settings-panel__title">
          {__("Field Settings", "kreebi-forms")}
        </h3>

        <TextControl
          label={__("Label / Name", "kreebi-forms")}
          value={field.name || ""}
          onChange={(val) => update({ name: val })}
        />

        <SelectControl
          label={__("Type", "kreebi-forms")}
          value={field.type || "text"}
          options={TYPE_OPTIONS}
          onChange={(val) => update({ type: val })}
        />

        <TextControl
          label={__("Placeholder", "kreebi-forms")}
          value={field.placeholder || ""}
          onChange={(val) => update({ placeholder: val })}
        />

        <ToggleControl
          label={__("Required", "kreebi-forms")}
          checked={!!field.required}
          onChange={(val) => update({ required: val })}
        />

        <hr />
        <div
          style={{
            padding: "16px",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
            textAlign: "center",
            marginTop: "12px",
          }}
        >
          <p style={{ margin: "0 0 8px 0", fontWeight: "bold" }}>
            {__("Custom CSS & ID", "kreebi-forms")}
          </p>
          <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#666" }}>
            {__("This feature requires Kreebi Forms Pro", "kreebi-forms")}
          </p>
          <Button
            variant="primary"
            isSmall
            onClick={() => {
              window.location.href =
                "admin.php?page=krefrm_forms#upgrade-to-pro";
            }}
          >
            {__("Upgrade to Pro", "kreebi-forms")}
          </Button>
        </div>

        <div style={{ marginTop: 16 }}>
          <Button
            variant="secondary"
            isDestructive
            isSmall
            onClick={() =>
              onRemoveField(selection.stepIndex, selection.fieldIndex)
            }
          >
            {__("Remove Field", "kreebi-forms")}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
