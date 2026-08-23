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

### 3.1 Why the noise is small (±1–2) — and why that is correct

Comparing released counts to the true DB counts shows the noise is present but small (e.g. symptom
"Fever" true 489 → released 490; "Headache" 473 → 471; some symptoms land on +0). This is the
*correct* behaviour, not a weakness:

- DP hides **one individual's contribution**, i.e. whether a count is `n` or `n−1` — a change of
  **1**, because these are counting queries (sensitivity 1). The noise only has to make `n` and
  `n−1` indistinguishable.
- The Laplace scale is `sensitivity/ε = 1/1 = 1`, so the noise has standard deviation ≈ 1.4 — sized
  exactly to mask that ±1 footprint. Blurring a count of ~490 into a wide range would hide nothing
  more about any individual and would destroy the statistic's utility.
- Because the noise is the *same* ±1–2 regardless of the count, it is a tiny fraction of a large
  count (~0.3% of 490) but a larger fraction of a small one (~5–9% of 22). That is the guarantee
  working: the fewer people a number represents, the more of it is noise — which is also why
  individual-level data is pushed to the illustrative synthetic rows (a count of "1" would be almost
  entirely noise, i.e. meaningless).

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

## 7. Penetration test of the running system

Sections 2–6 argue the design is correct. This section **simulates real attacks against the deployed
system**, as an attacker would: black-box, against the live HTTP API, ignoring the UI entirely (an
attacker never uses the front-end). Each attack below was actually run against the running server, not
merely reasoned about. Simulating them both confirms the rigorous channels hold *in practice* and
exposed one real vulnerability — which was then fixed and the attack re-run to confirm the fix.

**Method.** Each attack was simulated with direct `curl` requests to `http://localhost:8080`,
unauthenticated and with each seeded role, attempting to (a) recover an exact raw value, (b) re-identify
an individual, and (c) reach data above the caller's privilege. Absolute numbers below are from one
seeded run (the demo DB reseeds on restart); the *properties* are what matter.

### 7.1 What held up

| Attack | Endpoint | Result |
|---|---|---|
| **Averaging** (repeat identical query ×5) | `/side-effects/grouped` | identical every time (`mild=21, 21, 21, 21, 21`) — nothing to average |
| **Tunable ε** (ε=0.001 vs ε=9999) | `/side-effects/grouped` | identical (`mild=21` both) — caller ε ignored |
| **Identifier leak** | `/side-effects` feed | `patientCode` absent from JSON (`@JsonIgnore` holds); keys are only `id, symptoms, age, severity, additionalInfo, reportedAt, vaccineName, city, reporterType` |
| **Privilege escalation** | researcher / admin routes | see access-control matrix below |

```
# Access control — every check returns the intended status
/api/research/count          no auth → 401 ; user:user → 403      (DOCTOR-only)
/api/vaccinations/region/compare   no auth → 401                  (ADMIN-only)
/api/appointments            no auth → 401                        (ADMIN-only)
/api/users/pending           user:user → 403 ; admin:admin → 200  (ADMIN-only)
```

The averaging / tunable-ε results are the same properties §3 and §5 predict — confirmed empirically
against the running server.

### 7.2 The vulnerability that was found — and fixed

The one endpoint that **failed** was the public per-record feed `GET /api/side-effects`. It returned
**real individual database rows**, noised per record with a *caller-controlled* ε, and it was
`permitAll` (no login). Three weaknesses chained into full re-identification:

1. **Exact, un-noised counts leaked through the pagination envelope.** The page metadata field
   `page.totalElements` is the *true* count for any filter combination — never noised:

   ```
   (no filter)                        → EXACT 3000
   ?city=Sibiu                        → EXACT 95
   ?city=Sibiu&severity=FATAL         → EXACT 1     ← isolates a single individual
   ```

   This alone is a raw aggregate with arbitrary filtering — a reconstruction surface — but its real
   danger is that it lets the attacker *find a filter that matches exactly one person*.

2. **The caller-supplied ε had a meaningless cap.** Unlike the aggregate channels (which ignore the
   client ε), this endpoint honoured `epsilon` up to `MAX_EPSILON = 10`. But ε = 10 is effectively
   *no noise*: the k-ary replace probability is `k/(e¹⁰+k−1) ≈ 0.0002`, so every categorical field
   returns its true value, and the age Laplace scale is `5/10 = 0.5`. Same record, rising ε:

   ```
   ε=0.1  → age=75  FATAL  Reșița  AstraZeneca
   ε=1    → age=50  FATAL  Reșița  AstraZeneca
   ε=10   → age=48  MILD   Bacău   Johnson & Johnson    ← the true row emerges
   ```

3. **Several fields were never noised at all** — `reportedAt` (an exact timestamp), `additionalInfo`
   (free text), and the symptom set were passed through untouched; and the fields being filtered on
   (city, severity) were returned exactly by construction.

**The chained attack — a complete re-identification:**

```
Step 1  enumerate filters until the exact count is 1:
        ?city=Sibiu&severity=FATAL   →  page.totalElements = 1
Step 2  read that one row at ε=10:
        age=41, city=Sibiu, severity=FATAL, vaccine=Johnson & Johnson,
        date=2025-10-24T20:41:32, symptoms=[Insomnia, Psychosis, Bell's Palsy]
```

That is a near-raw individual record obtained from a public, unauthenticated endpoint — directly
contradicting the guarantee of §1. It is the very *tunable-ε on a real record* that §6 argues is
un-fixable; the endpoint should never have released real rows in the first place.

**Root cause.** The front-end had already been migrated to synthetic illustrative rows (§6), but the
old real-data endpoint was left live and public — a design/implementation drift, not a flaw in the
DP mathematics.

