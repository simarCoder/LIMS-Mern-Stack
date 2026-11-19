/**
 * Comprehensive Directory of Clinical Laboratory Specimen Vacutainer Tubes & Containers
 * Maps diagnostic test panels to their appropriate collection tube with standard color codes.
 */

export const TUBES_CATALOG = [
  {
    id: "serum_sst",
    name: "Serum",
    displayName: "Serum (SST / Gel Separator)",
    capColor: "#eab308", // Yellow / Gold
    capAccent: "#ca8a04",
    capLabel: "SST",
    liquidColor: "#eab308", // Matches tube head
    gelColor: "#fef9c3",
    hasGel: true,
    additive: "Clot Activator & Polymer Gel",
    department: "Biochemistry & Serology",
    defaultSite: "Left Arm (Median Cubital)",
    defaultTemp: "Room Temperature (20-25°C)",
    matchKeywords: [
      "crp", "c-reactive", "lft", "liver", "kft", "rft", "kidney", "renal",
      "lipid", "cholesterol", "tft", "thyroid", "t3", "t4", "tsh", "serology",
      "biochemistry", "calcium", "urea", "creatinine", "uric", "bilirubin",
      "sgot", "sgpt", "alp", "protein", "albumin", "electrolyte", "vitamin",
      "iron", "ferritin", "amylase", "lipase",
    ],
  },
  {
    id: "edta",
    name: "EDTA Whole Blood",
    displayName: "EDTA Whole Blood",
    capColor: "#a855f7", // Purple / Lavender
    capAccent: "#7e22ce",
    capLabel: "K2 EDTA",
    liquidColor: "#a855f7", // Matches tube head (Purple/Lavender)
    gelColor: null,
    hasGel: false,
    additive: "K2 / K3 EDTA Anticoagulant",
    department: "Haematology",
    defaultSite: "Left Arm (Median Cubital)",
    defaultTemp: "Room Temperature (20-25°C)",
    matchKeywords: [
      "cbc", "complete blood", "haematology", "hematology", "hb", "haemoglobin",
      "hemoglobin", "wbc", "rbc", "platelet", "pcv", "mcv", "mch", "mchc",
      "hba1c", "blood group", "abo", "rh", "smear", "ps", "malaria", "mp",
      "reticulocyte",
    ],
  },
  {
    id: "fluoride",
    name: "FFP",
    displayName: "Fluoride / FFP (Glucose Plasma)",
    capColor: "#64748b", // Grey
    capAccent: "#475569",
    capLabel: "Na-F",
    liquidColor: "#64748b", // Matches tube head (Grey)
    gelColor: null,
    hasGel: false,
    additive: "Sodium Fluoride & Potassium Oxalate",
    department: "Clinical Biochemistry",
    defaultSite: "Left Arm (Median Cubital)",
    defaultTemp: "Refrigerated (2-8°C)",
    matchKeywords: [
      "fbs", "glucose", "sugar", "fasting blood sugar", "ppbs", "rbs",
      "random blood sugar", "gtt", "ogtt", "lactate", "ffp",
    ],
  },
  {
    id: "urine",
    name: "Urine",
    displayName: "Urine (Sterile Specimen Cup)",
    capColor: "#0284c7", // Blue screw cap
    capAccent: "#0369a1",
    capLabel: "STERILE",
    isCup: true,
    liquidColor: "#0284c7", // Matches tube head (Blue)
    hasGel: false,
    additive: "None (Clean Catch Sterile)",
    department: "Clinical Pathology",
    defaultSite: "Clean Catch Midstream",
    defaultTemp: "Room Temperature (20-25°C)",
    matchKeywords: [
      "urine", "urine_re", "urinalysis", "pus cells", "urine protein",
      "urine glucose", "microscopic", "upt", "pregnancy", "culture",
    ],
  },
  {
    id: "citrate",
    name: "Sodium Citrate 3.2%",
    displayName: "Sodium Citrate 3.2% (Coagulation)",
    capColor: "#38bdf8", // Light Blue
    capAccent: "#0284c7",
    capLabel: "Citrate",
    liquidColor: "#38bdf8", // Matches tube head (Light Blue)
    hasGel: false,
    additive: "3.2% Buffered Sodium Citrate (1:9)",
    department: "Coagulation",
    defaultSite: "Right Arm (Median Cubital)",
    defaultTemp: "Room Temperature (20-25°C)",
    matchKeywords: [
      "pt", "inr", "prothrombin", "aptt", "coagulation", "d-dimer",
      "fibrinogen", "thrombin", "bleeding", "clotting",
    ],
  },
  {
    id: "plain_serum",
    name: "Plain (Red)",
    displayName: "Plain / Clot Activator (No Gel)",
    capColor: "#ef4444", // Red
    capAccent: "#b91c1c",
    capLabel: "Plain",
    liquidColor: "#ef4444", // Matches tube head (Red)
    hasGel: false,
    additive: "Silica Clot Activator (No Gel)",
    department: "Blood Bank & Immunology",
    defaultSite: "Left Arm (Median Cubital)",
    defaultTemp: "Room Temperature (20-25°C)",
    matchKeywords: [
      "crossmatch", "blood bank", "hiv", "hbsag", "hcv", "vdrl",
      "widal", "dengue", "typhi", "antibodies", "ra factor", "aso",
    ],
  },
  {
    id: "heparin",
    name: "Heparin",
    displayName: "Sodium / Lithium Heparin",
    capColor: "#22c55e", // Green
    capAccent: "#15803d",
    capLabel: "Heparin",
    liquidColor: "#22c55e", // Matches tube head (Green)
    hasGel: false,
    additive: "Lithium Heparin Anticoagulant",
    department: "Critical Care & Cytogenetics",
    defaultSite: "Radial Artery / Vein",
    defaultTemp: "On Ice / STAT",
    matchKeywords: [
      "abg", "blood gas", "ammonia", "cytogenetics", "hla", "stat",
    ],
  },
  {
    id: "esr_black",
    name: "Sodium Citrate (ESR)",
    displayName: "Sodium Citrate (Westergren ESR)",
    capColor: "#1e293b", // Black
    capAccent: "#0f172a",
    capLabel: "ESR",
    liquidColor: "#1e293b", // Matches tube head (Black/Dark Slate)
    hasGel: false,
    additive: "3.8% Sodium Citrate (1:4 ratio)",
    department: "Haematology",
    defaultSite: "Right Arm (Median Cubital)",
    defaultTemp: "Room Temperature (20-25°C)",
    matchKeywords: ["esr", "westergren", "erythrocyte sedimentation"],
  },
  {
    id: "trace_elements",
    name: "Trace Elements",
    displayName: "Trace Elements (Royal Blue)",
    capColor: "#1d4ed8", // Royal Blue
    capAccent: "#1e40af",
    capLabel: "Trace",
    liquidColor: "#1d4ed8", // Matches tube head (Royal Blue)
    hasGel: false,
    additive: "K2 EDTA (Trace-Element Free)",
    department: "Toxicology",
    defaultSite: "Left Arm",
    defaultTemp: "Refrigerated (2-8°C)",
    matchKeywords: ["lead", "copper", "zinc", "arsenic", "mercury", "toxicology"],
  },
  {
    id: "stool",
    name: "Stool Container",
    displayName: "Stool Specimen Container",
    capColor: "#92400e", // Brown cap
    capAccent: "#78350f",
    capLabel: "STOOL",
    isCup: true,
    liquidColor: "#92400e", // Matches tube head (Brown)
    hasGel: false,
    additive: "None (Clean Specimen Spoon Cup)",
    department: "Clinical Pathology",
    defaultSite: "Stool Collection",
    defaultTemp: "Room Temperature (20-25°C)",
    matchKeywords: ["stool", "fecal", "occult", "ova", "cyst"],
  },
];

