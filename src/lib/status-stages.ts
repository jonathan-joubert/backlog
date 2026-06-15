// Status stage definitions for SAPS firearm applications.
// Used to show a brief, plain-English explanation when hovering a status badge.

export type ApplicationCategory = "Competency" | "Licence" | "Renewal" | "Unknown";

export interface StageInfo {
  category: ApplicationCategory;
  stage: string;
  description: string;
  order: number;
}

/**
 * Pipeline definitions taken from SAPS Firearm Control Act processing guidelines.
 * Order matches the official workflow so the UI can also draw a progress bar.
 */
export const STAGE_PIPELINES: Record<ApplicationCategory, string[]> = {
  Competency: [
    "Start",
    "Payment",
    "DFO",
    "Provincial DFO",
    "CFR",
    "Competency Section",
    "CRC",
    "Consideration",
    "Finalised",
  ],
  Licence: [
    "Start",
    "Payment",
    "DFO",
    "Provincial DFO",
    "CFR",
    "Licensing Section",
    "Consideration",
    "Finalised",
  ],
  Renewal: ["Start", "Payment", "In Process", "Finalised"],
  Unknown: [],
};

// Per-stage human descriptions. Keys are lowercase for matching.
const STAGE_DESCRIPTIONS: Record<string, string> = {
  start:
    "Application has been captured. The clock has started but it is still sitting at the receiving desk waiting to enter the workflow.",
  payment:
    "Payment of the prescribed fee is being processed or confirmed before the file moves further.",
  dfo: "With the Designated Firearms Officer at your local SAPS station — they verify your documents, conduct interviews and inspections.",
  "provincial dfo":
    "Reviewed at the Provincial DFO level after the local station signs off. Quality-checked before being forwarded to head office.",
  cfr: "At the Central Firearms Registry in Pretoria — the central authority that processes all firearm applications nationally.",
  "competency section":
    "Allocated to the Competency Section inside the CFR for assessment of your competency certificate.",
  "licensing section":
    "Allocated to the Licensing Section inside the CFR for assessment of the firearm licence itself.",
  crc: "Criminal Record Centre check — your background is being verified against the national criminal database.",
  consideration:
    "Officer has the file open and is making the final decision (approve, refer back, or refuse).",
  "in process":
    "Renewal file is moving through the workflow. SAPS does not expose detailed sub-stages for renewals.",
  finalised:
    "A decision has been made. Check the status description for the outcome (approved / refused / collected).",
};

const CATEGORY_PATTERNS: Array<{ pattern: RegExp; category: ApplicationCategory }> = [
  { pattern: /renew/i, category: "Renewal" },
  { pattern: /compet/i, category: "Competency" },
  { pattern: /licen[cs]/i, category: "Licence" },
];

/**
 * Best-effort categorisation from an `applicationType` string returned by SAPS.
 */
export function categorise(applicationType?: string): ApplicationCategory {
  if (!applicationType) return "Unknown";
  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(applicationType)) return category;
  }
  return "Unknown";
}

function normalise(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Resolve stage info for a given status string + (optional) application type.
 * Falls back to a generic description if nothing matches.
 */
export function getStageInfo(
  status: string | undefined,
  applicationType?: string,
): StageInfo {
  const category = categorise(applicationType);
  const pipeline = STAGE_PIPELINES[category];
  const key = normalise(status || "");

  // Try exact match against pipeline first, then any pipeline.
  const fromPipeline = pipeline.find((s) => normalise(s) === key);
  const stageName =
    fromPipeline ||
    Object.values(STAGE_PIPELINES)
      .flat()
      .find((s) => normalise(s) === key) ||
    (status ?? "Unknown");

  const description =
    STAGE_DESCRIPTIONS[normalise(stageName)] ||
    "Status detail not recognised. See the official SAPS description for more information.";

  const order = pipeline.indexOf(stageName);
  return { category, stage: stageName, description, order };
}
