/**
 * JsonEditor – raw JSON view with two-way sync.
 *
 * Changes here are applied to the builder state when the user clicks
 * "Apply", not on every keystroke (to avoid breaking mid-edit JSON).
 */

import { useState, useEffect, useCallback } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { Button, TextareaControl } from "@wordpress/components";
import { useToast } from "../Toast";

export default function JsonEditor({ getJson, onApply }) {
  const toast = useToast();
  const [value, setValue] = useState("");
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
  }, []);

  const handleApply = useCallback(() => {
    try {
      const parsed = JSON.parse(value);
      onApply(parsed);
      setDirty(false);
    } catch (err) {
      toast.error(
        err instanceof SyntaxError
          ? __("Invalid JSON. Please check the syntax.", "kreebi-forms")
          : err.message,
      );
    }
  }, [value, onApply, toast]);

  const handleReset = useCallback(() => {
    setValue(JSON.stringify(getJson(), null, 2));
    setDirty(false);
  }, [getJson]);

  return (
    <div className="krefrm-json-editor">
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
