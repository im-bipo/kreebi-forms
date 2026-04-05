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
import ProTag from "../ProTag";
import FIELD_TYPES from "./fieldTypes";

const TYPE_OPTIONS = FIELD_TYPES.map((ft) => ({
  label: ft.label,
  value: ft.type,
}));

export default function SettingsPanel({
  isAttentionActive = false,
  selection,
  steps,
  onUpdateStep,
  onRemoveStep,
  onUpdateField,
  onRemoveField,
}) {
  if (!selection) {
    return (
      <div
        className={`krefrm-settings-panel ${
          isAttentionActive ? "is-attention-active" : ""
        }`}
      >
        <div className="krefrm-settings-panel__empty">
          {__("Select a step or field to edit its settings.", "kreebi-forms")}
        </div>
      </div>
    );
  }

  /* Step settings removed — step editing is handled inline in the preview */
  if (selection.type === "step") {
    return (
      <div
        className={`krefrm-settings-panel ${
          isAttentionActive ? "is-attention-active" : ""
        }`}
      >
        <div className="krefrm-settings-panel__empty">
          {__("Select a step or field to edit its settings.", "kreebi-forms")}
        </div>
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
      <div
        className={`krefrm-settings-panel ${
          isAttentionActive ? "is-attention-active" : ""
        }`}
      >
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

        {field.type !== "checkbox" &&
          field.type !== "radio" &&
          field.type !== "dropdown" && (
            <TextControl
              label={__("Placeholder", "kreebi-forms")}
              value={field.placeholder || ""}
              onChange={(val) => update({ placeholder: val })}
            />
          )}

        {(field.type === "checkbox" ||
          field.type === "radio" ||
          field.type === "dropdown") && (
          <div
            style={{
              marginTop: 16,
              padding: "12px",
              backgroundColor: "#f9f9f9",
              borderRadius: "4px",
            }}
          >
            <p style={{ marginTop: 0, fontWeight: "bold", fontSize: "13px" }}>
              {__("Options", "kreebi-forms")}
            </p>
            {Array.isArray(field.options) &&
              field.options.map((opt, optIdx) => (
                <div
                  key={optIdx}
                  style={{ marginBottom: "8px", display: "flex", gap: "8px" }}
                >
                  <TextControl
                    placeholder={__("Option", "kreebi-forms")}
                    value={opt.label || opt.value || ""}
                    onChange={(val) => {
                      const newOpts = [...field.options];
                      newOpts[optIdx].label = val;
                      newOpts[optIdx].value = val;
                      update({ options: newOpts });
                    }}
                    style={{ flex: 1 }}
                  />
                  <Button
                    variant="secondary"
                    isSmall
                    isDestructive
                    onClick={() => {
                      const newOpts = field.options.filter(
                        (_, i) => i !== optIdx,
                      );
                      update({ options: newOpts });
                    }}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            <Button
              variant="secondary"
              isSmall
              onClick={() => {
                const newOpts = [...(field.options || [])];
                newOpts.push({
                  label: `Option ${newOpts.length + 1}`,
                  value: `Option ${newOpts.length + 1}`,
                });
                update({ options: newOpts });
              }}
            >
              {__("Add Option", "kreebi-forms")}
            </Button>
          </div>
        )}

        <ToggleControl
          label={__("Required", "kreebi-forms")}
          checked={!!field.required}
          onChange={(val) => update({ required: val })}
        />
        <div style={{ marginTop: 16 }}>
          <Button
            variant="secondary"
            isDestructive
            onClick={() =>
              onRemoveField(selection.stepIndex, selection.fieldIndex)
            }
          >
            {__("Remove Field", "kreebi-forms")}
          </Button>
        </div>
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
            onClick={() => {
              window.location.href =
                "admin.php?page=krefrm_forms#upgrade-to-pro";
            }}
          >
            {__("Upgrade to Pro", "kreebi-forms")}{" "}
            <ProTag variant="secondary" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
