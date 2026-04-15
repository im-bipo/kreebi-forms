/**
 * useFormBuilder – central state hook for the visual form builder.
 *
 * Manages steps, fields, selection, and exposes helpers that keep
 * the flat JSON model and the visual editor in sync.
 */

import { useState, useCallback, useMemo } from "@wordpress/element";

/** Generate a short random id for internal tracking. */
let _counter = 0;
export function uid() {
  _counter += 1;
  return `fld_${Date.now().toString(36)}_${_counter}`;
}

/**
 * Ensure every field has an internal `_uid` key so React can track it
 * through drag-and-drop moves without relying on array index.
 */
function ensureUids(steps) {
  return steps.map((step) => ({
    ...step,
    fields: (step.fields || []).map((f) =>
      f._uid ? f : { ...f, _uid: uid() },
    ),
  }));
}

/**
 * Strip internal _uid keys before exposing the model as JSON.
 */
export function stripUids(steps) {
  return steps.map((step) => ({
    ...step,
    fields: (step.fields || []).map(({ _uid, ...rest }) => rest),
  }));
}

/**
 * Build the full form JSON object from builder state.
 */
export function buildFormJson(
  name,
  description,
  steps,
  styleTemplate,
  formIntegrations,
) {
  const cleanSteps = stripUids(steps);
  const base = { name, description, styleTemplate };
  if (formIntegrations && Object.keys(formIntegrations).length > 0) {
    base.formIntegrations = formIntegrations;
  }
  // If only 1 step with no name, flatten to the legacy format
  if (cleanSteps.length === 1 && !cleanSteps[0].name) {
    return { ...base, fields: cleanSteps[0].fields };
  }
  return { ...base, steps: cleanSteps };
}

/**
 * Parse incoming form JSON (supports both `fields` and `steps`) into
 * normalised builder state.
 */
export function parseFormJson(json) {
  const name = json.name || "";
  const description = json.description || "";
  const styleTemplate = json.styleTemplate || "kreebi_style_1";
  const formIntegrations = json.formIntegrations || {};
  let steps = [];

  if (Array.isArray(json.steps) && json.steps.length) {
    steps = json.steps;
  } else if (Array.isArray(json.fields) && json.fields.length) {
    steps = [{ name: "", fields: json.fields }];
  } else {
    steps = [{ name: "", fields: [] }];
  }

  return {
    name,
    description,
    styleTemplate,
    formIntegrations,
    steps: ensureUids(steps),
  };
}

