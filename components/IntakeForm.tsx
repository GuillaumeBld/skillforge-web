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
    // Async Fuse.js match (will update if corpus is loaded)
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
      const resp = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });
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
    onSubmit({
      jobTitle,
      noc: selectedNoc,
      ...form,
    });
  };

  const toggle = (field: "isYouth" | "isNewcomer" | "isIndigenous" | "isVisibleMinority" | "isDisability") =>
    setForm((f) => ({ ...f, [field]: !f[field] }));

  const PROVINCES = ["ON","BC","AB","QC","MB","SK","NS","NB","NL","PE","NT","NU","YT"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900">SkillForge Intake</h1>

      {/* Resume upload */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          className="hidden"
        />
        {uploadState === "idle" && (
          <>
            <p className="text-sm font-medium text-gray-700">Drop your resume here</p>
            <p className="text-xs text-gray-500 mt-1">PDF or DOCX — fields will auto-fill</p>
          </>
        )}
        {uploadState === "parsing" && (
          <p className="text-sm text-blue-600">Parsing resume…</p>
        )}
        {uploadState === "done" && (
          <p className="text-sm text-green-600">Resume parsed — review fields below</p>
        )}
        {uploadState === "error" && (
          <p className="text-sm text-red-600">{uploadError}</p>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs text-gray-400">
          <span className="bg-white px-2">or fill in manually</span>
        </div>
      </div>

      {/* Job title */}
      <div>
        <label htmlFor="jobTitle" className="block text-sm font-medium mb-1">Current job title *</label>
        <input
          id="jobTitle"
          required
          value={jobTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g. Financial Analyst, Software Developer"
          className="w-full border rounded px-3 py-2 text-sm"
        />
        {nocHint && <p className="text-xs text-blue-600 mt-1">{nocHint}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="province" className="block text-sm font-medium mb-1">Province</label>
          <select
            id="province"
            value={form.province}
            onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            {PROVINCES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="yearsExp" className="block text-sm font-medium mb-1">Years experience</label>
          <input
            id="yearsExp"
            type="number" min={0} max={40}
            value={form.yearsExperience}
            onChange={(e) => setForm((f) => ({ ...f, yearsExperience: Number(e.target.value) }))}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-medium mb-2">Priority groups (check all that apply)</legend>
        <div className="space-y-2">
          {[
            ["isYouth", "Youth (age 15-29)"],
            ["isNewcomer", "Newcomer to Canada (<5 years)"],
            ["isIndigenous", "Indigenous"],
            ["isVisibleMinority", "Visible minority"],
            ["isDisability", "Person with disability"],
          ].map(([field, label]) => (
            <label key={field} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form[field as keyof typeof form] as boolean}
                onChange={() => toggle(field as "isYouth" | "isNewcomer" | "isIndigenous" | "isVisibleMinority" | "isDisability")}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label id="eiGroup" className="block text-sm font-medium mb-1">EI eligible?</label>
        <div aria-labelledby="eiGroup" className="flex gap-4">
          {[["yes", true], ["no", false], ["unknown", null]].map(([label, val]) => (
            <label key={String(label)} className="flex items-center gap-1 text-sm cursor-pointer">
              <input
                type="radio"
                name="ei"
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
        className="w-full bg-blue-600 text-white py-2 rounded font-medium disabled:opacity-50"
      >
        {loading ? "Matching…" : "Find Trade Pathways →"}
      </button>
    </form>
  );
}
