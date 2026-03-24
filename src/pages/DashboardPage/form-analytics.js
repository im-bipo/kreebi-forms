import { __ } from "@wordpress/i18n";
import { useEffect, useMemo, useState } from "@wordpress/element";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

const VIEW_OPTIONS = ["day", "week", "month"];

function parseSubmissionDate(submission) {
  const source = submission?.timestamp || submission?.date;
  if (!source || typeof source !== "string") return null;
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function toLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildSeries(view, formSubmissions) {
  const now = new Date();
  const parsedDates = formSubmissions
    .map((submission) => parseSubmissionDate(submission))
    .filter(Boolean);

  if (view === "day") {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({
      label: String(hour).padStart(2, "0"),
      value: 0,
    }));

    parsedDates.forEach((date) => {
      const sameDay = toLocalDateKey(date) === toLocalDateKey(now);
      if (!sameDay) return;
      buckets[date.getHours()].value += 1;
    });

    return buckets;
  }

  if (view === "week") {
    const dayKeys = [];
    const indexByKey = new Map();

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(now.getDate() - offset);
      const key = toLocalDateKey(date);
      dayKeys.push({
        key,
        label: date.toLocaleDateString(undefined, { weekday: "short" }),
      });
      indexByKey.set(key, dayKeys.length - 1);
    }

    const buckets = dayKeys.map((item) => ({ label: item.label, value: 0 }));

    parsedDates.forEach((date) => {
      const key = toLocalDateKey(date);
      const index = indexByKey.get(key);
      if (typeof index === "number") {
        buckets[index].value += 1;
      }
    });

    return buckets;
  }

  const dayKeys = [];
  const indexByKey = new Map();

  for (let offset = 29; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(now.getDate() - offset);
    const key = toLocalDateKey(date);
    dayKeys.push({
      key,
      label: date.toLocaleDateString(undefined, { day: "2-digit" }),
    });
    indexByKey.set(key, dayKeys.length - 1);
  }

  const buckets = dayKeys.map((item) => ({ label: item.label, value: 0 }));

  parsedDates.forEach((date) => {
    const key = toLocalDateKey(date);
    const index = indexByKey.get(key);
    if (typeof index === "number") {
      buckets[index].value += 1;
    }
  });

  return buckets;
}

export default function FormAnalytics({ loading, forms, submissions }) {
  const [selectedFormId, setSelectedFormId] = useState("");
  const [view, setView] = useState("month");

  const formsList = useMemo(
    () => (Array.isArray(forms) ? forms : []).filter((form) => form.form_id),
    [forms],
  );

  useEffect(() => {
    if (!formsList.length) {
      setSelectedFormId("");
      return;
    }

    setSelectedFormId((prev) => {
      if (
        prev &&
        formsList.some((form) => String(form.form_id) === String(prev))
      ) {
        return prev;
      }
      return String(formsList[0].form_id);
    });
  }, [formsList]);

  const formSubmissions = useMemo(() => {
    const all = Array.isArray(submissions) ? submissions : [];
    if (!selectedFormId) return [];
    return all.filter(
      (item) => String(item.form_id) === String(selectedFormId),
    );
  }, [selectedFormId, submissions]);

  const points = useMemo(
    () => buildSeries(view, formSubmissions),
    [formSubmissions, view],
  );

  const graphWidth = Math.max(
    view === "week" ? 680 : 760,
    points.length * (view === "month" ? 30 : 34),
  );

  const chartData = useMemo(
    () => ({
      labels: points.map((point) => point.label),
      datasets: [
        {
          label: __("Submissions", "kreebi-forms"),
          data: points.map((point) => point.value),
          borderColor: "#2271b1",
          backgroundColor: "rgba(34, 113, 177, 0.16)",
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 4,
          tension: 0.35,
          fill: true,
        },
      ],
    }),
    [points],
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
          ticks: {
            autoSkip: false,
            maxRotation: 0,
            callback: (value, index) => {
              if (view === "week") return chartData.labels[index];

              const total = chartData.labels.length;
              const showEvery = Math.ceil(total / 8);

              return index % showEvery === 0 || index === total - 1
                ? chartData.labels[index]
                : "";
            },
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
    [chartData.labels, view],
  );

  return (
    <section className="krefrm-dashboard-form-analytics">
      <div className="krefrm-dashboard-form-analytics__head">
        <div className="krefrm-dashboard-form-analytics__controls">
          <label>
            <span>{__("Form", "kreebi-forms")}</span>
            <select
              value={selectedFormId}
              onChange={(event) => setSelectedFormId(event.target.value)}
            >
              {formsList.map((form) => (
                <option key={form.form_id} value={String(form.form_id)}>
                  {form.title || __("Untitled Form", "kreebi-forms")}
                </option>
              ))}
            </select>
          </label>

          <div className="krefrm-dashboard-form-analytics__view-tabs">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`krefrm-dashboard-form-analytics__view-tab${
                  view === option ? " is-active" : ""
                }`}
                onClick={() => setView(option)}
              >
                {__(option, "kreebi-forms")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="krefrm-loading">
          <span>{__("Loading analytics...", "kreebi-forms")}</span>
        </div>
      ) : !selectedFormId ? (
        <div className="krefrm-dashboard-no-integrations">
          {__("Create a form to view analytics.", "kreebi-forms")}
        </div>
      ) : (
        <>
          <div className="krefrm-dashboard-scroll-x">
            <div
              className="krefrm-dashboard-chart-wrap"
              style={{ width: `max(100%, ${graphWidth}px)` }}
            >
              <Line
                data={chartData}
                options={chartOptions}
                aria-label={__("Form submissions over time", "kreebi-forms")}
              />
            </div>
          </div>

          <p className="krefrm-dashboard-form-analytics__summary">
            {__("Total submissions for selected range:", "kreebi-forms")}{" "}
            <strong>
              {points.reduce((sum, point) => sum + point.value, 0)}
            </strong>
          </p>
        </>
      )}
    </section>
  );
}
