export const DASHBOARD_LAYOUT_STORAGE_KEY =
  "krefrm_dashboard_layout_options_v1";

export const DASHBOARD_SECTION_SIZE = {
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large",
};

const VALID_SIZES = new Set(Object.values(DASHBOARD_SECTION_SIZE));

export const DASHBOARD_SECTIONS = [
  {
    id: "welcome",
    label: "Welcome",
    defaultVisible: true,
    defaultSize: DASHBOARD_SECTION_SIZE.LARGE,
    quickLinks: [
      { label: "Create New Forms", route: "form" },
      { label: "View Submissions", route: "submission" },
    ],
  },
  {
    id: "activeIntegrations",
    label: "Active Integrations",
    defaultVisible: true,
    defaultSize: DASHBOARD_SECTION_SIZE.MEDIUM,
    quickLinks: [{ label: "View More Integrations", route: "integrations" }],
  },
  {
    id: "bestPerformingForm",
    label: "Best Performing Form",
    defaultVisible: true,
    defaultSize: DASHBOARD_SECTION_SIZE.MEDIUM,
  },
  {
    id: "formAnalytics",
    label: "Form Analytics",
    defaultVisible: true,
    defaultSize: DASHBOARD_SECTION_SIZE.LARGE,
  },
];

export function buildDefaultDashboardConfig() {
  const visibility = {};
  const size = {};
  const order = DASHBOARD_SECTIONS.map((section) => section.id);

  DASHBOARD_SECTIONS.forEach((section) => {
    visibility[section.id] = section.defaultVisible;
    size[section.id] = section.defaultSize;
  });

  return { visibility, order, size };
}

export function normalizeDashboardConfig(input) {
  const defaults = buildDefaultDashboardConfig();

  if (!input || typeof input !== "object") {
    return defaults;
  }

  const parsedVisibility =
    input.visibility && typeof input.visibility === "object"
      ? input.visibility
      : {};

  const parsedOrder = Array.isArray(input.order) ? input.order : [];

  const parsedSize =
    input.size && typeof input.size === "object" ? input.size : {};

  const normalizedOrder = [];

  parsedOrder.forEach((id) => {
    if (
      typeof id === "string" &&
      defaults.order.includes(id) &&
      !normalizedOrder.includes(id)
    ) {
      normalizedOrder.push(id);
    }
  });

  defaults.order.forEach((id) => {
    if (!normalizedOrder.includes(id)) {
      normalizedOrder.push(id);
    }
  });

  const visibility = {};
  const size = {};

  DASHBOARD_SECTIONS.forEach((section) => {
    const rawSize = parsedSize[section.id];

    visibility[section.id] =
      typeof parsedVisibility[section.id] === "boolean"
        ? parsedVisibility[section.id]
        : section.defaultVisible;

    size[section.id] =
      typeof rawSize === "string" && VALID_SIZES.has(rawSize)
        ? rawSize
        : section.defaultSize;
  });

  return {
    visibility,
    order: normalizedOrder,
    size,
  };
}
