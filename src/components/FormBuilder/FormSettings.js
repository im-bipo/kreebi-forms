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
    label: __("Polished — modern rounded default UI", "kreebi-forms"),
    value: "style-polished",
  },
  {
    label: __("Flat — compact bordered alternative", "kreebi-forms"),
    value: "style-flat",
  },
  {
    label: __("Blank / Developer — no injected styles", "kreebi-forms"),
    value: "style-blank",
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
          value={styleTemplate || "style-polished"}
          options={STYLE_TEMPLATE_OPTIONS}
          onChange={onChangeStyleTemplate}
          help={__(
            "Controls the applied template styling. Shared base classes are always present, and developer-provided wrapper classes are preserved.",
            "kreebi-forms",
          )}
        />

        <div className="krefrm-form-settings__preview">
          <h4 style={{ margin: "16px 0 8px" }}>
            {__("Template preview", "kreebi-forms")}
          </h4>

          {styleTemplate === "style-polished" && (
            <p className="description">
              {__(
                "Injects krefrm-ui-style-1-* classes for a polished, rounded form look with shadow and spacing.",
                "kreebi-forms",
              )}
            </p>
          )}
          {styleTemplate === "style-flat" && (
            <p className="description">
              {__(
                "Injects krefrm-ui-style-2-* classes for a flat, bordered form with compact spacing.",
                "kreebi-forms",
              )}
            </p>
          )}
          {styleTemplate === "style-blank" && (
            <p className="description">
              {__(
                "No template-specific styles are injected. Shared base classes remain; the developer controls final styling.",
                "kreebi-forms",
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
