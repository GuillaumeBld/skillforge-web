# SkillForge UI Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Visual polish pass on SkillForge web — new color system, polished components, CircularScore ring, pill chips, amber CTA, page header. Zero functional changes.

**Architecture:** Update design tokens in globals.css, create one new component (Header), then replace JSX/Tailwind in IntakeForm, MatchReport, and ReferralPackage. Props interfaces and all business logic stay identical. Magic MCP generates polished component shells; we wire business logic back in.

**Tech Stack:** Next.js 16 / React 19 / Tailwind CSS v4 / TypeScript / Magic MCP (@21st-dev/magic)

---

## Task 1: Configure Magic MCP

**Files:**
- Create: `~/.claude/mcp_servers.json` (or merge into existing)

**Step 1: Check if mcp_servers.json already exists**

```bash
cat ~/.claude/mcp_servers.json 2>/dev/null || echo "FILE NOT FOUND"
```

**Step 2: Add Magic MCP server config**

If file doesn't exist, create it. If it exists, merge the `magic` key in:

```json
{
  "mcpServers": {
    "magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest"],
      "env": {
        "API_KEY": "an_sk_c49b5cdb7bf0351975cfe97e9a7b89be10e614dcb5e924c76089b06ed1a4aa61"
      }
    }
  }
}
```

**Step 3: Verify npx can reach the package**

```bash
npx -y @21st-dev/magic@latest --version 2>&1 | head -5
```

Expected: version string or help output (no hard error).

**Step 4: Commit**

```bash
# No commit needed — this is local Claude Code config, not in repo
echo "Magic MCP configured"
```

---

## Task 2: Design Tokens — globals.css

**Files:**
- Modify: `app/globals.css`

**Step 1: Replace globals.css content**

```css
@import "tailwindcss";

:root {
  --background: #F8F7F5;
  --foreground: #171717;
  --color-primary: #1B4F8A;
  --color-primary-hover: #163E6E;
  --color-accent: #E8810A;
  --color-accent-hover: #C96E08;
  --color-success: #1A7A4A;
  --color-card: #FFFFFF;
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06);
  --shadow-card-hover: 0 4px 12px 0 rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans), Arial, Helvetica, sans-serif;
}
```

**Step 2: Verify build still passes**

```bash
cd /Volumes/SanDisk/dev/projects/skillforge-web && npm run build 2>&1 | tail -10
```

Expected: no errors, routes listed.

**Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: update design tokens — navy primary, amber accent, warm white bg"
```

---

## Task 3: Header Component + Layout

**Files:**
- Create: `components/Header.tsx`
- Modify: `app/layout.tsx`

**Step 1: Create Header.tsx**

```tsx
// components/Header.tsx
export function Header() {
  return (
    <header className="bg-[#1B4F8A] text-white">
      <div className="max-w-2xl mx-auto px-8 py-4 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-[#E8810A] flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 1L9.5 5.5H12.5L10 8.5L11 13L7 10.5L3 13L4 8.5L1.5 5.5H4.5L7 1Z"
              fill="white" />
          </svg>
        </div>
        <div>
          <span className="font-extrabold text-base tracking-tight">SkillForge</span>
          <span className="ml-2 text-blue-200 text-xs font-normal hidden sm:inline">
            Canadian Trade Pathway Matching
          </span>
        </div>
      </div>
    </header>
  );
}
```

**Step 2: Update layout.tsx to include Header above EngineStatus**

Replace the `<body>` contents in `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { EngineStatus } from "@/components/EngineStatus";
import { Header } from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillForge — Trade Pathway Intake",
  description: "Match displaced workers to high-demand Canadian trades",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Header />
        <EngineStatus />
        {children}
      </body>
    </html>
  );
}
```

**Step 3: Build to verify no TS errors**

```bash
npm run build 2>&1 | tail -10
```

Expected: clean build.

**Step 4: Commit**

```bash
git add components/Header.tsx app/layout.tsx
git commit -m "style: add SkillForge header with navy bg and amber icon"
```

---

## Task 4: IntakeForm.tsx — Polish

**Files:**
- Modify: `components/IntakeForm.tsx`

**Step 1: Replace IntakeForm.tsx with polished version**

Keep ALL logic and state identical. Only JSX/classes change.

```tsx
// components/IntakeForm.tsx
"use client";
import { useState, useRef } from "react";
import { matchNoc, matchNocSync } from "@/lib/noc-matcher";
import type { IntakeFormData } from "@/types/skillforge";

