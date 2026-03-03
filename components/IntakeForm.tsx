// components/IntakeForm.tsx
"use client";
import { useState } from "react";
import { lookupNoc } from "@/lib/noc-lookup";
import type { IntakeFormData } from "@/types/skillforge";

interface Props {
  onSubmit: (data: IntakeFormData) => void;
  loading: boolean;
}

export function IntakeForm({ onSubmit, loading }: Props) {
  const [jobTitle, setJobTitle] = useState("");
  const [nocHint, setNocHint] = useState<string | null>(null);
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

  const handleTitleChange = (v: string) => {
    setJobTitle(v);
    const match = lookupNoc(v);
    setNocHint(match ? `→ NOC ${match.code}: ${match.title}` : null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const match = lookupNoc(jobTitle);
    onSubmit({
      jobTitle,
      noc: match?.code ?? "",
      ...form,
    });
  };

  const toggle = (field: keyof typeof form) =>
    setForm((f) => ({ ...f, [field]: !f[field] }));

  const PROVINCES = ["ON","BC","AB","QC","MB","SK","NS","NB","NL","PE","NT","NU","YT"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900">SkillForge Intake</h1>

      <div>
        <label className="block text-sm font-medium mb-1">Current job title *</label>
        <input
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
          <label className="block text-sm font-medium mb-1">Province</label>
          <select
            value={form.province}
            onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            {PROVINCES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Years experience</label>
          <input
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
                onChange={() => toggle(field as keyof typeof form)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="block text-sm font-medium mb-1">EI eligible?</label>
        <div className="flex gap-4">
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
