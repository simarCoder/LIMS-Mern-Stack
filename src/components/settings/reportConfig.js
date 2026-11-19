/**
 * ============================================================================
 * DIAGNOSTIC REPORT PRINT & CANVAS LAYOUT CONFIGURATION
 * ============================================================================
 * Controls the physical A4 canvas dimensions, margins, section ordering,
 * typography scale, and element toggles for single-page clinical printouts.
 */

export const defaultReportConfig = {
  // Page Margins (in mm)
  page: {
    size: "A4",
    marginTopMm: 8,
    marginBottomMm: 8,
    marginLeftMm: 10,
    marginRightMm: 10,
    scalePercent: 100,
  },

  // Section Spacing & Sizing (in pixels / points)
  layout: {
    headerPaddingBottomPx: 10,
    demographicsPaddingPx: 8,
    tableRowPaddingPx: 4,
    remarksMarginTopPx: 8,
    signaturesMarginTopPx: 14,
    baseFontSizePt: 9.5,
    headerFontSizePt: 17,
  },

  // Visibility Toggles
  toggles: {
    showMethod: false, // Hidden by default as requested: "remove methods from report"
    showFlag: true,
    showUnit: true,
    showRefInterval: true,
    showDoctorRemarks: true,
    showDualSignatures: true,
    showDepartmentBadge: true,
    showLetterheadBorder: true,
    compactTableSpacing: true, // Guarantees 1-page fit
  },

  // Draggable / Reorderable Section Hierarchy
  sectionOrder: [
    "letterhead",
    "demographics",
    "investigations",
    "remarks",
    "signatures",
  ],

  // Diagnostic Centre Letterhead & Signatures
  facility: {
    name: "Labora+ Pathology & Diagnostics",
    tagline: "CLINICAL PATHOLOGY & DIAGNOSTIC LABORATORY",
    address: "Medical Hub, 14 Healthcare Avenue",
    phone: "+91 98765 43210 / 080-2345678",
    email: "reports@laboraplus.com",
    reportTitle: "DIAGNOSTIC EXAMINATION REPORT",
    technologistTitle: "Medical Lab Technologist",
    pathologistTitle: "Dr. S. K. Mukherjee (MD Path)",
    pathologistSubtitle: "Consultant Pathologist & Lab Director",
  },
};

const STORAGE_KEY = "lims_report_layout_config";

/**
 * Retrieve saved report layout configuration or fallback to defaults.
 */
export function getReportConfig() {
  if (typeof window === "undefined") return defaultReportConfig;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultReportConfig;
    const parsed = JSON.parse(raw);
    return {
      ...defaultReportConfig,
      ...parsed,
      page: { ...defaultReportConfig.page, ...(parsed.page || {}) },
      layout: { ...defaultReportConfig.layout, ...(parsed.layout || {}) },
      toggles: { ...defaultReportConfig.toggles, ...(parsed.toggles || {}) },
      facility: { ...defaultReportConfig.facility, ...(parsed.facility || {}) },
      sectionOrder: Array.isArray(parsed.sectionOrder)
        ? parsed.sectionOrder
        : defaultReportConfig.sectionOrder,
    };
  } catch (e) {
    console.warn("Failed to parse report layout config from storage:", e);
    return defaultReportConfig;
  }
}

/**
 * Persist report layout configuration to localStorage.
 */
export function saveReportConfig(config) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save report layout config:", e);
  }
}

/**
 * Reset layout configuration back to system factory defaults.
 */
export function resetReportConfig() {
  if (typeof window === "undefined") return defaultReportConfig;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to reset report layout config:", e);
  }
  return defaultReportConfig;
}
