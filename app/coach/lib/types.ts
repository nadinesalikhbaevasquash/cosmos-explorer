// Domain model for Study Abroad Coach. Everything is client-side (localStorage);
// there is no backend, so these types are the single source of truth shared by
// the onboarding flow, results, roadmap and essay pages.

export type Country = "US" | "UK" | "Canada";

export const COUNTRIES: { id: Country; label: string; flag: string }[] = [
  { id: "US", label: "United States", flag: "🇺🇸" },
  { id: "UK", label: "United Kingdom", flag: "🇬🇧" },
  { id: "Canada", label: "Canada", flag: "🇨🇦" },
];

// Fields of study double as university tags and onboarding interests.
export type Field =
  | "Computer Science"
  | "Engineering"
  | "Business"
  | "Economics"
  | "Medicine & Biology"
  | "Physics & Math"
  | "Law"
  | "Arts & Design"
  | "Humanities"
  | "Social Sciences"
  | "Environmental Science";

export const FIELDS: Field[] = [
  "Computer Science",
  "Engineering",
  "Business",
  "Economics",
  "Medicine & Biology",
  "Physics & Math",
  "Law",
  "Arts & Design",
  "Humanities",
  "Social Sciences",
  "Environmental Science",
];

// Self-reported English ability. Mapped to an approximate IELTS band for
// matching against each university's minimum requirement.
export type EnglishLevel = "beginner" | "intermediate" | "advanced" | "native";

export const ENGLISH_LEVELS: {
  id: EnglishLevel;
  label: string;
  ielts: number;
  hint: string;
}[] = [
  { id: "beginner", label: "Beginner", ielts: 5.0, hint: "Still building fluency" },
  { id: "intermediate", label: "Intermediate", ielts: 6.0, hint: "Comfortable day-to-day" },
  { id: "advanced", label: "Advanced", ielts: 7.0, hint: "Confident academic English" },
  { id: "native", label: "Native / Fluent", ielts: 9.0, hint: "No test likely needed" },
];

export interface Profile {
  countries: Country[]; // preferred destinations (1–3)
  gpa: number; // 0.0 – 4.0 scale
  interests: Field[]; // chosen fields of study
  budgetUSD: number; // max annual budget (tuition + living), USD
  english: EnglishLevel;
  createdAt: number;
}

export interface University {
  id: string;
  name: string;
  country: Country;
  city: string;
  fields: Field[];
  acceptanceRate: number; // 0–100, real-world approximate
  minGpa: number; // rough GPA floor for a competitive applicant
  minIelts: number; // minimum English band required
  annualCostUSD: number; // tuition + living estimate for intl students
  blurb: string;
}

export type Tier = "Dream" | "Target" | "Safe";

export interface MatchedUniversity {
  uni: University;
  tier: Tier;
  chance: number; // 0–100 estimated admission chance for this profile
  relevance: number; // 0–100 interest overlap
  overBudget: boolean;
  englishGap: boolean; // profile English below requirement
  reason: string;
}

// ── Roadmap ──────────────────────────────────────────────────────────────

export type TaskCategory =
  | "Research"
  | "Exams"
  | "Essays"
  | "Recommendations"
  | "Applications"
  | "Financial"
  | "Decisions";

export interface RoadmapTask {
  id: string;
  category: TaskCategory;
  title: string;
  detail: string;
  due: string; // ISO date (YYYY-MM-DD)
}

export interface RoadmapPhase {
  id: string;
  title: string;
  window: string; // human-readable date range
  tasks: RoadmapTask[];
}
