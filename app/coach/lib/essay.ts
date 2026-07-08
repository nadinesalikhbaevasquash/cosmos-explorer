// Rule-based essay analyzer — no AI, fully deterministic and offline.
//
// College essays fail in predictable ways: clichéd openings, vague abstractions
// instead of concrete detail, passive/hedged voice, weak structure, and bloat.
// This engine measures those signals and returns a rubric score plus specific,
// actionable flags tied to the exact sentences that triggered them.

export type Severity = "low" | "med" | "high";
export type FlagType = "opener" | "cliche" | "passive" | "filler" | "long";

export interface Flag {
  type: FlagType;
  severity: Severity;
  text: string; // the offending snippet
  message: string; // why it's flagged + how to fix
}

export interface Metric {
  label: string;
  value: string;
  hint: string;
  status: "good" | "warn" | "bad";
}

export interface Dimension {
  id: string;
  label: string;
  score: number; // 0–100
  verdict: string; // one-word grade
  explanation: string;
}

export interface EssayReport {
  empty: boolean;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgSentence: number;
  uniqueRatio: number;
  overall: number;
  metrics: Metric[];
  dimensions: Dimension[];
  flags: Flag[];
  strengths: string[];
  summary: string;
}

// ── Lexicons ────────────────────────────────────────────────────

const CLICHE_PHRASES: { phrase: string; message: string }[] = [
  { phrase: "ever since i was", message: "Clichéd opener. Start in a specific moment instead of your childhood." },
  { phrase: "for as long as i can remember", message: "Overused opener — admissions officers see it constantly." },
  { phrase: "from a young age", message: "Clichéd framing. Show the interest through a concrete scene." },
  { phrase: "at a young age", message: "Clichéd framing — replace with a dated, specific memory." },
  { phrase: "since i was young", message: "Overused. Anchor the story in one vivid moment instead." },
  { phrase: "i have always been", message: "Telling, not showing. Prove the trait with an action." },
  { phrase: "i have always wanted", message: "Vague ambition. Show what sparked the want." },
  { phrase: "in today's society", message: "Empty throat-clearing — cut it and get to your story." },
  { phrase: "in this day and age", message: "Filler phrase. Delete and start with substance." },
  { phrase: "the world we live in", message: "Generic abstraction. Be concrete about your own world." },
  { phrase: "webster's dictionary", message: "The dictionary-definition opener is the most overused of all." },
  { phrase: "merriam-webster", message: "Avoid opening with a dictionary definition." },
  { phrase: "changed my life", message: "Show the change through before/after detail instead of claiming it." },
  { phrase: "comfort zone", message: "'Comfort zone' is a cliché — describe the actual discomfort." },
  { phrase: "taught me the value of", message: "Tell-y lesson phrasing. Let the reader infer the lesson." },
  { phrase: "little did i know", message: "Clichéd suspense device — trust the reader." },
  { phrase: "hard work pays off", message: "Platitude. Replace with the specific work you did." },
  { phrase: "follow my dreams", message: "Generic. Name the actual dream and step." },
  { phrase: "chase my dreams", message: "Generic. Name the actual goal concretely." },
  { phrase: "make a difference", message: "Vague aspiration — say exactly what difference, for whom." },
  { phrase: "throughout my life", message: "Too broad. Zoom into one period or moment." },
  { phrase: "more than anything", message: "Overstatement that rarely adds meaning." },
  { phrase: "i learned that", message: "Spelling out the moral. Show it instead." },
];

const FILLERS = [
  "very", "really", "quite", "just", "actually", "basically", "literally",
  "definitely", "totally", "extremely", "incredibly", "simply", "truly",
  "honestly", "obviously", "essentially", "somewhat", "rather",
];

const VAGUE = [
  "things", "stuff", "society", "world", "people", "lot", "many", "various",
  "several", "different", "good", "bad", "nice", "interesting", "amazing",
];

