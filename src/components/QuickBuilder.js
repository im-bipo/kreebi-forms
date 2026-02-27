/**
 * QuickBuilder – a simplified form builder that lets users
 * create forms in easy, guided steps.
 *
 * Props:
 *  initialData  {Object}   template data ({ name, fields })
 *  onSave       {Function} called with form JSON when Save is clicked
 *  onAdvanced   {Function} called with form JSON to open in the advance builder
 *  onCancel     {Function} called when user wants to go back
 *  saveLabel    {string}   label for the save button (defaults to "Save")
 */

import { useState, useCallback, useRef, useEffect } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import {
  Button,
  TextControl,
  ToggleControl,
  SelectControl,
} from "@wordpress/components";

/* ─── SVG Icons ─── */
function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-pencil-icon lucide-pencil"
    >
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 4h12M6.5 7v5M9.5 7v5M3 4l.8 10c0 .5.5 1 1 1h6.4c.5 0 1-.5 1-1l.8-10M5.5 4V2.5c0-.3.2-.5.5-.5h4c.3 0 .5.2.5.5V4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/* ─── Available field types the user can add ─── */
const ADD_FIELD_TYPES = [
  { type: "text", label: "Text", icon: "Aa" },
  { type: "email", label: "Email", icon: "@" },
  { type: "number", label: "Number", icon: "#" },
  { type: "password", label: "Password", icon: "••" },
  { type: "select", label: "Select", icon: "▾" },
];

let _qid = 0;
function quid() {
  _qid += 1;
  return `qf_${Date.now().toString(36)}_${_qid}`;
}

function fieldFromTemplate(f) {
  return {
    _uid: quid(),
    name: f.name || "",
    type: f.type || "text",
    placeholder: f.placeholder || "",
    required: !!f.required,
    options: f.options || [],
  };
}

function newBlankField(type = "text") {
  const meta =
    ADD_FIELD_TYPES.find((t) => t.type === type) || ADD_FIELD_TYPES[0];
  return {
    _uid: quid(),
    name: `${meta.label} Field`,
    type,
    placeholder: "",
    required: false,
    options: type === "select" ? ["Option 1", "Option 2"] : [],
  };
}

