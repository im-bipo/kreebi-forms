import { __ } from "@wordpress/i18n";
import { useMemo } from "@wordpress/element";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function getFormTitle(formId, formsById) {
  return formsById.get(formId) || formId || __("Unknown Form", "kreebi-forms");
}

export default function BestPerformingForm({ loading, forms, submissions }) {
  const rows = useMemo(() => {
    const formsById = new Map(
      (Array.isArray(forms) ? forms : []).map((form) => [
        String(form.form_id || ""),
        form.title || __("Untitled Form", "kreebi-forms"),
      ]),
    );

    const counts = new Map();

    (Array.isArray(submissions) ? submissions : []).forEach((submission) => {
      const formId = String(submission.form_id || "");
      if (!formId) return;
      counts.set(formId, (counts.get(formId) || 0) + 1);
    });

    const ranked = Array.from(counts.entries())
      .map(([formId, count]) => ({
        formId,
        formTitle: getFormTitle(formId, formsById),
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const topRows = ranked.slice(0, 6);

    return topRows;
  }, [forms, submissions]);

  const graphWidth = Math.max(680, rows.length * 130);

  const chartData = useMemo(
    () => ({
      labels: rows.map((_, index) => `F${index + 1}`),
      datasets: [
        {
          label: __("Submissions", "kreebi-forms"),
          data: rows.map((item) => item.count),
          backgroundColor: "#2271b1",
          borderRadius: 8,
          maxBarThickness: 52,
        },
      ],
    }),
    [rows],
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${__("Submissions", "kreebi-forms")}: ${context.parsed.y}`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
    }),
    [],
  );

  return (
    <section className="krefrm-dashboard-bestperform">
      <div className="krefrm-dashboard-bestperform__head">
        <h3>{__("Best Performing Form", "kreebi-forms")}</h3>
        <p>
          {__(
            "Forms x submissions. Highest submission count appears first.",
            "kreebi-forms",
          )}
        </p>
      </div>

      {loading ? (
        <div className="krefrm-loading">
          <span>{__("Loading analytics...", "kreebi-forms")}</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="krefrm-dashboard-no-integrations">
          {__("No submission data yet.", "kreebi-forms")}
        </div>
      ) : (
        <>
          <div className="krefrm-dashboard-scroll-x">
            <div
              className="krefrm-dashboard-chart-wrap"
              style={{ width: `max(100%, ${graphWidth}px)` }}
            >
              <Bar
                data={chartData}
                options={chartOptions}
                aria-label={__(
                  "Best performing forms bar chart",
                  "kreebi-forms",
                )}
              />
            </div>
          </div>

          <div className="krefrm-dashboard-bestperform__legend">
            {rows.map((item, index) => (
              <div
                key={item.formId}
                className="krefrm-dashboard-bestperform__legend-item"
              >
                <strong>{`F${index + 1}`}</strong>
                <span>{item.formTitle}</span>
                <em>{item.count}</em>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
