// lib/noc-lookup.ts
// Common displaced white-collar titles → NOC 2021 code

export const NOC_LOOKUP: Record<string, { code: string; title: string }> = {
  "accountant": { code: "1311", title: "Accounting technicians and bookkeepers" },
  "bookkeeper": { code: "1311", title: "Accounting technicians and bookkeepers" },
  "financial analyst": { code: "1112", title: "Financial and investment analysts" },
  "hr manager": { code: "0112", title: "Human resources managers" },
  "human resources": { code: "1121", title: "Human resources professionals" },
  "software developer": { code: "2173", title: "Software engineers and designers" },
  "software engineer": { code: "2173", title: "Software engineers and designers" },
  "data analyst": { code: "2172", title: "Database analysts and data administrators" },
  "marketing manager": { code: "0124", title: "Advertising, marketing and PR managers" },
  "insurance adjuster": { code: "1312", title: "Insurance adjusters and claims examiners" },
  "paralegal": { code: "4211", title: "Paralegal and related occupations" },
  "project manager": { code: "0213", title: "Computer and information systems managers" },
  "office manager": { code: "0114", title: "Other administrative services managers" },
  "loan officer": { code: "1114", title: "Other financial officers" },
  "clerk": { code: "1411", title: "General office support workers" },
  "administrative assistant": { code: "1241", title: "Administrative assistants" },
  "customer service": { code: "6552", title: "Other customer and information services reps" },
  "graphic designer": { code: "5241", title: "Graphic designers and illustrators" },
  "journalist": { code: "5122", title: "Editors" },
  "teacher": { code: "4032", title: "Elementary school and kindergarten teachers" },
  "social worker": { code: "4152", title: "Social workers" },
};

export function lookupNoc(title: string): { code: string; title: string } | null {
  const key = title.toLowerCase().trim();
  // Exact match
  if (NOC_LOOKUP[key]) return NOC_LOOKUP[key];
  // Partial match
  for (const [k, v] of Object.entries(NOC_LOOKUP)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}