export default function QuickBuilder({
  initialData = {},
  onSave,
  onAdvanced,
  onCancel,
  saveLabel,
}) {
  const [formName, setFormName] = useState(initialData.name || "");
  const [fields, setFields] = useState(() =>
    (initialData.fields || []).map(fieldFromTemplate),
  );
  const [expandedField, setExpandedField] = useState(null);
  const [closingField, setClosingField] = useState(null);
  const [showAddFields, setShowAddFields] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ─── Drag state ─── */
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const fieldsContainerRef = useRef(null);

  /* ─── Close accordion on outside click ─── */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!expandedField) return;

      // Check if click is outside the fields container or on certain interactive elements
      const isClickOutside = !fieldsContainerRef.current?.contains(e.target);
      const isAddButton = e.target.closest(".krefrm-qb__add-toggle");
      const isAddItem = e.target.closest(".krefrm-qb__add-item");
      const isHeaderButton = e.target.closest(".krefrm-qb__header");

      if (isClickOutside || isAddButton || isAddItem || isHeaderButton) {
        setExpandedField(null);
      }
    };

    if (expandedField) {
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [expandedField]);
  const toggleFieldExpanded = useCallback(
    (uid) => {
      if (expandedField === uid) {
        setClosingField(uid);
        setTimeout(() => {
          setExpandedField(null);
          setClosingField(null);
        }, 300);
      } else {
        setClosingField(null);
        setExpandedField(uid);
      }
    },
    [expandedField],
  );

  const handleDragStart = (index) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const from = dragItem.current;
    const to = dragOverItem.current;
    if (from === to) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }
    setFields((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    dragItem.current = null;
    dragOverItem.current = null;
  };

  /* ─── Field CRUD ─── */
  const updateField = useCallback((uid, patch) => {
    setFields((prev) =>
      prev.map((f) => (f._uid === uid ? { ...f, ...patch } : f)),
    );
  }, []);

  const removeField = useCallback((uid) => {
    setFields((prev) => prev.filter((f) => f._uid !== uid));
    setExpandedField((prev) => (prev === uid ? null : prev));
  }, []);

  const addField = useCallback((type) => {
    const f = newBlankField(type);
    setFields((prev) => [...prev, f]);
    setExpandedField(f._uid);
    setShowAddFields(false);
  }, []);

  /* ─── Build JSON ─── */
  const buildJson = () => {
    const cleanFields = fields.map(({ _uid, ...rest }) => rest);
    return { name: formName, fields: cleanFields };
  };

  /* ─── Save ─── */
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(buildJson());
    } catch (_) {
      /* caller handles errors */
    }
    setSaving(false);
  };

  /* ─── Edit in Advance Builder ─── */
  const handleAdvanced = () => {
    onAdvanced(buildJson());
  };

  return (
    <div className="krefrm-qb">
      {/* Header */}
      <div className="krefrm-qb__header">
        <h2>{__("Quick Builder", "kreebi-forms")}</h2>
        <p>{__("Build your form in a few simple steps.", "kreebi-forms")}</p>
      </div>

      {/* Form name */}
      <div className="krefrm-qb__section">
        <TextControl
          label={__("Form Name", "kreebi-forms")}
          value={formName}
          onChange={setFormName}
          placeholder={__("e.g. Contact Form", "kreebi-forms")}
          __nextHasNoMarginBottom
        />
      </div>

      {/* Fields */}
      <div className="krefrm-qb__section">
        <h3 className="krefrm-qb__section-title">
          {__("Fields", "kreebi-forms")}
        </h3>

        {fields.length === 0 && (
          <p className="krefrm-qb__empty">
            {__("No fields yet. Add one below.", "kreebi-forms")}
          </p>
        )}

        <div className="krefrm-qb__fields" ref={fieldsContainerRef}>
          {fields.map((field, index) => {
            const isOpen = expandedField === field._uid;
            return (
              <div
                key={field._uid}
                className={`krefrm-qb-field ${isOpen ? "is-open" : ""}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
              >
                {/* Collapsed row */}
                <div className="krefrm-qb-field__row">
                  <span
                    className="krefrm-qb-field__handle"
                    title={__("Drag to reorder", "kreebi-forms")}
                  >
                    ⠿
                  </span>

                  <div className="krefrm-qb-field__info">
                    <span className="krefrm-qb-field__name">
                      {field.name || __("(untitled)", "kreebi-forms")}
                    </span>
                    <span className="krefrm-qb-field__placeholder">
                      {field.placeholder || field.type}
                    </span>
                  </div>

                  <button
                    className="krefrm-qb-field__toggle"
                    onClick={() => toggleFieldExpanded(field._uid)}
                    aria-expanded={isOpen}
                    title={
                      isOpen
                        ? __("Collapse", "kreebi-forms")
                        : __("Expand", "kreebi-forms")
                    }
                  >
                    <PencilIcon />
                  </button>

                  <button
                    className="krefrm-qb-field__delete"
                    onClick={() => removeField(field._uid)}
                    title={__("Remove field", "kreebi-forms")}
                  >
                    <TrashIcon />
                  </button>
                </div>

                {/* Expanded editor */}
                {(isOpen || closingField === field._uid) && (
                  <div
                    className={`krefrm-qb-field__editor ${
                      closingField === field._uid ? "is-closing" : ""
                    }`}
                  >
                    <TextControl
                      label={__("Field Name", "kreebi-forms")}
                      value={field.name}
                      onChange={(v) => updateField(field._uid, { name: v })}
                      __nextHasNoMarginBottom
                    />
                    <TextControl
                      label={__("Placeholder", "kreebi-forms")}
                      value={field.placeholder}
                      onChange={(v) =>
                        updateField(field._uid, { placeholder: v })
                      }
                      __nextHasNoMarginBottom
                    />
                    <SelectControl
                      label={__("Type", "kreebi-forms")}
                      value={field.type}
                      options={ADD_FIELD_TYPES.map((t) => ({
                        label: t.label,
                        value: t.type,
                      }))}
                      onChange={(v) => updateField(field._uid, { type: v })}
                      __nextHasNoMarginBottom
                    />
                    <ToggleControl
                      label={__("Required", "kreebi-forms")}
                      checked={field.required}
                      onChange={(v) => updateField(field._uid, { required: v })}
                      __nextHasNoMarginBottom
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add more fields accordion */}
        <div className="krefrm-qb__add-section">
          <button
            className="krefrm-qb__add-toggle"
            onClick={() => setShowAddFields(!showAddFields)}
            aria-expanded={showAddFields}
          >
            <span>{__("Add a field", "kreebi-forms")}</span>
            <span>{showAddFields ? "▲" : "▼"}</span>
          </button>

          {showAddFields && (
            <div className="krefrm-qb__add-list">
              {ADD_FIELD_TYPES.map((t) => (
                <button
                  key={t.type}
                  className="krefrm-qb__add-item"
                  onClick={() => addField(t.type)}
                >
                  <span className="krefrm-qb__add-icon">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="krefrm-qb__footer">
        <Button variant="secondary" onClick={handleAdvanced}>
          {__("Edit in Advance Builder", "kreebi-forms")}
        </Button>

        <Button
          variant="primary"
          onClick={handleSave}
          isBusy={saving}
          disabled={saving || !formName.trim()}
        >
          {saving
            ? __("Saving…", "kreebi-forms")
            : saveLabel || __("Save", "kreebi-forms")}
        </Button>
      </div>
    </div>
  );
}
