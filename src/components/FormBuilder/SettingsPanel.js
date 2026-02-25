/**
 * SettingsPanel – right sidebar that changes based on selection.
 *
 *  - Step selected  → step name editor + delete step button.
 *  - Field selected → field name, type, placeholder, required, wrapper class/id.
 *  - Nothing selected → helper text.
 */

import { __ } from "@wordpress/i18n";
import {
  TextControl,
  SelectControl,
  ToggleControl,
  Button,
  ButtonGroup,
} from "@wordpress/components";
import FIELD_TYPES from "./fieldTypes";

const TYPE_OPTIONS = FIELD_TYPES.map((ft) => ({
  label: ft.label,
  value: ft.type,
}));

const WIDTH_OPTIONS = [
  { label: __("Full", "kreebi-forms"), value: 12 },
  { label: __("2/3", "kreebi-forms"), value: 8 },
  { label: __("1/2", "kreebi-forms"), value: 6 },
  { label: __("1/3", "kreebi-forms"), value: 4 },
];

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

    const wrapper = field.wrapper || { class: "", id: "" };

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
        <h4 style={{ margin: "8px 0 4px" }}>{__("Width", "kreebi-forms")}</h4>
        <ButtonGroup className="krefrm-width-buttons">
          {WIDTH_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={
                (field.layout?.colSpan || 12) === opt.value
                  ? "primary"
                  : "secondary"
              }
              isSmall
              onClick={() =>
                update({
                  layout: { ...(field.layout || {}), colSpan: opt.value },
                })
              }
            >
              {opt.label}
            </Button>
          ))}
        </ButtonGroup>

        <hr />
        <h4 style={{ margin: "8px 0 4px" }}>{__("Wrapper", "kreebi-forms")}</h4>

        <TextControl
          label={__("CSS Class(es)", "kreebi-forms")}
          value={wrapper.class || ""}
          onChange={(val) => update({ wrapper: { ...wrapper, class: val } })}
          help={__(
            "Space-separated CSS classes for the wrapper div.",
            "kreebi-forms",
          )}
        />

        <TextControl
          label={__("ID", "kreebi-forms")}
          value={wrapper.id || ""}
          onChange={(val) => update({ wrapper: { ...wrapper, id: val } })}
          help={__(
            "Custom ID for the wrapper div (not the input).",
            "kreebi-forms",
          )}
        />

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
