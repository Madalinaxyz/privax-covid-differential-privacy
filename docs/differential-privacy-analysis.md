# Differential Privacy in Privax — Complete Analysis

> Thesis reference. Every claim below was verified against the running system; the commands to
> reproduce each result are included. Rewrite the prose in your own academic voice — this file is
> the technical evidence, not finished thesis text. All absolute counts come from the demo database,
> which reseeds on every restart, so exact numbers differ between runs; the *properties* do not.

---

## 1. What Privax protects, and how

Privax collects anonymous post-vaccination reports and publishes statistics about them. The privacy
goal is the standard differential-privacy one: **an observer must not be able to determine whether
any single individual is in the dataset**, no matter what side information they hold or how many
queries they make.

Reports are also **unlinked** — a report carries no reference to the account that submitted it
(login is used only for access control, never stored on the report), so the data is anonymous at
rest independently of the DP layer.

Privacy is delivered through **three release channels**, each matched to what its trust model can
actually enforce:

| Channel | What it releases | Mechanism | Guarantee |
|---|---|---|---|
| **Public aggregates** — map, symptom prevalence, region counts | counts over many people | Laplace, **fixed ε**, memoized | **Rigorous ε-DP** |
| **Researcher API** (`/api/research`, DOCTOR-only) | counts, interactively | Laplace, **fresh noise + ε-budget** | **Rigorous ε-DP** (bounded by the budget) |
| **Illustrative row table** (View Reports) | example individual rows | Laplace + randomized response on **synthetic** data | **None claimed** — a teaching view |

The first two are the rigorous guarantees. The third is deliberately *not* a privacy claim (see §6).

---

## 2. The mechanisms (the math)

### 2.1 Laplace mechanism — for counting queries

For a query `f` with sensitivity `Δf`, releasing `f(D) + Laplace(0, Δf/ε)` satisfies ε-DP.

- **Sensitivity.** Every count in Privax is a counting query, so `Δf = 1`: adding or removing one
  person changes any count by at most 1. The code uses `scale = 1/ε` accordingly.
- **Sampling.** The noise is drawn by inverse transform: for `u ~ Uniform(−0.5, 0.5)`,
  `X = −scale·sgn(u)·ln(1 − 2|u|)` is exactly `Laplace(0, scale)`. This is textbook-correct.
- **Edge case (fixed).** `u` was computed as `nextDouble() − 0.5`, so a `nextDouble()` of exactly 0
  gave `u = −0.5 → ln(0) → infinite noise`. The draw is now guarded so the log argument stays
  positive. Applied to all four Laplace samplers.

### 2.2 k-ary randomized response — for categorical fields

For a categorical field with `k` possible values, the mechanism keeps the true value with
probability `p` and otherwise outputs a uniformly random value; choosing the replace-probability

```
q = k / (e^ε + k − 1)
```

makes `P(keep true) = e^ε/(e^ε+k−1)` and `P(any specific other) = 1/(e^ε+k−1)`, so the ratio of
output probabilities is exactly `e^ε` — i.e. ε-DP for that field (Warner 1965; Kairouz et al. 2016).
The implementation of `replaceProbability` and the "uniform over all k (including the true value)"
replacement match this derivation.

- **Domain (fixed).** The replacement set must equal the whole domain for the guarantee to hold.
  The `city` field previously drew from a 6-city subset while the real domain has 29 — so a city
  outside the six could only ever appear as its true value, breaking ε-DP for it. It now uses the
  full 29-city domain.

### 2.3 Composition

Answering queries with parameters `ε₁ … ε_k` on the same data leaks at most `Σεᵢ` (sequential
composition). This is the basis of the researcher budget (§4).

### 2.4 Post-processing

Clamping counts to `≥ 0` and rounding are post-processing of a DP output, which cannot weaken the
guarantee (post-processing immunity).

**Verdict:** the Laplace sampler, the sensitivity, the randomized-response formula, the full-domain
replacement, and the composition are all mathematically correct.

---

## 3. Channel 1 — Public aggregates (rigorous)

The map (`/api/side-effects/grouped`), symptom prevalence (`/api/side-effects/symptom-stats`), and
vaccination counts (`/api/vaccinations/region`) release **counts** with Laplace noise at a **fixed,
server-side ε (= 1.0)**. The noise for each secret is drawn **once and memoized**, so the same secret
always returns the same value. The caller-supplied `epsilon` parameter is accepted for compatibility
but ignored.

Why fixed + memoized: an *anonymous* endpoint cannot enforce a budget (there is no accountable
identity — IPs rotate freely), so any *tunable* ε on a real secret leaks (see §5). Fixing ε and
releasing once removes both levers.

**Verified live:**

```
# (a) repeat the same query 3x → identical (nothing to average away)
grouped Bucharest/Pfizer mildCount: 21, 21, 21

# (b) vary the client ε 0.1 vs 10 → identical (client ε ignored, fixed release)
eps=0.1 -> 21   ;   eps=10 -> 21
symptom "Joint Pain": eps=0.5 -> 497 ; eps=5.0 -> 497

# (c) a huge ε cannot strip the noise
region Bucharest: eps=1 -> 1249.599 ; eps=100000 -> 1249.599
admin /compare  -> {"rawCount":1250, "noisyCount":1249.599}   # raw 1250 NOT recoverable publicly
```

Reproduce: `curl "http://localhost:8080/api/side-effects/grouped?epsilon=<x>"` etc.

The raw count (1250) differs from the released value by the Laplace draw and cannot be recovered from
the public endpoint by any number of queries or ε settings.

---

## 4. Channel 2 — Researcher API (rigorous, interactive)

