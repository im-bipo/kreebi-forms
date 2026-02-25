/**
 * FormSettings – form-level settings shown when "Form Settings" is active.
 *
 * Currently supports:
 *  - styleTemplate: controls which internal CSS classes are injected at render time.
 */

import { __ } from "@wordpress/i18n";
import { SelectControl } from "@wordpress/components";

const STYLE_TEMPLATE_OPTIONS = [
  {
    label: __("Kreebi Style 1 — polished default UI", "kreebi-forms"),
    value: "kreebi_style_1",
  },
  {
    label: __("Kreebi Style 2 — alternative UI", "kreebi-forms"),
    value: "kreebi_style_2",
  },
  {
    label: __("Blank / Developer — no injected styles", "kreebi-forms"),
    value: "blank_dev",
  },
];

export default function FormSettings({ styleTemplate, onChangeStyleTemplate }) {
  return (
    <div className="krefrm-form-settings">
      <h2 className="krefrm-form-settings__title">
        {__("Form Settings", "kreebi-forms")}
      </h2>

      <div className="krefrm-form-settings__section">
        <SelectControl
          label={__("Style Template", "kreebi-forms")}
          value={styleTemplate || "kreebi_style_1"}
          options={STYLE_TEMPLATE_OPTIONS}
          onChange={onChangeStyleTemplate}
          help={__(
            "Controls which internal CSS classes are injected when the form is rendered on the frontend. Developer-provided wrapper classes are always preserved.",
            "kreebi-forms",
          )}
        />

        <div className="krefrm-form-settings__preview">
          <h4 style={{ margin: "16px 0 8px" }}>
            {__("Template preview", "kreebi-forms")}
          </h4>

          {styleTemplate === "kreebi_style_1" && (
            <p className="description">
              {__(
                "Injects krefrm-ui-style-1-* classes for a polished, rounded form look with shadow and spacing.",
                "kreebi-forms",
              )}
            </p>
          )}
          {styleTemplate === "kreebi_style_2" && (
            <p className="description">
              {__(
                "Injects krefrm-ui-style-2-* classes for a flat, bordered form with compact spacing.",
                "kreebi-forms",
              )}
            </p>
          )}
          {styleTemplate === "blank_dev" && (
            <p className="description">
              {__(
                "No internal classes are injected. The developer is responsible for all styling.",
                "kreebi-forms",
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
