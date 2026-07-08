import type { MatchedUniversity, Profile, Tier, University } from "./types";
import { ENGLISH_LEVELS } from "./types";
import { UNIVERSITIES } from "./universities";

function ieltsFor(profile: Profile): number {
  return ENGLISH_LEVELS.find((e) => e.id === profile.english)?.ielts ?? 6;
}

// Translate a student's profile + a university's selectivity into a rough
// admission chance (0–100). The model is intentionally transparent: academic
// strength relative to the school's competitiveness drives the estimate, with
// small nudges for English readiness and interest alignment.
function admissionChance(profile: Profile, uni: University, relevance: number): number {
  // Student academic strength on a 0–100 scale (GPA is the dominant signal).
  const academic = (profile.gpa / 4) * 100;

  // School competitiveness: lower acceptance rate => higher bar. We blend the
  // acceptance rate with the GPA floor so two schools with the same acceptance
  // rate but different rigor differ slightly.
  const selectivity = 100 - uni.acceptanceRate; // 0–100, higher = harder
  const gpaBar = (uni.minGpa / 4) * 100;
  const bar = selectivity * 0.6 + gpaBar * 0.4;

  // Core estimate: how far the student sits above/below the bar.
  let chance = 50 + (academic - bar) * 1.6;

  // English readiness: falling short of the required band hurts; clearing it
  // comfortably helps a little.
  const ielts = ieltsFor(profile);
  if (ielts < uni.minIelts) chance -= (uni.minIelts - ielts) * 12;
  else chance += Math.min(ielts - uni.minIelts, 1) * 4;

  // Demonstrated interest fit gives a modest bump.
  chance += (relevance / 100) * 6;

  return Math.max(2, Math.min(98, Math.round(chance)));
}

function tierFor(chance: number): Tier {
  if (chance < 30) return "Dream";
  if (chance <= 65) return "Target";
  return "Safe";
}

// Share of the student's chosen fields that this university offers (0–100).
function relevanceFor(profile: Profile, uni: University): number {
  if (profile.interests.length === 0) return 50;
  const overlap = profile.interests.filter((f) => uni.fields.includes(f)).length;
  return Math.round((overlap / profile.interests.length) * 100);
}

function reasonFor(m: Omit<MatchedUniversity, "reason">, profile: Profile): string {
  const { uni, tier, chance, overBudget, englishGap } = m;
  const parts: string[] = [];

  if (tier === "Dream") {
    parts.push(
      `A reach at ~${chance}% — ${uni.name.split(" ")[0]}'s ${uni.acceptanceRate}% acceptance rate sits above your current profile, but a standout essay and strong tests can move the needle.`,
    );
  } else if (tier === "Target") {
    parts.push(
      `A realistic target at ~${chance}%. Your ${profile.gpa.toFixed(2)} GPA lines up well with its ${uni.acceptanceRate}% acceptance rate.`,
    );
  } else {
    parts.push(
      `A confident safety at ~${chance}%. You're comfortably above the bar here, making it a reliable anchor for your list.`,
    );
  }

  const matched = profile.interests.filter((f) => uni.fields.includes(f));
  if (matched.length > 0) {
    parts.push(`Strong fit for ${matched.slice(0, 2).join(" & ")}.`);
  }
  if (englishGap) {
    parts.push(`Note: it expects ~IELTS ${uni.minIelts.toFixed(1)} — plan to raise your English score.`);
  }
  if (overBudget) {
    parts.push(`Above your budget (~$${Math.round(uni.annualCostUSD / 1000)}k/yr) — look into scholarships.`);
  }
  return parts.join(" ");
}

export interface MatchResult {
  dream: MatchedUniversity[];
  target: MatchedUniversity[];
  safe: MatchedUniversity[];
  all: MatchedUniversity[];
}

export function matchUniversities(profile: Profile): MatchResult {
  const pool = UNIVERSITIES.filter((u) => profile.countries.includes(u.country));
  const ielts = ieltsFor(profile);

  const matched: MatchedUniversity[] = pool.map((uni) => {
    const relevance = relevanceFor(profile, uni);
    const chance = admissionChance(profile, uni, relevance);
    const base = {
      uni,
      tier: tierFor(chance),
      chance,
      relevance,
      overBudget: uni.annualCostUSD > profile.budgetUSD,
      englishGap: ielts < uni.minIelts,
    };
    return { ...base, reason: reasonFor(base, profile) };
  });

  // Sort each tier by relevance first, then by chance fit within the tier.
  const byFit = (a: MatchedUniversity, b: MatchedUniversity) =>
    b.relevance - a.relevance || b.chance - a.chance;

  const dream = matched.filter((m) => m.tier === "Dream").sort(byFit);
  const target = matched.filter((m) => m.tier === "Target").sort(byFit);
  const safe = matched.filter((m) => m.tier === "Safe").sort(byFit);

  return { dream, target, safe, all: matched };
}
