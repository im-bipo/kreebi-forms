/**
 * JsonEditor – raw JSON view with two-way sync.
 *
 * Changes here are applied to the builder state when the user clicks
 * "Apply", not on every keystroke (to avoid breaking mid-edit JSON).
 */

import { useState, useEffect, useCallback } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { Button, TextareaControl, Notice } from "@wordpress/components";

export default function JsonEditor({ getJson, onApply }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  // Sync FROM builder → textarea whenever the view is opened or builder changes
  useEffect(() => {
    if (!dirty) {
      setValue(JSON.stringify(getJson(), null, 2));
    }
  }, [getJson, dirty]);

  const handleChange = useCallback((v) => {
    setValue(v);
    setDirty(true);
    setError("");
  }, []);

  const handleApply = useCallback(() => {
    try {
      const parsed = JSON.parse(value);
      onApply(parsed);
      setDirty(false);
      setError("");
    } catch (err) {
      setError(
        err instanceof SyntaxError
          ? __("Invalid JSON. Please check the syntax.", "kreebi-forms")
          : err.message,
      );
    }
  }, [value, onApply]);

  const handleReset = useCallback(() => {
    setValue(JSON.stringify(getJson(), null, 2));
    setDirty(false);
    setError("");
  }, [getJson]);

  return (
    <div className="krefrm-json-editor">
      {error && (
        <Notice status="error" isDismissible onDismiss={() => setError("")}>
          {error}
        </Notice>
      )}

      <TextareaControl
        label={__("Form JSON", "kreebi-forms")}
        value={value}
        onChange={handleChange}
        rows={22}
        className="krefrm-json-textarea"
      />

      <div className="krefrm-json-editor__actions">
        <Button
          variant="primary"
          isSmall
          disabled={!dirty}
          onClick={handleApply}
        >
          {__("Apply JSON", "kreebi-forms")}
        </Button>
        <Button
          variant="tertiary"
          isSmall
          disabled={!dirty}
          onClick={handleReset}
        >
          {__("Reset", "kreebi-forms")}
        </Button>
      </div>
    </div>
  );
}
