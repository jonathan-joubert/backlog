export interface FcaSectionInfo {
  code: string;
  title: string;
  description: string;
  validityYears: number;
}

export const FCA_SECTIONS: FcaSectionInfo[] = [
  {
    code: "13",
    title: "Section 13 — Self-defence",
    description:
      "Licence to possess a firearm for self-defence. Limited to one handgun or shotgun (not fully automatic).",
    validityYears: 5,
  },
  {
    code: "14",
    title: "Section 14 — Restricted firearm for self-defence",
    description:
      "Licence to possess a restricted firearm (e.g. semi-automatic rifle) for self-defence. Issued only in exceptional circumstances.",
    validityYears: 2,
  },
  {
    code: "15",
    title: "Section 15 — Occasional hunting & sports-shooting",
    description:
      "Licence to possess a firearm for occasional hunting and sports-shooting. Up to four firearms allowed under this section.",
    validityYears: 10,
  },
  {
    code: "16",
    title: "Section 16 — Dedicated hunting & sports-shooting",
    description:
      "Licence to possess a firearm for dedicated hunting and sports-shooting. Requires accredited association membership.",
    validityYears: 10,
  },
  {
    code: "16A",
    title: "Section 16A — Professional hunting",
    description:
      "Licence to possess a firearm for professional hunting purposes.",
    validityYears: 10,
  },
  {
    code: "17",
    title: "Section 17 — Private collection",
    description:
      "Licence to possess a firearm as part of a private collection. Requires accredited collectors' association membership.",
    validityYears: 10,
  },
  {
    code: "19",
    title: "Section 19 — Business purposes",
    description:
      "Licence to possess a firearm for business purposes (e.g. security, hunting outfitter, game rancher).",
    validityYears: 5,
  },
];

export function getFcaSection(code: string): FcaSectionInfo | undefined {
  return FCA_SECTIONS.find((s) => s.code === code);
}
