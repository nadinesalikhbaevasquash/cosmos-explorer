import type { Profile, RoadmapPhase, RoadmapTask } from "./types";

// Which standardized tests this profile needs.
export function examPlan(profile: Profile) {
  const needsSat = profile.countries.includes("US");
  // Anyone who isn't a native/fluent speaker should plan for an English test.
  const needsIelts = profile.english !== "native";
  return { needsSat, needsIelts };
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function iso(year: number, month1: number, day: number): string {
  return `${year}-${String(month1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function label(year: number, month1: number): string {
  return `${MONTHS[month1 - 1]} ${year}`;
}

// Anchor the plan to the next realistic application cycle. The headline US/UK
// deadlines cluster around Nov 1 (early) and Jan (regular); decisions land in
// spring, with enrollment deposits due ~May 1. We aim at the next Nov 1 that is
// comfortably in the future.
export function buildRoadmap(profile: Profile, now = new Date()): RoadmapPhase[] {
  let appYear = now.getFullYear();
  if (now.getMonth() > 9) appYear += 1; // past October → target next cycle
  const entryYear = appYear + 1;

  const { needsSat, needsIelts } = examPlan(profile);
  const examName = needsSat && needsIelts ? "SAT + IELTS" : needsSat ? "SAT" : "IELTS";

  const phases: RoadmapPhase[] = [];

  // ── Phase 1: Research & Foundations ───────────────────────────
  const p1: RoadmapTask[] = [
    {
      id: "p1-shortlist",
      category: "Research",
      title: "Finalize your university shortlist",
      detail: "Aim for ~8–10 schools: 2–3 dream, 3–4 target, 2–3 safe. Your results page is a starting point.",
      due: iso(appYear, 7, 31),
    },
    {
      id: "p1-register-exams",
      category: "Exams",
      title: `Register for the ${examName}`,
      detail: needsSat
        ? "Book an autumn SAT date and reserve a backup. If retaking, leave room for a second attempt."
        : "Book an IELTS (or TOEFL) test date for early autumn so scores arrive before deadlines.",
      due: iso(appYear, 8, 15),
    },
    {
      id: "p1-accounts",
      category: "Applications",
      title: "Create your application accounts",
      detail: profile.countries.includes("UK")
        ? "Set up Common App (US), UCAS (UK) and OUAC (Canada) as needed for your list."
        : "Set up the Common App and any country-specific portals your schools use.",
      due: iso(appYear, 8, 31),
    },
  ];
  phases.push({
    id: "phase-1",
    title: "Research & Foundations",
    window: `Now – ${label(appYear, 8)}`,
    tasks: p1,
  });

  // ── Phase 2: Test Prep & Scores ───────────────────────────────
  const p2: RoadmapTask[] = [];
  if (needsSat) {
    p2.push({
      id: "p2-sat-prep",
      category: "Exams",
      title: "Complete SAT preparation",
      detail: "Do 6–8 weeks of focused prep with at least 3 full timed practice tests. Target a score that fits your dream schools.",
      due: iso(appYear, 9, 30),
    });
    p2.push({
      id: "p2-sat-take",
      category: "Exams",
      title: "Sit the SAT",
      detail: "Take the official exam. Keep a later date open in case you want to superscore a retake.",
      due: iso(appYear, 10, 15),
    });
  }
  if (needsIelts) {
    p2.push({
      id: "p2-ielts-prep",
      category: "Exams",
      title: "Prepare for the IELTS",
      detail:
        profile.english === "beginner"
          ? "Give yourself extra runway — focus on writing and speaking, the hardest bands to lift quickly."
          : "Drill the four sections and sit two practice tests to confirm you'll clear your schools' minimum band.",
      due: iso(appYear, 9, 20),
    });
    p2.push({
      id: "p2-ielts-take",
      category: "Exams",
      title: "Sit the IELTS",
      detail: "Take the official test. Most schools want results no older than two years at enrollment.",
      due: iso(appYear, 10, 5),
    });
  }
  p2.push({
    id: "p2-recommenders",
    category: "Recommendations",
    title: "Ask teachers for recommendation letters",
    detail: "Approach 2 teachers (and a counselor) early. Give them your resume, deadlines and a polite nudge calendar.",
    due: iso(appYear, 9, 30),
  });
  phases.push({
    id: "phase-2",
    title: "Test Prep & Scores",
    window: `${label(appYear, 9)} – ${label(appYear, 10)}`,
    tasks: p2,
  });

  // ── Phase 3: Essays & Applications ────────────────────────────
  const p3: RoadmapTask[] = [
    {
      id: "p3-brainstorm",
      category: "Essays",
      title: "Brainstorm your personal statement",
      detail: "List 5–6 candidate stories. Pick the one only you could write — specific, honest, and showing growth.",
      due: iso(appYear, 10, 10),
    },
    {
      id: "p3-draft",
      category: "Essays",
      title: "Draft your main essay (≤650 words)",
      detail: "Write a full first draft of your Common App / personal statement. Done is better than perfect — you'll revise.",
      due: iso(appYear, 10, 25),
    },
    {
      id: "p3-feedback",
      category: "Essays",
      title: "Run your essay through feedback & revise",
      detail: "Use the Essay Feedback tool to check your hook, specificity, voice and structure, then revise twice.",
      due: iso(appYear, 11, 5),
    },
    {
      id: "p3-supplements",
      category: "Essays",
      title: "Write supplemental essays",
      detail: "Tackle the 'Why us?' and short-answer prompts for each school. Reuse research from your shortlist.",
      due: iso(appYear, 11, 10),
    },
    {
      id: "p3-early",
      category: "Applications",
      title: "Submit Early Action / Early Decision",
      detail: "Most early deadlines fall on Nov 1. Submit anything early to boost your odds at top choices.",
      due: iso(appYear, 11, 1),
    },
  ];
  phases.push({
    id: "phase-3",
    title: "Essays & Applications",
    window: `${label(appYear, 10)} – ${label(appYear, 11)}`,
    tasks: p3,
  });

  // ── Phase 4: Submit & Finance ─────────────────────────────────
  const p4: RoadmapTask[] = [
    {
      id: "p4-regular",
      category: "Applications",
      title: "Submit regular-decision applications",
      detail: "Regular deadlines cluster in early-to-mid January. Submit a few days early to avoid portal crunches.",
      due: iso(entryYear, 1, 5),
    },
    {
      id: "p4-scores",
      category: "Applications",
      title: "Send official test scores",
      detail: "Make sure each school receives your official SAT/IELTS scores directly from the test provider.",
      due: iso(entryYear, 1, 10),
    },
    {
      id: "p4-aid",
      category: "Financial",
      title: "Apply for scholarships & financial aid",
      detail:
        profile.budgetUSD < 60000
          ? "Your budget is tight for some schools — prioritize need-based aid and international scholarships now."
          : "Submit institutional aid forms and search external scholarships to lower your net cost.",
      due: iso(entryYear, 2, 1),
    },
  ];
  phases.push({
    id: "phase-4",
    title: "Submit & Finance",
    window: `${label(entryYear, 1)} – ${label(entryYear, 2)}`,
    tasks: p4,
  });

  // ── Phase 5: Decisions ────────────────────────────────────────
  const p5: RoadmapTask[] = [
    {
      id: "p5-interviews",
      category: "Decisions",
      title: "Prepare for interviews",
      detail: "Some schools (and Oxbridge especially) interview. Practice common questions and your 'why this course' story.",
      due: iso(entryYear, 2, 28),
    },
    {
      id: "p5-track",
      category: "Decisions",
      title: "Track admission decisions",
      detail: "Decisions arrive Feb–Apr. Keep a sheet of offers, conditions and reply deadlines as they come in.",
      due: iso(entryYear, 4, 1),
    },
    {
      id: "p5-decide",
      category: "Decisions",
      title: "Choose your university & pay the deposit",
      detail: "Compare offers, aid and fit, then commit. US enrollment deposits are typically due by May 1.",
      due: iso(entryYear, 5, 1),
    },
  ];
  phases.push({
    id: "phase-5",
    title: "Decisions & Commitment",
    window: `${label(entryYear, 2)} – ${label(entryYear, 5)}`,
    tasks: p5,
  });

  return phases;
}