/**
 * Automatically maps a list of prescribed laboratory tests to required specimen tubes.
 */
export function mapTestsToSpecimens(testItems = []) {
  const tubesMap = new Map();

  for (const item of testItems) {
    const code = (item.ht_code || item.code || "").toLowerCase();
    const name = (item.ht_name || item.name || "").toLowerCase();
    const heading = (item.ht_heading || item.department || "").toLowerCase();
    const combined = `${code} ${name} ${heading}`;

    let matchedDef = null;

    // Check keyword matches against catalog
    for (const tubeDef of TUBES_CATALOG) {
      if (tubeDef.matchKeywords.some((kw) => combined.includes(kw))) {
        matchedDef = tubeDef;
        break;
      }
    }

    // Default fallback to Serum SST for routine biochemistry / unclassified blood tests
    if (!matchedDef) {
      matchedDef = TUBES_CATALOG[0]; // Serum SST
    }

    if (!tubesMap.has(matchedDef.id)) {
      tubesMap.set(matchedDef.id, {
        specimenId: matchedDef.id,
        specimenName: matchedDef.name,
        tubeDef: matchedDef,
        quantity: 1,
        collected: false,
        status: "Pending",
        phlebotomist: "Staff Phlebotomist",
        collectionDate: new Date().toISOString().split("T")[0],
        collectionTime: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        site: matchedDef.defaultSite,
        temperature: matchedDef.defaultTemp,
        assignedTests: [],
      });
    }

    const tubeEntry = tubesMap.get(matchedDef.id);
    const testLabel = item.ht_name || item.name || item.ht_code || "Investigation";
    if (!tubeEntry.assignedTests.includes(testLabel)) {
      tubeEntry.assignedTests.push(testLabel);
    }
  }

  // If no tests were provided (demographic registration), provide standard Serum as default
  if (tubesMap.size === 0) {
    const def = TUBES_CATALOG[0];
    tubesMap.set(def.id, {
      specimenId: def.id,
      specimenName: def.name,
      tubeDef: def,
      quantity: 1,
      collected: false,
      status: "Pending",
      phlebotomist: "Staff Phlebotomist",
      collectionDate: new Date().toISOString().split("T")[0],
      collectionTime: new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      site: def.defaultSite,
      temperature: def.defaultTemp,
      assignedTests: ["Demographic Accession"],
    });
  }

  return Array.from(tubesMap.values());
}