`/api/research/side-effects/count` is the **interactive** model, gated to the **DOCTOR** authority
(granted only by admin approval — never self-registered — so the identity cannot be freely minted).
It contrasts with Channel 1: instead of one memoized value, each researcher gets a **cumulative ε
budget** and every query returns **fresh independent** Laplace noise.

- `TOTAL_EPSILON = 5.0` per researcher; `MAX_QUERY_EPSILON = 1.0` per query.
- Each query debits its ε atomically **before** reading data; by sequential composition the total
  leakage to one researcher is ≤ 5.0.
- Fresh noise is safe *here* precisely because the budget bounds the number of samples an accountable
  identity can obtain.

**Verified live:**

```
starting budget: 5.0 / 5.0
5 queries @ ε=1.0 → noisyCount 120.9, 124.9, 123.8, 125.7, 122.6  (fresh each time)
               → budgetRemaining 4.0, 3.0, 2.0, 1.0, 0.0
6th query        → HTTP 429  "Privacy budget exhausted … until the budget resets."
ε=2.0            → HTTP 400  (over the per-query cap)
no auth          → 401 ; plain USER → 403   (DOCTOR-only)
```

Reproduce: `curl -u doctor:doctor "http://localhost:8080/api/research/side-effects/count?epsilon=1.0&city=Bucharest"`.

---

## 5. Threat model and the attacks that are closed

**Threat model:** an anonymous, unlimited, adaptive attacker who chooses query parameters and wants
to recover an exact raw value that the DP layer is supposed to hide.

Three attacks were demonstrated against an earlier *tunable-ε* design and are now closed on the
rigorous channels:

1. **Unbounded ε.** `scale = 1/ε → 0` as `ε → ∞`, so one query at a huge ε returned the raw count.
   *Closed:* public ε is fixed server-side; the researcher ε is capped at 1.0.
2. **Averaging.** Fresh independent noise per query averages to zero; ≈ (1/ε)² queries recover the
   truth. *Closed on the public channel:* the value is memoized, so repeats are identical (nothing to
   average). *Bounded on the researcher channel:* the budget caps the number of samples.
3. **ε-differencing.** With ε-independent seeding, the noise is one draw rescaled by 1/ε, so two
   queries at different ε give two linear equations that solve for the raw value. *Closed:* the public
   channel fixes ε (no second point); the researcher channel draws fresh independent noise under a
   budget.

Each of §3 and §4's "identical across ε / repeats" results is the direct evidence these are closed.

---

## 6. Channel 3 — the illustrative row table (honest scoping)

The **View Reports** table shows individual example rows with a working ε slider. This is **not** a
private release of real records, and does not claim to be — for a fundamental reason:

> **An individual, high-dimensional record cannot be released with a meaningful DP guarantee.** A row
> is age + city + vaccine + severity + a *set* of symptoms + free text. To hide the person you must
> scramble so many fields that the row becomes meaningless (the *curse of dimensionality*); and any
> tunable ε on a real record is de-noisable (attacks §5). No noise setting fixes this.

The honest response, and the one Privax takes:

- **The rows are synthetic.** They are generated client-side to *mirror the real distribution*
  (severity ~80/14/5/1, symptom prevalence, symptom↔severity consistency, the full 29-city domain,
  vaccines, ages), so the table looks and behaves like the real data.
- **The slider applies real DP noise to these synthetic rows, live** — Laplace on age, k-ary
  randomized response on severity / vaccine / city / each symptom. Because the underlying "truth" is
  synthetic, dialing ε to the sharp end reveals nothing about any real person.
- **The table is labelled illustrative**, and points users to the Map / Symptom-prevalence views for
  the real, privately-released numbers.

This is a *strength* to state plainly in the thesis: rigorous DP is applied where it is achievable
(aggregates + budgeted researcher API); per-record release is explicitly illustrative because
per-record DP is infeasible. The symptom column even *demonstrates* the curse of dimensionality — at
low ε almost every symptom flips, which is exactly why real symptom privacy is delivered by the
aggregate prevalence chart, not per row.

---

## 7. Residual limitations / future work

- **No global composition budget across channels.** Each channel is individually correct, but total
  privacy loss across the public aggregates *and* a researcher's queries is not tracked together. A
  global accountant would be the rigorous next step.
- **Fixed ε = 1.0 is a moderate setting**, chosen for utility; it is a parameter, not a flaw.
- **Aggregates are memoized per run** — a newly submitted report does not change a cell's released
  value until restart (the price of one-shot release; prevents averaging).
- **Client-side auth (HTTP Basic).** Credentials are stored base64 in `localStorage`; a token
  (JWT) scheme is the intended hardening (orthogonal to DP).

---

## 8. One-paragraph summary for the thesis

> Privax applies differential privacy through two rigorous channels and one illustrative one. Public
> aggregates (map, symptom prevalence, region counts) are released with the Laplace mechanism at a
> fixed, server-chosen ε and memoized per secret, so — as verified — they are identical across
> repeated queries and across any caller-supplied ε, defeating the averaging, unbounded-ε and
> ε-differencing attacks. An authenticated, admin-approved researcher API answers interactive count
> queries with fresh Laplace noise against a per-researcher cumulative-ε budget (5.0 total, 1.0 per
> query), enforced with HTTP 429/400, which bounds total leakage by sequential composition. The
> browsable individual-record table is explicitly illustrative: because a high-dimensional individual
> record cannot be released with a meaningful DP guarantee, its rows are synthetic data that mirror
> the real distribution, over which the ε slider demonstrates the privacy/accuracy trade-off live
> without exposing anyone. The underlying mechanisms — Laplace inverse-transform sampling with
> sensitivity 1, k-ary randomized response with `q = k/(e^ε+k−1)` over the full value domain, and
> sequential composition — were reviewed and corrected for two defects (a subset city domain and a
> Laplace log(0) edge case).
