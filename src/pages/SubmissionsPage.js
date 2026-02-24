import { useState, useEffect, useCallback } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import apiFetch from "@wordpress/api-fetch";
import { Button, Notice, Spinner } from "@wordpress/components";

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const handleDelete = async (id) => {
    if (!window.confirm(__("Delete this submission?", "kreebi-forms"))) {
      return;
    }
    try {
      await apiFetch({
        path: `/kreebi-forms/v1/submissions/${id}`,
        method: "DELETE",
      });
      setSuccess(__("Submission deleted.", "kreebi-forms"));
      fetchSubmissions();
    } catch (err) {
      setError(err.message || __("Failed to delete.", "kreebi-forms"));
    }
  };

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

      {submissions.length === 0 ? (
        <p>{__("No submissions yet.", "kreebi-forms")}</p>
      ) : (
        submissions.map((sub) => (
          <div key={sub.id} className="krefrm-submission-card">
            <div className="krefrm-submission-header">
              <h3>{sub.title}</h3>
              <Button
                variant="tertiary"
                isSmall
                isDestructive
                onClick={() => handleDelete(sub.id)}
              >
                {__("Delete", "kreebi-forms")}
              </Button>
            </div>
            <p>
              <strong>{__("Form:", "kreebi-forms")}</strong> {sub.form_name}
            </p>
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
      )}
    </div>
  );
}
