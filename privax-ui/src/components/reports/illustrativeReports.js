// Illustrative (synthetic) side-effect reports for the View Reports table.
//
// These are NOT real submissions. They are generated to mirror the real data's
// distribution (severity mix, symptom prevalence, cities, vaccines, ages, and
// symptom↔severity consistency) so the epsilon slider can demonstrate the
// differential-privacy trade-off LIVE, with nothing real behind it to expose.
// All noise is applied client-side on this synthetic data — a browsable table of
// individual records cannot be released with a meaningful DP guarantee (curse of
// dimensionality), so the rigorous guarantees live in the aggregate views and the
// budgeted researcher API instead.

import { cityCoordinates } from "../misc/Helpers";

const VACCINES = ["Pfizer", "Moderna", "AstraZeneca", "Johnson & Johnson"];
const CITIES = Object.keys(cityCoordinates);
const SEVERITIES = ["MILD", "MODERATE", "SEVERE", "FATAL"];

// Symptom tiers mirror the backend seeder, so a MILD row never shows a severe symptom.
const MILD_SYMPTOMS = [
  "Fever", "Fatigue", "Headache", "Muscle Pain", "Chills", "Nausea",
  "Dizziness", "Joint Pain", "Injection Site Pain", "Swollen Lymph Nodes", "Rash",
];
const MODERATE_SYMPTOMS = [
  "Vomiting", "Brain Fog", "Insomnia", "Anxiety", "Heart Palpitations",
  "Chest Pain", "Shortness of Breath", "Numbness / Tingling", "Tinnitus",
];
const SEVERE_SYMPTOMS = [
  "Myocarditis", "Anaphylaxis", "Guillain-Barré Syndrome", "Bell's Palsy",
  "Blood Clots", "Seizures", "Encephalitis", "Psychosis",
  "Transverse Myelitis", "Immune Thrombocytopenia", "POTS", "Paralysis",
];

const NOTES = {
  MILD: ["Symptoms resolved within 48 hours.", "Felt better after rest.", "Mild discomfort, no medical attention needed.", "Resolved after 3-4 days.", ""],
  MODERATE: ["Sought medical advice but no hospitalization.", "Symptoms persisted for about a week.", "Improved with over-the-counter medication.", ""],
  SEVERE: ["Hospitalized for observation.", "Required emergency room visit.", "Long-term follow-up scheduled.", ""],
  FATAL: ["Patient had significant pre-existing conditions.", "Report submitted by family member.", ""],
};

// Deterministic PRNG so the dataset and the per-row noise are stable across renders.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function allowedSymptoms(severity) {
  let pool = [...MILD_SYMPTOMS];
  if (severity === "MODERATE" || severity === "SEVERE" || severity === "FATAL") pool = pool.concat(MODERATE_SYMPTOMS);
  if (severity === "SEVERE" || severity === "FATAL") pool = pool.concat(SEVERE_SYMPTOMS);
  return pool;
}

function weightedSeverity(r) {
  const x = r();
  if (x < 0.80) return "MILD";      // ~80%
  if (x < 0.94) return "MODERATE";  // ~14%
  if (x < 0.99) return "SEVERE";    // ~5%
  return "FATAL";                   // ~1%
}

function pickSymptoms(severity, r) {
  const pool = allowedSymptoms(severity);
  const n = 1 + Math.floor(r() * 3); // 1–3
  const set = new Set();
  for (let i = 0; i < n; i++) set.add(pool[Math.floor(r() * pool.length)]);
  return [...set];
}

/** Build a fixed illustrative dataset (deterministic — same every load). */
export function generateIllustrativeReports(n = 240) {
  const r = mulberry32(987654321);
  const now = Date.now();
  const threeYears = 3 * 365 * 24 * 3600 * 1000;
  const rows = [];
  for (let i = 0; i < n; i++) {
    const severity = weightedSeverity(r);
    rows.push({
      id: i + 1,
      severity,
      symptoms: pickSymptoms(severity, r),
      age: 16 + Math.floor(r() * 85),
      vaccineName: VACCINES[Math.floor(r() * VACCINES.length)],
      city: CITIES[Math.floor(r() * CITIES.length)],
      reportedAt: new Date(now - Math.floor(r() * threeYears)).toISOString(),
      additionalInfo: NOTES[severity][Math.floor(r() * NOTES[severity].length)],
    });
  }
  return rows;
}

/* ── Differential-privacy noise, applied client-side on the synthetic rows ── */

// A per-(row, field) RNG whose draw is INDEPENDENT of epsilon, so moving the slider
// smoothly rescales the same underlying noise instead of re-randomising each tick.
function seededRandom(id, field) {
  let h = 2166136261;
  const s = `${id}|${field}`;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return mulberry32(h >>> 0);
}

// Laplace via inverse transform; guard the log argument so it can't blow up.
function laplace(scale, r) {
  let u = r();
  if (u === 0) u = Number.MIN_VALUE;
  u -= 0.5;
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

// k-ary randomized response: replace with prob k/(e^ε + k − 1), else keep the truth.
function replaceProbability(epsilon, k) { return k / (Math.exp(epsilon) + k - 1); }

function randomize(original, domain, epsilon, r) {
  return r() < replaceProbability(epsilon, domain.length)
    ? domain[Math.floor(r() * domain.length)]
    : original;
}

function symptomsWithinSeverity(symptoms, severity) {
  const allowed = new Set(allowedSymptoms(severity));
  return (symptoms || []).filter((s) => allowed.has(s));
}

/** Return a copy of a synthetic row with epsilon-DP noise applied (safe: data is synthetic). */
export function noiseReport(row, epsilon) {
  const severity = randomize(row.severity, SEVERITIES, epsilon, seededRandom(row.id, "severity"));
  return {
    ...row,
    age: Math.max(0, Math.min(120, Math.round(row.age + laplace(5 / epsilon, seededRandom(row.id, "age"))))),
    severity,
    vaccineName: randomize(row.vaccineName, VACCINES, epsilon, seededRandom(row.id, "vaccine")),
    city: randomize(row.city, CITIES, epsilon, seededRandom(row.id, "city")),
    // symptoms stay consistent with the displayed (noised) severity
    symptoms: symptomsWithinSeverity(row.symptoms, severity),
  };
}
