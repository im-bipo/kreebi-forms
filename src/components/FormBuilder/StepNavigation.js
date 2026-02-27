/**
 * StepNavigation – step navigation bar inside the form preview.
 *
 * [ ← Previous ] Step Name [ Next → | + Add Step ]
 */

import { __ } from "@wordpress/i18n";
import { Button } from "@wordpress/components";

export default function StepNavigation({
  steps,
  currentStepIndex,
  onSelectStep,
}) {
  const step = steps[currentStepIndex];

  return (
    <div className="krefrm-step-nav-bar">
      <Button
        variant="secondary"
        isSmall
        onClick={() => {
          window.location.href = "admin.php?page=krefrm_forms#upgrade-to-pro";
        }}
      >
        {__("← Previous (Pro)", "kreebi-forms")}
      </Button>

      <button
        type="button"
        className="krefrm-step-nav-bar__title"
        onClick={onSelectStep}
        title={__("Click to edit step settings", "kreebi-forms")}
      >
        {step?.name || `${__("Step", "kreebi-forms")} ${currentStepIndex + 1}`}
        <span className="krefrm-step-nav-bar__badge">
          {currentStepIndex + 1} / {steps.length}
        </span>
      </button>

      <Button
        variant="primary"
        isSmall
        onClick={() => {
          window.location.href = "admin.php?page=krefrm_forms#upgrade-to-pro";
        }}
      >
        {__("+ Add Step (Pro)", "kreebi-forms")}
      </Button>
    </div>
  );
}