export default function useFormBuilder(initial = {}) {
  const parsed = useMemo(() => parseFormJson(initial), []);

  const [formName, setFormName] = useState(parsed.name);
  const [formDesc, setFormDesc] = useState(parsed.description);
  const [styleTemplate, setStyleTemplate] = useState(parsed.styleTemplate);
  const [formIntegrations, setFormIntegrations] = useState(
    parsed.formIntegrations,
  );
  const [steps, setSteps] = useState(parsed.steps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Selection: { type: 'step' | 'field', stepIndex, fieldIndex? }
  const [selection, setSelection] = useState(null);

  /* ─── Step helpers ─── */

  const addStep = useCallback(() => {
    setSteps((prev) => {
      const newStep = {
        name: `Step ${prev.length + 1}`,
        fields: [],
      };
      const next = [...prev, newStep];
      // Navigate to new step after state settles
      setTimeout(() => setCurrentStepIndex(next.length - 1), 0);
      return next;
    });
    setSelection(null);
  }, []);

  const updateStep = useCallback((index, patch) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  }, []);

  const removeStep = useCallback(
    (index) => {
      setSteps((prev) => {
        if (prev.length <= 1) return prev; // keep at least 1 step
        const next = prev.filter((_, i) => i !== index);
        return next;
      });
      setCurrentStepIndex((prev) => Math.min(prev, steps.length - 2));
      setSelection(null);
    },
    [steps.length],
  );

  /* ─── Field helpers ─── */

  const addField = useCallback(
    (fieldDefaults, stepIdx) => {
      const idx = stepIdx ?? currentStepIndex;
      const newField = { ...fieldDefaults, _uid: uid() };
      setSteps((prev) =>
        prev.map((s, i) =>
          i === idx ? { ...s, fields: [...s.fields, newField] } : s,
        ),
      );
    },
    [currentStepIndex],
  );

  const normalizeField = (field) => {
    const type = field.type || "text";
    const baseField = { ...field, type };

    if (["text", "email", "password", "number"].includes(type)) {
      const { options, ...rest } = baseField;
      return { ...rest, placeholder: rest.placeholder || "" };
    }

    if (["checkbox", "radio", "dropdown"].includes(type)) {
      const { placeholder, ...rest } = baseField;
      return {
        ...rest,
        options:
          Array.isArray(rest.options) && rest.options.length > 0
            ? rest.options
            : [
                { label: "Option 1", value: "Option 1" },
                { label: "Option 2", value: "Option 2" },
              ],
      };
    }

    return baseField;
  };

  const updateField = useCallback((stepIdx, fieldIdx, patch) => {
    setSteps((prev) =>
      prev.map((s, si) =>
        si === stepIdx
          ? {
              ...s,
              fields: s.fields.map((f, fi) => {
                if (fi !== fieldIdx) return f;
                const updated = { ...f, ...patch };
                return normalizeField(updated);
              }),
            }
          : s,
      ),
    );
  }, []);

  const removeField = useCallback((stepIdx, fieldIdx) => {
    setSteps((prev) =>
      prev.map((s, si) =>
        si === stepIdx
          ? { ...s, fields: s.fields.filter((_, fi) => fi !== fieldIdx) }
          : s,
      ),
    );
    setSelection(null);
  }, []);

  const reorderFields = useCallback((stepIdx, oldIndex, newIndex) => {
    setSteps((prev) =>
      prev.map((s, si) => {
        if (si !== stepIdx) return s;
        const fields = [...s.fields];
        const [moved] = fields.splice(oldIndex, 1);
        fields.splice(newIndex, 0, moved);
        return { ...s, fields };
      }),
    );
  }, []);

  const moveFieldToIndex = useCallback((stepIdx, fromIndex, toIndex) => {
    setSteps((prev) =>
      prev.map((s, si) => {
        if (si !== stepIdx) return s;
        const fields = [...s.fields];
        if (fromIndex < 0 || fromIndex >= fields.length) return s;

        const clampedTo = Math.max(0, Math.min(toIndex, fields.length - 1));
        const [moved] = fields.splice(fromIndex, 1);
        fields.splice(clampedTo, 0, moved);
        return { ...s, fields };
      }),
    );
  }, []);

  const moveFieldBy = useCallback(
    (stepIdx, fieldIdx, delta) => {
      moveFieldToIndex(stepIdx, fieldIdx, fieldIdx + delta);
    },
    [moveFieldToIndex],
  );

  const insertFieldAt = useCallback(
    (fieldDefaults, stepIdx, insertIndex) => {
      const idx = stepIdx ?? currentStepIndex;
      const newField = { ...fieldDefaults, _uid: uid() };
      setSteps((prev) =>
        prev.map((s, i) => {
          if (i !== idx) return s;
          const fields = [...s.fields];
          fields.splice(insertIndex, 0, newField);
          return { ...s, fields };
        }),
      );
    },
    [currentStepIndex],
  );

  /* ─── JSON sync ─── */

  const getJson = useCallback(() => {
    return buildFormJson(
      formName,
      formDesc,
      steps,
      styleTemplate,
      formIntegrations,
    );
  }, [formName, formDesc, steps, styleTemplate, formIntegrations]);

  const setFromJson = useCallback((json) => {
    const p = parseFormJson(json);
    setFormName(p.name);
    setFormDesc(p.description);
    setStyleTemplate(p.styleTemplate);
    setFormIntegrations(p.formIntegrations);
    setSteps(p.steps);
    setCurrentStepIndex(0);
    setSelection(null);
  }, []);

  /** Update form-level settings for a single integration. */
  const setFormIntegration = useCallback((integrationId, settings) => {
    setFormIntegrations((prev) => ({ ...prev, [integrationId]: settings }));
  }, []);

  return {
    // Form metadata
    formName,
    setFormName,
    formDesc,
    setFormDesc,
    styleTemplate,
    setStyleTemplate,

    // Steps
    steps,
    currentStepIndex,
    setCurrentStepIndex,
    addStep,
    updateStep,
    removeStep,

    // Fields
    addField,
    updateField,
    removeField,
    reorderFields,
    moveFieldToIndex,
    moveFieldBy,
    insertFieldAt,

    // Selection
    selection,
    setSelection,

    // JSON
    getJson,
    setFromJson,

    // Form-level integration settings
    formIntegrations,
    setFormIntegration,
  };
}
