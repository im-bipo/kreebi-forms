import { useState, useEffect, useCallback } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import apiFetch from "@wordpress/api-fetch";
import { Button, Notice, Spinner, Modal } from "@wordpress/components";
import ProTag from "../components/ProTag";

// Helper to parse form ID from URL hash
function getFormIdFromHash() {
  const hash = window.location.hash;
  const match = hash.match(/formid=([^&]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Helper to update hash with form ID
function updateHashWithFormId(formId) {
  if (formId) {
    window.location.hash = `submission?formid=${encodeURIComponent(formId)}`;
  } else {
    window.location.hash = "submission";
  }
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedForm, setSelectedForm] = useState(() => getFormIdFromHash());
  const [viewMode, setViewMode] = useState("table"); // default to table view
  const [selectedSubmissions, setSelectedSubmissions] = useState([]); // for bulk actions

  // state for our own confirmation modal (avoids browser dialog suppression)
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    id: null,
    bulk: false,
  });

  const openConfirm = (id = null, bulk = false) => {
    setConfirmDialog({ open: true, id, bulk });
  };
  const closeConfirm = () => {
    setConfirmDialog({ open: false, id: null, bulk: false });
  };

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch({ path: "/kreebi-forms/v1/submissions" });
      setSubmissions(data);
    } catch (err) {
      setError(
        err.message || __("Failed to load submissions.", "kreebi-forms"),
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Sync selected form to URL hash
  useEffect(() => {
    updateHashWithFormId(selectedForm);
  }, [selectedForm]);

  // Listen for hash changes so back button updates view
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      // Only process if this is a submission-related hash
      if (hash.includes("submission")) {
        const id = getFormIdFromHash();
        setSelectedForm(id);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const handleDelete = async (id) => {
    // perform deletion after user confirmed via our modal
    try {
      await apiFetch({
        path: `/kreebi-forms/v1/submissions/${id}`,
        method: "DELETE",
      });
      setSuccess(__("Submission deleted.", "kreebi-forms"));
      fetchSubmissions();
      setSelectedSubmissions([]); // clear selection after delete
    } catch (err) {
      setError(err.message || __("Failed to delete.", "kreebi-forms"));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSubmissions.length === 0) return;
    openConfirm(null, true);
  };

  const performBulkDelete = async () => {
    try {
      // Delete all selected submissions
      await Promise.all(
        selectedSubmissions.map((id) =>
          apiFetch({
            path: `/kreebi-forms/v1/submissions/${id}`,
            method: "DELETE",
          }),
        ),
      );
      setSuccess(__("Selected submissions deleted.", "kreebi-forms"));
      fetchSubmissions();
      setSelectedSubmissions([]); // clear selection after delete
    } catch (err) {
      setError(err.message || __("Failed to delete.", "kreebi-forms"));
    }
  };

  const handleSelectSubmission = (id) => {
    setSelectedSubmissions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (formSubmissions) => {
    const allIds = formSubmissions.map((sub) => sub.id);
    if (selectedSubmissions.length === allIds.length) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(allIds);
    }
  };

  // Group submissions by form_id
  const groupedByFormId = submissions.reduce((acc, sub) => {
    const formId = sub.form_id || "unknown";
    const formName = sub.form_name || __("Unknown Form", "kreebi-forms");
    if (!acc[formId]) {
      acc[formId] = {
        formName: formName,
        submissions: [],
      };
    }
    acc[formId].submissions.push(sub);
    return acc;
  }, {});

  const formList = Object.entries(groupedByFormId).map(([formId, group]) => {
    // determine creation date from earliest submission (last in array because fetched desc order)
    const created = group.submissions.length
      ? group.submissions[group.submissions.length - 1].date
      : null;
    return {
      id: formId,
      name: group.formName,
      count: group.submissions.length,
      submissions: group.submissions,
      created,
    };
  });

  if (loading) {
    return (
      <div className="krefrm-loading">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <Notice status="error" isDismissible onDismiss={() => setError("")}>
          {error}
        </Notice>
      )}
      {success && (
        <Notice status="success" isDismissible onDismiss={() => setSuccess("")}>
          {success}
        </Notice>
      )}

      {/* Main submissions view - show forms list */}
      {!selectedForm ? (
        <div>
          <h2>{__("Your submissions", "kreebi-forms")}</h2>
          {formList.length === 0 ? (
            <p>{__("No submissions yet.", "kreebi-forms")}</p>
          ) : (
            <div className="krefrm-forms-grid">
              {formList.map((form) => (
                <div key={form.id} className="krefrm-submission-form-card">
                  <h3 className="krefrm-submission-form-card__title">
                    {form.name}
                  </h3>
                  {form.created && (
                    <p className="krefrm-submission-form-card__created">
                      {__("Created:", "kreebi-forms")} {form.created}
                    </p>
                  )}
                  <p className="krefrm-submission-form-card__count">
                    {form.count}{" "}
                    {form.count === 1
                      ? __("Submission", "kreebi-forms")
                      : __("Submissions", "kreebi-forms")}
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setSelectedForm(form.id)}
                  >
                    {__("View Submissions", "kreebi-forms")}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Form detail view - show submissions for selected form */
        <div>
          <Button
            variant="tertiary"
            onClick={() => setSelectedForm(null)}
            style={{ marginBottom: "16px" }}
          >
            ← {__("Back to Forms", "kreebi-forms")}
          </Button>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            {/* View toggle buttons */}
            {groupedByFormId[selectedForm]?.submissions.length > 0 && (
              <div
                className="krefrm-view-toggle"
                style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
              >
                <Button
                  variant={viewMode === "table" ? "primary" : "secondary"}
                  onClick={() => setViewMode("table")}
                >
                  {__("Table View", "kreebi-forms")}
                </Button>
                <Button
                  variant={viewMode === "card" ? "primary" : "secondary"}
                  onClick={() => setViewMode("card")}
                >
                  {__("Card View", "kreebi-forms")}
                </Button>
                <a
                  href="admin.php?page=krefrm_forms#upgrade-to-pro"
                  className="components-button components-button--secondary"
                >
                  {__("Bulk Actions", "kreebi-forms")} <ProTag />
                </a>
                <a
                  href="admin.php?page=krefrm_forms#upgrade-to-pro"
                  className="components-button components-button--secondary"
                >
                  {__("Export Data", "kreebi-forms")} <ProTag />
                </a>
                <a
                  href="admin.php?page=krefrm_forms#upgrade-to-pro"
                  className="components-button components-button--secondary"
                >
                  {__("Connect to Google Sheet", "kreebi-forms")} <ProTag />
                </a>
              </div>
            )}
          </div>

          {!groupedByFormId[selectedForm] ||
          groupedByFormId[selectedForm].submissions.length === 0 ? (
            <p>{__("No submissions found.", "kreebi-forms")}</p>
          ) : viewMode === "card" ? (
            /* Card view */
            groupedByFormId[selectedForm].submissions.map((sub) => (
              <div key={sub.id} className="krefrm-submission-card">
                <div className="krefrm-submission-header">
                  <h3>{sub.title}</h3>
                  <Button
                    variant="tertiary"
                    isSmall
                    isDestructive
                    onClick={() => openConfirm(sub.id)}
                  >
                    {__("Delete", "kreebi-forms")}
                  </Button>
                </div>
                <p>
                  <strong>{__("Submitted:", "kreebi-forms")}</strong> {sub.date}
                </p>

                {Object.keys(sub.data).length > 0 ? (
                  <table className="widefat fixed striped krefrm-submission-data-table">
                    <thead>
                      <tr>
                        <th>{__("Field", "kreebi-forms")}</th>
                        <th>{__("Value", "kreebi-forms")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(sub.data).map(([key, value]) => (
                        <tr key={key}>
                          <td>
                            {key
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase())}
                          </td>
                          <td>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>{__("No data submitted.", "kreebi-forms")}</p>
                )}
              </div>
            ))
          ) : (
            /* Table view */
            <div className="krefrm-submissions-table-wrapper">
              <table className="widefat striped krefrm-submissions-list-table">
                <thead>
                  <tr>
                    <th>{__("Submitted", "kreebi-forms")}</th>
                    {/* Dynamically add field headers from first submission */}
                    {groupedByFormId[selectedForm]?.submissions[0]?.data &&
                      Object.keys(
                        groupedByFormId[selectedForm].submissions[0].data,
                      ).map((key) => (
                        <th key={key}>
                          {key
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </th>
                      ))}
                    <th>{__("Action", "kreebi-forms")}</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedByFormId[selectedForm]?.submissions.map((sub) => (
                    <tr key={sub.id}>
                      <td>{sub.date}</td>
                      {Object.keys(
                        groupedByFormId[selectedForm]?.submissions[0]?.data ||
                          {},
                      ).map((key) => (
                        <td key={key}>{sub.data[key] || "—"}</td>
                      ))}
                      <td>
                        <Button
                          variant="tertiary"
                          isSmall
                          isDestructive
                          onClick={() => openConfirm(sub.id)}
                        >
                          {__("Delete", "kreebi-forms")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* confirmation modal (avoids browser dialog suppression) */}
      {confirmDialog.open && (
        <Modal
          title={
            confirmDialog.bulk
              ? __("Delete selected submissions?", "kreebi-forms")
              : __("Delete this submission?", "kreebi-forms")
          }
          onRequestClose={closeConfirm}
          shouldCloseOnClickOutside={false}
        >
          <p>{__("This action cannot be undone.", "kreebi-forms")}</p>
          <div style={{ marginTop: 20, textAlign: "right" }}>
            <Button
              variant="secondary"
              onClick={closeConfirm}
              style={{ marginRight: 8 }}
            >
              {__("Cancel", "kreebi-forms")}
            </Button>
            <Button
              variant="primary"
              isDestructive
              onClick={async () => {
                closeConfirm();
                if (confirmDialog.bulk) {
                  await performBulkDelete();
                } else if (confirmDialog.id) {
                  await handleDelete(confirmDialog.id);
                }
              }}
            >
              {__("Yes, delete", "kreebi-forms")}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
