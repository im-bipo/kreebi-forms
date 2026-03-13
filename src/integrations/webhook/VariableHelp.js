import { __ } from "@wordpress/i18n";

export function buildFieldVars(fields = []) {
  return Array.from(
    new Set(
      (fields || [])
        .map((field) => field?.name || "")
        .map((name) =>
          String(name)
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_-]/g, ""),
        )
        .filter(Boolean),
    ),
  );
}

export default function VariableHelp({ fieldVariables = [] }) {
  const vars = [
    "[[allForm]]",
    "[[formId]]",
    "[[formDescription]]",
    ...fieldVariables.map((name) => `[[${name}]]`),
  ];

  return (
    <div className="krefrm-webhook-vars">
      <p className="krefrm-webhook-vars__title">
        {__("Available variables", "kreebi-forms")}
      </p>
      <p className="krefrm-webhook-vars__desc">
        {__(
          "Use these placeholders in body template. [[allForm]] is the full object with form_id, form_description and fields.",
          "kreebi-forms",
        )}
      </p>
      <div className="krefrm-webhook-vars__chips">
        {vars.map((v) => (
          <code key={v} className="krefrm-webhook-vars__chip">
            {v}
          </code>
        ))}
      </div>
    </div>
  );
}