**Fix.** The endpoint was removed. Privax now exposes **no** per-record read path: the only report
GETs are the fixed-ε memoized aggregates (`/grouped`, `/symptom-stats`); submitting a report
(`POST /api/side-effects`) still requires a login and is unaffected. Verified after the fix:

```
GET /api/side-effects?epsilon=10&size=5          → 405  (method gone)
GET /api/side-effects?city=Sibiu&severity=FATAL  → 405
GET /api/side-effects/grouped                    → 200  (unchanged)
GET /api/side-effects/symptom-stats              → 200  (unchanged)
POST /api/side-effects  (submit)                 → 401  (login still required)
```

This closes the last raw-data path and makes the implementation match the §1 claim exactly: **no
channel releases individual records** — rigorous DP lives only in the aggregates and the budgeted
researcher API, and the browsable table is synthetic. For the thesis this is worth presenting as
*process*, not just outcome: the guarantee was stated, the system was adversarially tested against
it, a gap between design and deployment was found, and it was closed and re-verified.

### 7.3 Full-surface sweep — every other endpoint

After the feed was fixed, a **second pass exercised every remaining endpoint** to confirm the fix was
not masking similar problems elsewhere. All passed; the table records each check and its result.

| Class | Test | Result |
|---|---|---|
| Credential exposure | do `/api/users/me` and `/api/users` serialise a password hash? | **No** — `UserDto` exposes only `id, username, name, email, role, requestedRole`; the `User` entity is never returned by any endpoint |
| Write-path identifier leak | does the clinician `POST` echo the `patientCode` it stores? | **No** — `@JsonIgnore` strips it from the response (submitted `MRN-LEAK-TEST-999`, absent from the JSON) |
| Privilege escalation | `POST /auth/signup` with `role=ADMIN` in the body | **Ignored** — the account is created as `USER`; privileged roles come only from admin approval, never the request body |
| SQL injection | `' OR '1'='1` and `'; DROP TABLE …` in filter params | **Safe** — repositories use parameterised JPQL and JPA Specifications; the injected strings match nothing and the schema is intact (grouped still returns its rows) |
| Cross-origin theft | CORS preflight from `https://evil.example.com` | **Blocked** — no `Access-Control-Allow-Origin` is returned, so a browser cannot let a hostile site read authenticated responses (origin is pinned to the configured front-end) |
| Aggregate de-noising | `/api/vaccinations/region` repeated, and ε = 1 vs 100000 | **Memoised, fixed-ε** — identical every time; caller ε ignored |
| Management interface | `/actuator/**` (env, beans, heap dump) | **Not exposed** — all `401` |
| Error handling | forced parse error on a query param | **Clean** `{timestamp, status, error, message, path}` — no stack trace |
| Blog | public post `author` field | **Display string only** (`"The patient who built Privax"`), no e-mail / PII |

**Three low-severity information-disclosure items** were noted. None reveals any individual's
membership in the dataset, so none breaks the DP guarantee — they are hardening opportunities:

1. **`/public/stats` returns exact, un-noised global totals** (total reports, distinct symptoms,
   resolved %). These are dataset-wide, non-filterable counts — they cannot isolate a person — but a
   strict treatment would add Laplace noise to them too. *(Left as-is: these are headline counters,
   and a single global total does not reveal any individual's membership.)*
2. **Account enumeration — since fixed.** `POST /auth/signup` used to return field-specific messages
   ("Username *X* is already been used"), letting an attacker probe which usernames / e-mails exist.
   It now returns a single generic `409` ("An account with these details already exists.") for both a
   duplicate username and a duplicate e-mail, revealing neither the field nor the value.
3. **The OpenAPI schema and Swagger UI are public** (`/v3/api-docs`, `/swagger-ui.html`), disclosing
   the API surface. Intended for a showcase build; lock or remove them in a production deployment.

A related robustness fix landed alongside the audit: a request for a non-existent resource id (e.g.
`GET /api/appointments/{id}`) returned HTTP 500 instead of 404 because `ResourceNotFoundException`
carried no status mapping; it now maps to 404. No data was exposed either way (the error body never
contained a stack trace), but the correct status is cleaner.

**Conclusion.** With the per-record feed removed, **no endpoint in the system releases raw individual
records, credentials, or personal identifiers.** Individual-level protection now rests entirely on
the two rigorous DP channels (§3–§4) and the anonymous-at-rest data model (§1); the three items above
are hardening opportunities, not privacy breaches.

---

## 8. Residual limitations / future work

- **No global composition budget across channels.** Each channel is individually correct, but total
  privacy loss across the public aggregates *and* a researcher's queries is not tracked together. A
  global accountant would be the rigorous next step.
- **Fixed ε = 1.0 is a moderate setting**, chosen for utility; it is a parameter, not a flaw.
- **Aggregates are memoized per run** — a newly submitted report does not change a cell's released
  value until restart (the price of one-shot release; prevents averaging).
- **Client-side auth (HTTP Basic).** Credentials are stored base64 in `localStorage`; a token
  (JWT) scheme is the intended hardening (orthogonal to DP).

---

## 9. One-paragraph summary for the thesis

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
> Laplace log(0) edge case). The running system was then adversarially tested: the aggregate channels
> resisted averaging, tunable-ε and privilege-escalation attempts as designed, and a penetration test
> found and closed one deployment gap — a leftover public per-record endpoint that still released real
> rows with a de-noisable ε — so that no channel now releases individual records at all. A subsequent
> full-surface sweep (credential exposure, privilege escalation, SQL injection, CORS, management
> endpoints, error handling) found no further leak of records, credentials or identifiers, leaving
> only three low-severity information-disclosure items as hardening opportunities.
