/**
 * ============================================================================
 * LABORATORY RECEIPT CONFIGURATION DICTIONARY
 * ============================================================================
 * Edit this dictionary to customize laboratory details, receipt branding,
 * column names, labels, disclaimers, dimensions, and styling WITHOUT modifying
 * the underlying React component code.
 */

export const defaultReceiptConfig = {
  // --------------------------------------------------------------------------
  // 1. Diagnostic Centre / Laboratory Details
  // --------------------------------------------------------------------------
  facility: {
    name: "Labora+ Pathology & Diagnostics",
    address: "Medical Hub, 14 Healthcare Avenue",
    phone: "+91 98765 43210 / 080-2345678",
    email: "reports@laboraplus.com",
    tagline: "CLINICAL PATHOLOGY & DIAGNOSTIC LABORATORY",
  },

  // --------------------------------------------------------------------------
  // 2. Receipt Header & Section Titles
  // --------------------------------------------------------------------------
  titles: {
    receiptHeading: "RECEIPT / CASH MEMO",
    patientSectionTitle: "Patient Demographics",
    testsSectionTitle: "Prescribed Diagnostic Investigations",
    billingSectionTitle: "Payment & Financial Summary",
    termsSectionTitle: "Terms & Patient Instructions",
  },

  // --------------------------------------------------------------------------
  // 3. Field Display Labels (Change terminology here)
  // --------------------------------------------------------------------------
  labels: {
    receiptNo: "Receipt No",
    bookingDate: "Reg. Date/time",
    patientName: "Patient Name",
    patientId: "Patient ID",
    ageGender: "Age/Sex",
    sampleDate: "Sample date/time",
    referringDoctor: "Referred by",
    defaultDoctor: "Self / Dr. On Call",
    relation: "Guardian/Relations",
    phone: "Mobile",
    email: "Email",
    address: "Address",

    // Sample Status Labels
    sampleStatus: "Sample Status",
    sampleCollectedBadge: "✓ Sample Verified",
    samplePendingBadge: "⏳ Awaiting Collection",

    // Test Table Columns
    colIndex: "S.No",
    colTestName: "Test Description",
    colCode: "Code",
    colDepartment: "Department",
    colAmount: "Amount",

    // Financial Breakdown
    subtotal: "Gross Subtotal",
    discount: "Discount",
    totalPayable: "Total Net Amount",
    paymentMode: "Payment Mode",
    defaultPaymentMode: "CASH",
    paymentStatus: "Payment Status",
    statusPaid: "PAID IN FULL",
  },

  // --------------------------------------------------------------------------
  // 4. Instructions, Terms & Signatures
  // --------------------------------------------------------------------------
  footer: {
    notes: [
      "1. No CASH refund after billing.",
      "2. Preserve this receipt for laboratory report collection or verification.",
    ],
    signatureLabel: "Auth Signatory / Cashier",
  },

  // --------------------------------------------------------------------------
  // 5. Layout & Element Visibility Toggles
  // --------------------------------------------------------------------------
  layout: {
    currencySymbol: "₹",
    showFacilityLogo: false, // Set to true to show icon logo
    showAddress: true,
    showPhone: true,
    showEmail: false, // Kept off by default to save vertical height
    showSubtestCount: false, // Turn off "8 parameters" text to keep rows small and clean
    showDepartmentColumn: true, // Turn off department column to save horizontal width (like real receipts)
    showItemCode: false, // Keep code (e.g. CBC, LIPID)
    showTermsAndNotes: true,
    showSignatureBlock: true,
  },

  // --------------------------------------------------------------------------
  // 6. STYLING & SIZING CONFIGURATION (Adjust size, fonts & layout here)
  // --------------------------------------------------------------------------
  styling: {
    // Paper target: 'half-a4' (top half of A4 sheet) or 'a5'
    paperSize: "half-a4",

    // Exact printable width (180mm matches half-A4 and A5 printable width with 10mm margins)
    receiptWidth: "182mm",

    // Typography sizing (Compact and professional)
    baseFontSize: "11px",
    titleFontSize: "16px",
    subtitleFontSize: "10.5px",
    demographicsFontSize: "11px",
    tableFontSize: "11px",
    totalAmountFontSize: "13px",
    footerFontSize: "9.5px",

    // Spacing (Tuned to ensure receipt fits in under 135mm height)
    headerPaddingBottom: "4px",
    demographicsPadding: "4px 8px",
    demographicsRowGap: "2px",
    tableHeaderPadding: "3px 6px",
    tableRowPadding: "3px 6px",
    sectionMarginTop: "5px",
    signatureLineHeight: "22px",
  },
};
