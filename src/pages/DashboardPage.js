import { useEffect, useState } from "@wordpress/element";
import apiFetch from "@wordpress/api-fetch";
import { __ } from "@wordpress/i18n";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { INTEGRATIONS, DEFAULT_ENABLED } from "../integrations/definitions";
import Welcome from "./DashboardPage/welcome";
import ActiveIntegration from "./DashboardPage/active-integration";
import BestPerformingForm from "./DashboardPage/best-performing-form";
import FormAnalytics from "./DashboardPage/form-analytics";
import ScreenOptionsModal from "./DashboardPage/ScreenOptionsModal";
import {
  DASHBOARD_LAYOUT_STORAGE_KEY,
  DASHBOARD_SECTION_SIZE,
  DASHBOARD_SECTIONS,
  buildDefaultDashboardConfig,
  normalizeDashboardConfig,
} from "./DashboardPage/dashboard-sections-meta";

const SIZE_TO_SPAN = {
  [DASHBOARD_SECTION_SIZE.SMALL]: 1,
  [DASHBOARD_SECTION_SIZE.MEDIUM]: 2,
  [DASHBOARD_SECTION_SIZE.LARGE]: 3,
};

function SortableDashboardSection({
  sectionId,
  title,
  size,
  quickLinks,
  navigate,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onSelectSize,
  children,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sectionId });

  const span = SIZE_TO_SPAN[size] || 1;

  const normalizedTransform = transform
    ? {
        ...transform,
        scaleX: 1,
        scaleY: 1,
      }
    : null;

  const style = {
    transform: CSS.Transform.toString(normalizedTransform),
    transition: transition || "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
    zIndex: isDragging ? 20 : "auto",
  };

  const preventDragFromMenu = (event) => {
    event.stopPropagation();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`krefrm-dashboard-section-shell krefrm-dashboard-section-shell--span-${span}${
        isDragging ? " is-dragging" : ""
      }`}
    >
      <div
        ref={setActivatorNodeRef}
        className="krefrm-dashboard-section-header"
        {...attributes}
        {...listeners}
      >
        <span className="krefrm-dashboard-section-title">{title}</span>

        <div className="krefrm-dashboard-section-header-right">
          {Array.isArray(quickLinks) && quickLinks.length > 0 && (
            <div
              className="krefrm-dashboard-section-links"
              onPointerDown={preventDragFromMenu}
              onMouseDown={preventDragFromMenu}
              onTouchStart={preventDragFromMenu}
              onClick={preventDragFromMenu}
            >
              {quickLinks.map((link) => (
                <button
                  key={`${sectionId}-${link.route}`}
                  type="button"
                  className="krefrm-dashboard-section-link"
                  onClick={() => navigate(link.route)}
                >
                  {__(link.label, "kreebi-forms")}
                </button>
              ))}
            </div>
          )}

          <div
            className="krefrm-dashboard-section-header-actions"
            onPointerDown={preventDragFromMenu}
            onMouseDown={preventDragFromMenu}
            onTouchStart={preventDragFromMenu}
            onClick={preventDragFromMenu}
          >
            <button
              type="button"
              className="krefrm-dashboard-section-size-toggle"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-label={__("Section size options", "kreebi-forms")}
              onClick={() => onToggleMenu(sectionId)}
            >
              ⋮
            </button>

            {isMenuOpen && (
              <div className="krefrm-dashboard-section-size-menu" role="menu">
                <button
                  type="button"
                  className={`krefrm-dashboard-section-size-option${
                    size === DASHBOARD_SECTION_SIZE.SMALL ? " is-active" : ""
                  }`}
                  onClick={() => {
                    onSelectSize(sectionId, DASHBOARD_SECTION_SIZE.SMALL);
                    onCloseMenu();
                  }}
                >
                  {__("Small", "kreebi-forms")}
                </button>

                <button
                  type="button"
                  className={`krefrm-dashboard-section-size-option${
                    size === DASHBOARD_SECTION_SIZE.MEDIUM ? " is-active" : ""
                  }`}
                  onClick={() => {
                    onSelectSize(sectionId, DASHBOARD_SECTION_SIZE.MEDIUM);
                    onCloseMenu();
                  }}
                >
                  {__("Medium", "kreebi-forms")}
                </button>

                <button
                  type="button"
                  className={`krefrm-dashboard-section-size-option${
                    size === DASHBOARD_SECTION_SIZE.LARGE ? " is-active" : ""
                  }`}
                  onClick={() => {
                    onSelectSize(sectionId, DASHBOARD_SECTION_SIZE.LARGE);
                    onCloseMenu();
                  }}
                >
                  {__("Large", "kreebi-forms")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="krefrm-dashboard-section-content">{children}</div>
    </div>
  );
}

export default function DashboardPage({ navigate = () => {} }) {
  const [loading, setLoading] = useState(true);
  const [formsCount, setFormsCount] = useState(0);
  const [submissionsCount, setSubmissionsCount] = useState(0);
  const [activeIntegrations, setActiveIntegrations] = useState(0);
  const [activeIntegrationList, setActiveIntegrationList] = useState([]);
  const [forms, setForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [isScreenOptionsOpen, setIsScreenOptionsOpen] = useState(false);
  const [openSizeMenuSectionId, setOpenSizeMenuSectionId] = useState(null);
  const [dashboardConfig, setDashboardConfig] = useState(
    buildDefaultDashboardConfig(),
  );
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = window.localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY);

      if (!saved) return;

      const parsed = JSON.parse(saved);
      setDashboardConfig(normalizeDashboardConfig(parsed));
    } catch {
      // Ignore malformed localStorage value.
    }
  }, []);

  useEffect(() => {
    if (!isScreenOptionsOpen || typeof window === "undefined") return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsScreenOptionsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isScreenOptionsOpen]);

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      apiFetch({ path: "/kreebi-forms/v1/forms" }),
      apiFetch({ path: "/kreebi-forms/v1/submissions" }),
      apiFetch({ path: "/kreebi-forms/v1/settings" }),
    ])
      .then(([formsResult, submissionsResult, settingsResult]) => {
        if (!isMounted) return;

        if (formsResult.status === "fulfilled") {
          const forms = Array.isArray(formsResult.value)
            ? formsResult.value
            : [];
          setForms(forms);
          setFormsCount(forms.length);
        }

        if (submissionsResult.status === "fulfilled") {
          const submissions = Array.isArray(submissionsResult.value)
            ? submissionsResult.value
            : [];
          setSubmissions(submissions);
          setSubmissionsCount(submissions.length);
        }

        if (settingsResult.status === "fulfilled") {
          const settings = settingsResult.value || {};
          const integrations = settings.integrations || {};

          const defaults = Object.fromEntries(
            DEFAULT_ENABLED.map((id) => [id, true]),
          );

          const allSettings = { ...defaults, ...integrations };
          const activeIds = Object.entries(allSettings)
            .filter(([, enabled]) => enabled)
            .map(([id]) => id);

          const activeCards = INTEGRATIONS.filter((integration) =>
            activeIds.includes(integration.id),
          );

          setActiveIntegrations(activeCards.length);
          setActiveIntegrationList(activeCards);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredIntegrations = activeIntegrationList.slice(0, 4);

  const persistConfig = (next) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          DASHBOARD_LAYOUT_STORAGE_KEY,
          JSON.stringify(next),
        );
      } catch {
        // Ignore localStorage write failure.
      }
    }
  };

  const handleToggleSection = (sectionKey) => {
    if (sectionKey === "welcome") {
      // 'Welcome' section is mandatory and should always stay visible.
      return;
    }

    setDashboardConfig((prev) => {
      const next = {
        ...prev,
        visibility: {
          ...prev.visibility,
          [sectionKey]: !prev.visibility[sectionKey],
        },
      };

      persistConfig(next);

      return next;
    });
  };

  const handleSizeChange = (sectionId, nextSize) => {
    setDashboardConfig((prev) => {
      const next = normalizeDashboardConfig({
        ...prev,
        size: {
          ...prev.size,
          [sectionId]: nextSize,
        },
      });

      persistConfig(next);
      return next;
    });
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) {
      return;
    }

    setDashboardConfig((prev) => {
      const visibleIds = prev.order.filter((id) => prev.visibility[id]);
      const oldIndex = visibleIds.indexOf(active.id);
      const newIndex = visibleIds.indexOf(over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }

      const reorderedVisible = arrayMove(visibleIds, oldIndex, newIndex);
      let pointer = 0;

      const reorderedAll = prev.order.map((id) => {
        if (!prev.visibility[id]) {
          return id;
        }

        const nextId = reorderedVisible[pointer] || id;
        pointer += 1;
        return nextId;
      });

      const next = normalizeDashboardConfig({
        ...prev,
        order: reorderedAll,
      });

      persistConfig(next);
      return next;
    });
  };

  const sectionMetaById = new Map(DASHBOARD_SECTIONS.map((s) => [s.id, s]));
  const visibleSectionIds = dashboardConfig.order.filter(
    (id) => dashboardConfig.visibility[id],
  );

  return (
    <div className="krefrm-dashboard-page">
      {visibleSectionIds.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={() => setOpenSizeMenuSectionId(null)}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleSectionIds}
            strategy={rectSortingStrategy}
          >
            {visibleSectionIds.map((sectionId) => {
              const sectionMeta = sectionMetaById.get(sectionId);

              if (!sectionMeta) {
                return null;
              }

              const title = __(sectionMeta.label, "kreebi-forms");
              const sectionSize =
                dashboardConfig.size[sectionId] || sectionMeta.defaultSize;

              let sectionContent = null;

              if (sectionId === "welcome") {
                sectionContent = (
                  <Welcome
                    loading={loading}
                    formsCount={formsCount}
                    submissionsCount={submissionsCount}
                    activeIntegrations={activeIntegrations}
                    navigate={navigate}
                  />
                );
              }

              if (sectionId === "activeIntegrations") {
                sectionContent = (
                  <ActiveIntegration
                    loading={loading}
                    featuredIntegrations={featuredIntegrations}
                    navigate={navigate}
                  />
                );
              }

              if (sectionId === "bestPerformingForm") {
                sectionContent = (
                  <BestPerformingForm
                    loading={loading}
                    forms={forms}
                    submissions={submissions}
                  />
                );
              }

              if (sectionId === "formAnalytics") {
                sectionContent = (
                  <FormAnalytics
                    loading={loading}
                    forms={forms}
                    submissions={submissions}
                  />
                );
              }

              if (!sectionContent) {
                return null;
              }

              return (
                <SortableDashboardSection
                  key={sectionId}
                  sectionId={sectionId}
                  title={title}
                  size={sectionSize}
                  quickLinks={sectionMeta.quickLinks || []}
                  navigate={navigate}
                  isMenuOpen={openSizeMenuSectionId === sectionId}
                  onToggleMenu={(id) =>
                    setOpenSizeMenuSectionId((prev) =>
                      prev === id ? null : id,
                    )
                  }
                  onCloseMenu={() => setOpenSizeMenuSectionId(null)}
                  onSelectSize={handleSizeChange}
                >
                  {sectionContent}
                </SortableDashboardSection>
              );
            })}
          </SortableContext>
        </DndContext>
      )}

      {visibleSectionIds.length === 0 && (
        <div className="krefrm-dashboard-empty-state">
          {__(
            "All dashboard sections are hidden. Use the bottom-right settings button to enable them.",
            "kreebi-forms",
          )}
        </div>
      )}

      <ScreenOptionsModal
        isOpen={isScreenOptionsOpen}
        onOpen={() => setIsScreenOptionsOpen(true)}
        onClose={() => setIsScreenOptionsOpen(false)}
        visibility={dashboardConfig.visibility}
        onToggleSection={handleToggleSection}
      />
    </div>
  );
}
