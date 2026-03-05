// types/skillforge.ts

export interface MatchRequest {
  current_noc: string;
  current_title: string;
  years_experience?: number;
  education_level?: "secondary" | "college" | "university";
  is_youth?: boolean;
  is_newcomer?: boolean;
  is_indigenous?: boolean;
  is_visible_minority?: boolean;
  is_person_with_disability?: boolean;
  province?: string;
  top_k?: number;
}

export interface MatchResultItem {
  noc_code: string;
  title: string;
  teer: number;
  composite_score: number;
  skill_similarity: number;
  demand_score: number;
  wage_growth: number;
  funding_eligible: boolean;
  training_programs: string[];
  ai_tools: string[];
  transferable_skills: string[];
}

export interface MatchResponse {
  source_noc: string;
  source_title: string;
  matches: MatchResultItem[];
  engine_version: string;
  embeddings_loaded: number;
}

export interface DemandResponse {
  noc_code: string;
  composite: number;
  vacancy_rate: number;
  cops_shortage: number;
  express_entry_priority: number;
  retirement_replacement: number;
}

export interface IntakeFormData {
  jobTitle: string;
  noc: string;
  province: string;
  yearsExperience: number;
  isYouth: boolean;
  isNewcomer: boolean;
  isIndigenous: boolean;
  isVisibleMinority: boolean;
  isDisability: boolean;
  isEiEligible: boolean | null;
}
