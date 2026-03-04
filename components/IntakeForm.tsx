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