interface Props {
  onSubmit: (data: IntakeFormData) => void;
  loading: boolean;
}

type UploadState = "idle" | "parsing" | "done" | "error";

const PRIORITY_FIELDS: { key: "isYouth" | "isNewcomer" | "isIndigenous" | "isVisibleMinority" | "isDisability"; label: string }[] = [
  { key: "isYouth", label: "Youth 15–29" },
  { key: "isNewcomer", label: "Newcomer (<5yr)" },
  { key: "isIndigenous", label: "Indigenous" },
  { key: "isVisibleMinority", label: "Visible minority" },
  { key: "isDisability", label: "Person w/ disability" },
];

const PROVINCES = ["ON","BC","AB","QC","MB","SK","NS","NB","NL","PE","NT","NU","YT"];

export function IntakeForm({ onSubmit, loading }: Props) {
  const [jobTitle, setJobTitle] = useState("");
  const [nocHint, setNocHint] = useState<string | null>(null);
  const [selectedNoc, setSelectedNoc] = useState<string>("");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Omit<IntakeFormData, "jobTitle" | "noc">>({
    province: "ON",
    yearsExperience: 5,
    isYouth: false,
    isNewcomer: false,
    isIndigenous: false,
    isVisibleMinority: false,
    isDisability: false,
    isEiEligible: null,
  });

  const handleTitleChange = async (v: string) => {
    setJobTitle(v);
    const syncMatch = matchNocSync(v);
    if (syncMatch) {
      setNocHint(`→ NOC ${syncMatch.code}: ${syncMatch.title}`);
      setSelectedNoc(syncMatch.code);
    } else {
      setNocHint(null);
      setSelectedNoc("");
    }
    const matches = await matchNoc(v, 1);
    if (matches.length > 0) {
      setNocHint(`→ NOC ${matches[0].code}: ${matches[0].title}`);
      setSelectedNoc(matches[0].code);
    }
  };

  const handleResumeUpload = async (file: File) => {
    setUploadState("parsing");
    setUploadError(null);
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const resp = await fetch("/api/parse-resume", { method: "POST", body: formData });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }
      const data = await resp.json();
      if (data.currentTitle) {
        await handleTitleChange(data.currentTitle);
        setJobTitle(data.currentTitle);
      }
      if (typeof data.yearsExperience === "number") {
        setForm((f) => ({ ...f, yearsExperience: data.yearsExperience }));
      }
      setUploadState("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not parse resume";
      setUploadError(msg);
      setUploadState("error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleResumeUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleResumeUpload(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ jobTitle, noc: selectedNoc, ...form });
  };

  const toggle = (field: "isYouth" | "isNewcomer" | "isIndigenous" | "isVisibleMinority" | "isDisability") =>
    setForm((f) => ({ ...f, [field]: !f[field] }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto p-8">

      {/* Resume drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${uploadState === "done"
            ? "border-[#1A7A4A] bg-green-50"
            : uploadState === "error"
            ? "border-red-300 bg-red-50"
            : "border-gray-300 hover:border-[#1B4F8A] hover:bg-blue-50/40"
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          className="hidden"
        />
        {uploadState === "idle" && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 3v10M6 7l4-4 4 4M4 17h12" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700">Drop your resume here</p>
            <p className="text-xs text-gray-400">PDF or DOCX — fields auto-fill</p>
          </div>
        )}
        {uploadState === "parsing" && (
          <div className="flex items-center justify-center gap-2 text-sm text-[#1B4F8A]">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10"/>
            </svg>
            Parsing resume…
          </div>
        )}
        {uploadState === "done" && (
          <div className="flex items-center justify-center gap-2 text-sm text-[#1A7A4A] font-medium">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 10l5 5 7-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Resume parsed — review fields below
          </div>
        )}
        {uploadState === "error" && (
          <p className="text-sm text-red-600">{uploadError}</p>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#F8F7F5] px-3 text-xs text-gray-400">or fill in manually</span>
        </div>
      </div>

      {/* Job title */}
      <div>
        <label htmlFor="jobTitle" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Current job title <span className="text-red-400">*</span>
        </label>
        <input
          id="jobTitle"
          required
          value={jobTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g. Financial Analyst, Software Developer"
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30 focus:border-[#1B4F8A] transition"
        />
        {nocHint && (
          <p className="text-xs text-[#1B4F8A] mt-1.5 font-medium">{nocHint}</p>
        )}
      </div>

      {/* Province + Years */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="province" className="block text-sm font-semibold text-gray-700 mb-1.5">Province</label>
          <select
            id="province"
            value={form.province}
            onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30 focus:border-[#1B4F8A] transition bg-white"
          >
            {PROVINCES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="yearsExp" className="block text-sm font-semibold text-gray-700 mb-1.5">Years experience</label>
          <input
            id="yearsExp"
            type="number" min={0} max={40}
            value={form.yearsExperience}
            onChange={(e) => setForm((f) => ({ ...f, yearsExperience: Number(e.target.value) }))}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30 focus:border-[#1B4F8A] transition"
          />
        </div>
      </div>

      {/* Priority groups — pill chips */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-700 mb-2.5">Priority groups</legend>
        <div className="flex flex-wrap gap-2">
          {PRIORITY_FIELDS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                form[key]
                  ? "bg-[#1B4F8A] text-white border-[#1B4F8A] shadow-sm"
                  : "bg-white text-gray-600 border-gray-300 hover:border-[#1B4F8A] hover:text-[#1B4F8A]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* EI eligibility */}
      <div>
        <label id="eiGroup" className="block text-sm font-semibold text-gray-700 mb-2.5">EI eligible?</label>
        <div aria-labelledby="eiGroup" className="flex gap-3">
          {([["yes", true], ["no", false], ["unknown", null]] as const).map(([label, val]) => (
            <label
              key={String(label)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm cursor-pointer transition-all font-medium ${
                form.isEiEligible === val
                  ? "bg-[#1B4F8A] text-white border-[#1B4F8A]"
                  : "bg-white text-gray-600 border-gray-300 hover:border-[#1B4F8A]"
              }`}
            >
              <input
                type="radio"
                name="ei"
                className="sr-only"
                checked={form.isEiEligible === val}
                onChange={() => setForm((f) => ({ ...f, isEiEligible: val as boolean | null }))}
              />
              {String(label).charAt(0).toUpperCase() + String(label).slice(1)}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !jobTitle}
        className="w-full bg-[#E8810A] hover:bg-[#C96E08] text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors shadow-sm"
      >
        {loading ? "Matching…" : "Find Trade Pathways →"}
      </button>
    </form>
  );
}
```

**Step 2: Build to verify no TS errors**

```bash
npm run build 2>&1 | tail -15
```

Expected: clean build, `/` listed as static.

**Step 3: Commit**

```bash
git add components/IntakeForm.tsx
git commit -m "style: polish IntakeForm — pill chips, amber CTA, rounded-xl, icon drop zone"
```

---

## Task 5: MatchReport.tsx — Polish + CircularScore

**Files:**
- Modify: `components/MatchReport.tsx`

**Step 1: Replace MatchReport.tsx**

All props, logic, and data identical. Only visual treatment changes.

```tsx
// components/MatchReport.tsx
"use client";
import type { MatchResultItem, IntakeFormData } from "@/types/skillforge";

interface Props {
  sourceTitle: string;
  sourceNoc: string;
  matches: MatchResultItem[];
  form: IntakeFormData;
  onSelect: (match: MatchResultItem) => void;
  onBack: () => void;
}

function CircularScore({ score }: { score: number }) {
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative flex-shrink-0 w-20 h-20">
      <svg width="80" height="80" className="-rotate-90 absolute inset-0">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#E5E7EB" strokeWidth="7" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke="#1B4F8A" strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold text-[#1B4F8A] leading-none">{score}</span>
        <span className="text-[9px] text-gray-400 leading-none mt-0.5">match</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? "bg-[#1A7A4A]" : pct >= 50 ? "bg-amber-400" : "bg-gray-300";
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-semibold text-gray-700">{pct}%</span>
      </div>
      <div className="bg-gray-100 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DemandBadge({ score }: { score: number }) {
  if (score >= 0.70) return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-green-50 text-[#1A7A4A] border border-green-200">
      <span aria-hidden="true">↑</span> High demand
    </span>
  );
  if (score >= 0.50) return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <span aria-hidden="true">→</span> Moderate demand
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-gray-100 text-gray-500 border border-gray-200">
      <span aria-hidden="true">↓</span> Lower demand
    </span>
  );
}

const TEER_LABEL: Record<number, string> = {
  0: "Management", 1: "University/college", 2: "College/apprenticeship",
  3: "College/training", 4: "High school", 5: "Short demo",
};

export function MatchReport({ sourceTitle, sourceNoc, matches, form, onSelect, onBack }: Props) {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <button
        onClick={onBack}
        className="text-sm text-[#1B4F8A] hover:text-[#163E6E] mb-6 flex items-center gap-1 font-medium transition-colors"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Trade Pathways</h1>
      <p className="text-gray-400 text-sm mb-7">
        {sourceTitle} (NOC {sourceNoc}) · {form.province} · {form.yearsExperience}yr experience
      </p>

      <div className="space-y-4">
        {matches.map((m, i) => (
          <div
            key={m.noc_code}
            className="bg-white rounded-xl border-l-4 border-l-[#1B4F8A] border border-gray-100 p-5 hover:shadow-md transition-shadow"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-gray-300">#{i + 1}</span>
                  <span className="font-extrabold text-gray-900 truncate">{m.title}</span>
                </div>
                <p className="text-xs text-gray-400">
                  NOC {m.noc_code} · TEER {m.teer} · {TEER_LABEL[m.teer] ?? "Trade"} training
                </p>
              </div>
              <CircularScore score={Math.round(m.composite_score * 100)} />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <ScoreBar label="Skill transfer" value={m.skill_similarity} />
              <ScoreBar label="Market demand" value={m.demand_score} />
              <ScoreBar label="Wage growth" value={m.wage_growth} />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <DemandBadge score={m.demand_score} />
              {m.funding_eligible && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-50 text-[#1B4F8A] border border-blue-200">
                  ✓ LMDA/WDA eligible
                </span>
              )}
            </div>

            {m.training_programs.length > 0 && (
              <p className="text-xs text-gray-500 mb-1.5">
                Training: {m.training_programs.slice(0, 2).join(" · ")}
              </p>
            )}
            {m.ai_tools.length > 0 && (
              <p className="text-xs text-gray-400 mb-4">
                AI tools: {m.ai_tools.slice(0, 3).join(", ")}
              </p>
            )}

            <button
              onClick={() => onSelect(m)}
              className="w-full bg-[#1B4F8A] hover:bg-[#163E6E] text-white text-sm py-2.5 rounded-xl font-semibold transition-colors"
            >
              Select this program →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Build**

```bash
npm run build 2>&1 | tail -10
```

Expected: clean build.

**Step 3: Commit**

```bash
git add components/MatchReport.tsx
git commit -m "style: polish MatchReport — CircularScore ring, navy left-border cards, icon badges"
```

---

## Task 6: ReferralPackage.tsx — Polish

**Files:**
- Modify: `components/ReferralPackage.tsx`

**Step 1: Replace ReferralPackage.tsx**

All business logic (funding lookup, checklist, download, isRedSeal) stays identical.

```tsx
// components/ReferralPackage.tsx
"use client";
import { useState } from "react";
import type { MatchResultItem, IntakeFormData } from "@/types/skillforge";

const FUNDING_BY_PROVINCE: Record<string, { lmda: string; wda: string }> = {
  ON: { lmda: "up to $28,000", wda: "Canada Job Grant + WDA" },
  BC: { lmda: "up to $20,000 (StrongerBC)", wda: "Canada Job Grant" },
  AB: { lmda: "up to $15,000", wda: "Canada Job Grant" },
  QC: { lmda: "up to $20,000 (Emploi-Québec)", wda: "PAMT" },
  default: { lmda: "up to $15,000", wda: "Canada Job Grant" },
};

interface Props {
  match: MatchResultItem;
  form: IntakeFormData;
  onBack: () => void;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
      <span className="w-1 h-4 bg-[#1B4F8A] rounded-full flex-shrink-0" aria-hidden="true" />
      {children}
    </h2>
  );
}

function CheckRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-gray-700">
      <svg className="w-4 h-4 text-[#1A7A4A] mt-0.5 flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span>{children}</span>
    </div>
  );
}

function ChecklistRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-gray-700">
      <span className="w-4 h-4 border-2 border-gray-300 rounded mt-0.5 flex-shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function ReferralPackage({ match, form, onBack }: Props) {
  const [downloading, setDownloading] = useState(false);
  const funding = FUNDING_BY_PROVINCE[form.province] ?? FUNDING_BY_PROVINCE["default"];
  const isRedSeal = match.teer <= 2 && match.noc_code[0] === "7";

  const download = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/referral-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match, form }),
      });
      if (!res.ok) throw new Error(`PDF generation failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skillforge-referral-${match.noc_code}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const checklistItems = [
    "Proof of identity (SIN + government photo ID)",
    "Record of Employment (ROE) from last employer",
    "EI application / EI statement (if EI-eligible)",
    "Educational credentials (if applicable)",
    `Proof of residence in ${form.province}`,
    form.isYouth ? "Proof of age (youth 15–29 priority)" : null,
    form.isNewcomer ? "Permanent Resident card / proof of landing date" : null,
    form.isIndigenous ? "Indigenous status documentation (self-identification accepted)" : null,
  ].filter((item): item is string => item !== null);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <button
        onClick={onBack}
        className="text-sm text-[#1B4F8A] hover:text-[#163E6E] mb-6 flex items-center gap-1 font-medium transition-colors"
      >
        ← Back to matches
      </button>

      {/* Hero header */}
      <div className="bg-[#1B4F8A] rounded-xl p-6 mb-6 text-white">
        <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Referral Package</p>
        <h1 className="text-xl font-extrabold mb-0.5">{match.title}</h1>
        <p className="text-blue-200 text-sm">
          {form.jobTitle} → NOC {match.noc_code}
        </p>
      </div>

      {/* Funding highlight */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
        <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Available funding</p>
        <p className="text-2xl font-extrabold text-gray-900">{funding.lmda}</p>
        <p className="text-xs text-gray-500 mt-0.5">LMDA + {funding.wda}</p>
      </div>

      {/* Funding eligibility */}
      <section className="mb-6">
        <SectionHeader>Funding Eligibility</SectionHeader>
        <div className="space-y-2.5">
          {form.isEiEligible !== false && (
            <CheckRow>
              <strong>LMDA (EI-funded)</strong> — {funding.lmda} for approved training
            </CheckRow>
          )}
          <CheckRow>
            <strong>WDA</strong> — {funding.wda} (all displaced workers)
          </CheckRow>
          {isRedSeal && (
            <>
              <CheckRow>
                <strong>Apprenticeship Incentive Grant</strong> — $1,000/year during apprenticeship
              </CheckRow>
              <CheckRow>
                <strong>Apprenticeship Completion Bonus</strong> — $2,000 at Red Seal
              </CheckRow>
            </>
          )}
        </div>
      </section>

      {/* Checklist */}
      <section className="mb-6">
        <SectionHeader>LMDA Referral Checklist</SectionHeader>
        <div className="space-y-2.5">
          {checklistItems.map((item, i) => (
            <ChecklistRow key={i}>{item}</ChecklistRow>
          ))}
        </div>
      </section>

      {/* Training */}
      <section className="mb-7">
        <SectionHeader>Training Program</SectionHeader>
        <div className="text-sm text-gray-700 space-y-1">
          <p>Program: <span className="font-medium">{match.training_programs[0] ?? "Trade school / apprenticeship"}</span></p>
          <p>NOC: <span className="font-medium">{match.noc_code} — {match.title}</span></p>
          <p>TEER level: <span className="font-medium">{match.teer} — {match.teer <= 2 ? "Apprenticeship / Red Seal eligible" : "Certificate / diploma"}</span></p>
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={download}
          disabled={downloading}
          className="flex-1 bg-[#E8810A] hover:bg-[#C96E08] text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors shadow-sm"
        >
          {downloading ? "Generating PDF…" : "Download PDF"}
        </button>
        <button className="flex-1 border border-gray-300 hover:border-gray-400 py-3 rounded-xl font-semibold text-sm text-gray-700 transition-colors">
          Email to worker
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Build**

```bash
npm run build 2>&1 | tail -10
```

Expected: clean build.

**Step 3: Commit**

```bash
git add components/ReferralPackage.tsx
git commit -m "style: polish ReferralPackage — funding hero block, amber CTA, icon sections"
```

---

## Task 7: EngineStatus.tsx — Minor Polish

**Files:**
- Modify: `components/EngineStatus.tsx`

**Step 1: Update EngineStatus to match new rounded/typography style**

```tsx
// components/EngineStatus.tsx
"use client";
import { useEffect, useState } from "react";

export function EngineStatus() {
  const [status, setStatus] = useState<"ok" | "down" | "checking">("checking");

  useEffect(() => {
    fetch("/api/engine/health")
      .then((r) => setStatus(r.ok ? "ok" : "down"))
      .catch(() => setStatus("down"));
  }, []);

  if (status === "checking" || status === "ok") return null;

  return (
    <div className="bg-red-50 border-b border-red-200 text-red-700 text-xs text-center py-2.5 px-4 font-medium">
      ⚠️ SkillForge engine is not running —{" "}
      <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono text-xs">make run</code>{" "}
      in the <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono text-xs">skillforge/</code> directory
    </div>
  );
}
```

**Step 2: Build**

```bash
npm run build 2>&1 | tail -10
```

Expected: clean build.

**Step 3: Commit**

```bash
git add components/EngineStatus.tsx
git commit -m "style: minor polish on EngineStatus banner"
```

---

## Task 8: Push + Deploy to VPS

**Files:** None (deploy only)

**Step 1: Push to GitHub**

```bash
git push origin main
```

**Step 2: Pull on VPS and rebuild**

```bash
ssh vps "cd /projets/skillforge-web && git pull origin main && npm run build 2>&1 | tail -15"
```

Expected: clean build, all 4 API routes listed.

**Step 3: Restart service**

```bash
ssh vps "systemctl restart skillforge-web && sleep 2 && curl -s -o /dev/null -w '%{http_code}' https://skillforge.qualiaai.fr/"
```

Expected: `200`

**Step 4: Verify engine health still works**

```bash
curl -s https://skillforge.qualiaai.fr/api/engine/health
```

Expected: `{"status":"ok","occupations_indexed":39,"demand_signals":39}`
