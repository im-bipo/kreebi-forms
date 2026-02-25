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
  onPrev,
  onNext,
  onAddStep,
  onSelectStep,
}) {
  const step = steps[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

  return (
    <div className="krefrm-step-nav-bar">
      <Button variant="secondary" isSmall disabled={isFirst} onClick={onPrev}>
        {__("← Previous", "kreebi-forms")}
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

      {isLast ? (
        <Button variant="primary" isSmall onClick={onAddStep}>
          {__("+ Add Step", "kreebi-forms")}
        </Button>
      ) : (
        <Button variant="secondary" isSmall onClick={onNext}>
          {__("Next →", "kreebi-forms")}
        </Button>
      )}
    </div>
  );
}