// -ly words that are not adverbs (so we don't over-flag adverb usage).
const NOT_ADVERBS = new Set([
  "family", "only", "reply", "apply", "supply", "early", "italy", "ally",
  "rally", "fly", "july", "ugly", "holy", "lily", "rely", "imply", "comply",
  "multiply", "monopoly", "anomaly", "assembly", "supply",
]);

const PASSIVE_RE =
  /\b(?:is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?(?:\w+ed|written|done|made|given|taken|seen|known|shown|built|told|brought|thought|held|kept|left|found|chosen|driven|grown)\b/i;

// ── Tokenizers ──────────────────────────────────────────────────

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z"'])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function words(text: string): string[] {
  return (text.toLowerCase().match(/[a-z']+/g) ?? []).filter(Boolean);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function verdict(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Decent";
  if (score >= 40) return "Needs work";
  return "Weak";
}

// ── Analyzer ────────────────────────────────────────────────────

export function analyzeEssay(raw: string, targetWords = 650): EssayReport {
  const text = raw.trim();
  if (text.length === 0) {
    return {
      empty: true,
      wordCount: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      avgSentence: 0,
      uniqueRatio: 0,
      overall: 0,
      metrics: [],
      dimensions: [],
      flags: [],
      strengths: [],
      summary: "",
    };
  }

  const sentences = splitSentences(text);
  const allWords = words(text);
  const wordCount = allWords.length;
  const sentenceCount = Math.max(1, sentences.length);
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const paragraphCount = Math.max(1, paragraphs.length);
  const avgSentence = wordCount / sentenceCount;
  const uniqueRatio = wordCount === 0 ? 0 : new Set(allWords).size / wordCount;
  const lower = " " + text.toLowerCase().replace(/\s+/g, " ") + " ";

  const flags: Flag[] = [];

  // Opener check — only the first sentence.
  const firstLower = sentences[0].toLowerCase();
  let weakOpener = false;
  for (const { phrase, message } of CLICHE_PHRASES) {
    if (firstLower.includes(phrase)) {
      weakOpener = true;
      flags.push({ type: "opener", severity: "high", text: sentences[0], message });
      break;
    }
  }

  // Cliché phrases anywhere.
  let clicheCount = 0;
  for (const { phrase, message } of CLICHE_PHRASES) {
    if (lower.includes(" " + phrase)) {
      clicheCount++;
      // Avoid duplicating the opener flag.
      if (!(weakOpener && firstLower.includes(phrase))) {
        const owner = sentences.find((s) => s.toLowerCase().includes(phrase)) ?? phrase;
        flags.push({ type: "cliche", severity: "med", text: owner, message });
      }
    }
  }

  // Passive voice + long sentences (per sentence).
  let passiveCount = 0;
  let longCount = 0;
  for (const s of sentences) {
    const wc = words(s).length;
    if (PASSIVE_RE.test(s)) {
      passiveCount++;
      if (passiveCount <= 3) {
        flags.push({
          type: "passive",
          severity: "low",
          text: s,
          message: "Passive construction — rewrite so you are the one acting (e.g. 'I built…' not 'was built').",
        });
      }
    }
    if (wc > 34) {
      longCount++;
      if (longCount <= 3) {
        flags.push({
          type: "long",
          severity: "med",
          text: s,
          message: `This sentence runs ${wc} words. Break it up so each idea lands.`,
        });
      }
    }
  }

  // Filler / intensifier words.
  let fillerCount = 0;
  for (const f of FILLERS) {
    const re = new RegExp(`\\b${f}\\b`, "gi");
    const m = lower.match(re);
    if (m) fillerCount += m.length;
  }
  if (fillerCount >= 3) {
    flags.push({
      type: "filler",
      severity: "low",
      text: `${fillerCount} filler words (very, really, just, actually…)`,
      message: "Intensifiers weaken prose. Cut them or replace with a stronger verb.",
    });
  }

  // Adverbs (-ly), vague words, concreteness signals.
  let adverbCount = 0;
  let vagueCount = 0;
  for (const w of allWords) {
    if (w.endsWith("ly") && w.length > 3 && !NOT_ADVERBS.has(w)) adverbCount++;
    if (VAGUE.includes(w)) vagueCount++;
  }
  const numbers = (text.match(/\b\d+[\d,.]*\b/g) ?? []).length;
  const properNouns = (text.match(/(?<!^)(?<![.!?]\s)\b[A-Z][a-z]{2,}\b/g) ?? []).length;
  const concreteSignals = numbers * 2 + properNouns;

  // ── Dimension scores ──────────────────────────────────────────

  // Hook: strength of the opening line.
  let hook = 72;
  if (weakOpener) hook -= 35;
  const firstWords = words(sentences[0]);
  if (/[""].+[""]/.test(sentences[0]) || /[0-9]/.test(sentences[0])) hook += 12; // dialogue or specifics
  if (/^(the|a|an|i)\b/i.test(sentences[0]) && firstWords.length > 28) hook -= 8;
  if (firstWords.length <= 14 && !weakOpener) hook += 8; // punchy opener
  const hookScore = clamp(hook);

  // Specificity: concrete detail vs vague abstraction.
  const vagueDensity = vagueCount / Math.max(1, wordCount / 100); // per 100 words
  let spec = 50 + Math.min(concreteSignals * 2.2, 34) - vagueDensity * 6;
  spec += (uniqueRatio - 0.45) * 60; // richer vocabulary reads as specific
  const specScore = clamp(spec);

  // Voice: active, confident, un-clichéd.
  const adverbDensity = adverbCount / Math.max(1, wordCount / 100);
  const fillerDensity = fillerCount / Math.max(1, wordCount / 100);
  let voice = 88 - passiveCount * 7 - clicheCount * 8 - adverbDensity * 4 - fillerDensity * 5;
  const voiceScore = clamp(voice);

  // Structure: paragraphing + sentence-length variety.
  const lengths = sentences.map((s) => words(s).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((a, b) => a + (b - mean) ** 2, 0) / lengths.length;
  const stdev = Math.sqrt(variance);
  let structure = 60;
  if (paragraphCount >= 3 && paragraphCount <= 7) structure += 20;
  else if (paragraphCount === 2) structure += 6;
  else if (paragraphCount === 1) structure -= 18; // wall of text
  else structure -= 6; // too fragmented
  structure += Math.min(stdev * 1.6, 18); // rhythm/variety
  if (sentenceCount < 5) structure -= 14;
  const structureScore = clamp(structure);

  // Concision: length discipline.
  const over = wordCount - targetWords;
  let concision = 84;
  if (wordCount < 250) concision -= (250 - wordCount) / 8; // too thin to evaluate
  if (over > 0) concision -= over / 6; // over the 650 ceiling
  if (avgSentence > 24) concision -= (avgSentence - 24) * 2.5;
  concision -= longCount * 4;
  const concisionScore = clamp(concision);

  const dimensions: Dimension[] = [
    {
      id: "hook",
      label: "Hook",
      score: hookScore,
      verdict: verdict(hookScore),
      explanation: weakOpener
        ? "Your opening line uses a cliché that admissions readers see thousands of times. Drop the reader into a specific moment."
        : firstWords.length <= 14
          ? "Punchy opening — it earns attention without throat-clearing."
          : "Solid opening. Make sure the very first line creates a question the reader needs answered.",
    },
    {
      id: "specificity",
      label: "Specificity",
      score: specScore,
      verdict: verdict(specScore),
      explanation:
        concreteSignals >= 6
          ? "Good use of concrete detail — names, numbers and particulars make the essay feel lived-in."
          : "Lean on concrete detail: names, places, numbers and sensory specifics. Vague abstractions blur into every other essay.",
    },
    {
      id: "voice",
      label: "Voice",
      score: voiceScore,
      verdict: verdict(voiceScore),
      explanation:
        passiveCount + clicheCount === 0
          ? "Active and direct — your voice comes through clearly."
          : `Tighten your voice: ${passiveCount} passive construction${passiveCount === 1 ? "" : "s"} and ${clicheCount} cliché${clicheCount === 1 ? "" : "s"} dilute it. Write in active, first-person verbs.`,
    },
    {
      id: "structure",
      label: "Structure",
      score: structureScore,
      verdict: verdict(structureScore),
      explanation:
        paragraphCount === 1
          ? "It's one block of text. Break it into 3–5 paragraphs with a clear arc: scene → reflection → meaning."
          : "Vary sentence length for rhythm and keep each paragraph to one idea so the arc is easy to follow.",
    },
    {
      id: "concision",
      label: "Concision",
      score: concisionScore,
      verdict: verdict(concisionScore),
      explanation:
        over > 0
          ? `You're ${over} words over the 650 ceiling. Cut the weakest paragraph and every sentence that doesn't move the story.`
          : wordCount < 250
            ? "Quite short — there may be room to develop the central moment with more specific detail."
            : "Good length discipline. Keep sentences varied and trim any line that merely restates the previous one.",
    },
  ];

  // Weighted overall.
  const overall = clamp(
    hookScore * 0.18 +
      specScore * 0.26 +
      voiceScore * 0.24 +
      structureScore * 0.16 +
      concisionScore * 0.16,
  );

  // ── Metrics row ───────────────────────────────────────────────
  const metrics: Metric[] = [
    {
      label: "Words",
      value: String(wordCount),
      hint: `Target ≤ ${targetWords}`,
      status: wordCount === 0 ? "bad" : wordCount > targetWords ? "warn" : wordCount < 250 ? "warn" : "good",
    },
    {
      label: "Sentences",
      value: String(sentenceCount),
      hint: `~${avgSentence.toFixed(0)} words each`,
      status: avgSentence > 26 ? "warn" : "good",
    },
    {
      label: "Paragraphs",
      value: String(paragraphCount),
      hint: "3–5 ideal",
      status: paragraphCount === 1 ? "bad" : paragraphCount > 7 ? "warn" : "good",
    },
    {
      label: "Vocabulary",
      value: `${Math.round(uniqueRatio * 100)}%`,
      hint: "unique words",
      status: uniqueRatio < 0.4 ? "warn" : "good",
    },
    {
      label: "Clichés",
      value: String(clicheCount),
      hint: "aim for 0",
      status: clicheCount === 0 ? "good" : clicheCount <= 2 ? "warn" : "bad",
    },
    {
      label: "Passive voice",
      value: String(passiveCount),
      hint: "prefer active",
      status: passiveCount === 0 ? "good" : passiveCount <= 2 ? "warn" : "bad",
    },
  ];

  // ── Strengths (positive reinforcement) ────────────────────────
  const strengths: string[] = [];
  if (!weakOpener && hookScore >= 72) strengths.push("Your opening avoids the usual clichés and reads with intent.");
  if (concreteSignals >= 6) strengths.push("You ground the essay in concrete, specific detail.");
  if (passiveCount === 0) strengths.push("Consistently active, first-person voice.");
  if (clicheCount === 0) strengths.push("No clichéd phrases detected — that already puts you ahead.");
  if (paragraphCount >= 3 && paragraphCount <= 6) strengths.push("Clear paragraph structure with a readable arc.");
  if (stdev >= 6) strengths.push("Nice rhythm — your sentence lengths vary naturally.");
  if (wordCount >= 400 && wordCount <= targetWords) strengths.push("Well within the word limit with room used wisely.");

  const summary =
    overall >= 80
      ? "Strong draft. Tighten the few flagged lines and this essay will stand out."
      : overall >= 60
        ? "A promising draft with a clear path to great. Focus on the lowest-scoring dimensions below."
        : overall >= 40
          ? "There's a real story here — now make it specific and active. Work through the flags one by one."
          : "Early draft. Start by fixing the opener and replacing abstraction with concrete moments.";

  return {
    empty: false,
    wordCount,
    sentenceCount,
    paragraphCount,
    avgSentence,
    uniqueRatio,
    overall,
    metrics,
    dimensions,
    flags,
    strengths,
    summary,
  };
}
