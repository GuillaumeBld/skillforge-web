// components/ReferralPackage.tsx
"use client";
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
  pdfBlob: Blob | null;
  pdfLoading: boolean;
  pdfError?: string | null;
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

export function ReferralPackage({ match, form, pdfBlob, pdfLoading, pdfError, onBack }: Props) {
  const funding = FUNDING_BY_PROVINCE[form.province] ?? FUNDING_BY_PROVINCE["default"];
  const isRedSeal = match.teer <= 2 && match.noc_code[0] === "7";

  const handleDownload = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skillforge-referral-${match.noc_code}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
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
          onClick={handleDownload}
          disabled={pdfLoading || !pdfBlob}
          className="flex-1 bg-[#E8810A] hover:bg-[#C96E08] text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors shadow-sm"
        >
          {pdfLoading ? "Preparing PDF…" : "Download Referral Package (PDF)"}
        </button>
        <button className="flex-1 border border-gray-300 hover:border-gray-400 py-3 rounded-xl font-semibold text-sm text-gray-700 transition-colors">
          Email to worker
        </button>
      </div>
      {pdfError && <p className="mt-2 text-sm text-red-600">{pdfError}</p>}
    </div>
  );
}
