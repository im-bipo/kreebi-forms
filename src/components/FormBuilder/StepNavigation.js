/**
 * StepNavigation – step navigation bar inside the form preview.
 *
 * [ ← Previous ] Step Name [ Next → | + Add Step ]
 */

import { __ } from "@wordpress/i18n";
import { Button } from "@wordpress/components";
import { useState, useRef, useEffect } from "@wordpress/element";
import ProTag from "../ProTag";

export default function StepNavigation({
  steps,
  currentStepIndex,
  onSelectStep,
  onUpdateStep,
}) {
  const step = steps[currentStepIndex];
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(step?.name || "");
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(step?.name || "");
  }, [step?.name, currentStepIndex]);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const commit = () => {
    const name = value && value.trim() ? value.trim() : undefined;
    if (onUpdateStep) {
      onUpdateStep(currentStepIndex, { name });
    }
    setEditing(false);
  };

  const cancel = () => {
    setValue(step?.name || "");
    setEditing(false);
  };

  return (
    <div className="krefrm-step-nav-bar">
      <Button
        variant="secondary"
        onClick={() => {
          window.location.href = "admin.php?page=krefrm_forms#upgrade-to-pro";
        }}
      >
        {__("← Previous", "kreebi-forms")} <ProTag />
      </Button>

      <div className="krefrm-step-nav-bar__title">
        {!editing ? (
          <button
            type="button"
            className="krefrm-step-nav-bar__title-button"
            onClick={() => setEditing(true)}
          >
            {step?.name ||
              `${__("Step", "kreebi-forms")} ${currentStepIndex + 1}`}
            <span className="krefrm-step-nav-bar__badge">
              {currentStepIndex + 1} / {steps.length}
            </span>
          </button>
        ) : (
          <div className="krefrm-step-nav-bar__title-edit">
            <input
              ref={inputRef}
              type="text"
              className="krefrm-step-nav-bar__title-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  commit();
                }
                if (e.key === "Escape") {
                  cancel();
                }
              }}
            />
          </div>
        )}
      </div>

      <Button
        variant="primary"
        onClick={() => {
          window.location.href = "admin.php?page=krefrm_forms#upgrade-to-pro";
        }}
      >
        {__("+ Add Step", "kreebi-forms")} <ProTag variant="secondary" />
      </Button>
    </div>
  );
}
