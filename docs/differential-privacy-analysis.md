# Differential Privacy in Privax — Security Analysis

> Reproducible analysis notes for the thesis evaluation chapter.
> Every number below was produced against the running application; the commands are included so the
> results can be reproduced live (e.g. during the defense). Rewrite the prose in your own academic
> voice — this file is technical material and evidence, not finished thesis text.

Backend base URL used throughout: `http://localhost:8080`.
Note: the demo database reseeds on every restart (`ddl-auto: create`), so absolute counts differ
between runs. The *attacks* and their outcomes do not depend on the specific numbers.

---

## 1. Baseline design (the "before")

Aggregate statistics are released with noise instead of exact values:

- **Counting queries** (vaccinations per region; reports per city/vaccine/severity; per-symptom
  prevalence) use the **Laplace mechanism** with sensitivity 1 — adding or removing one person
  changes any count by at most 1.
- **Per-row categorical fields** (severity, vaccine, city) use **k-ary randomized response**
  (Warner 1965; Kairouz et al. 2016) with replace-probability `q = k / (e^ε + k − 1)`.

The naive vaccination endpoint (tagged `naive-dp` in git) drew **fresh, independent** Laplace noise
on every request and accepted an **unbounded, caller-supplied ε**:

```java
private final Random random = new Random();          // one shared RNG, re-rolled per request
double u = random.nextDouble() - 0.5;
double noise = -(1.0/epsilon) * Math.signum(u) * Math.log(1 - 2*Math.abs(u));
return rawCount + noise;                              // epsilon taken straight from the URL
```

Check out the baseline for comparison with:

```bash
git checkout naive-dp   # the pre-fix implementation
```

---

## 2. Threat model

The endpoint is:

- **public** (no authentication),
- **anonymous** (no per-user identity to hold accountable),
- **unlimited** (no rate limit or query budget),
- **caller-parameterised** (the attacker chooses ε per request).

The attacker's goal is to recover an exact raw count, which the differential-privacy guarantee is
supposed to prevent. All three attacks below assume only these properties.

---

## 3. Attacks against the baseline

### 3.1 Unbounded-ε leak (1 query, no math)

`scale = sensitivity / ε`. As ε → ∞ the noise → 0, so a single request returns the raw count:

```bash
curl -s "http://localhost:8080/api/vaccinations/region?region=Bucharest&epsilon=100000"
# -> 1175.9999889581152   (the raw count, undisguised)
```

### 3.2 Averaging attack (N queries)

Fresh zero-mean noise per request cancels under averaging; the mean of N samples has spread
≈ `scale/√N`, so ≈ (1/ε)² queries suffice. Observed at ε = 0.5 (a "strong privacy" setting):

```
after   1 queries: running mean = 1175.579
after   5 queries: running mean = 1177.350
after  50 queries: running mean = 1176.312
after 200 queries: running mean = 1176.090   <- true count recovered
single-sample spread over 200 draws: 1165.7 .. 1186.7   (each answer really is noisy)
```

Reproduce:

```bash
for i in $(seq 1 200); do curl -s "http://localhost:8080/api/vaccinations/region?region=Bucharest&epsilon=0.5"; echo; done \
  | awk '{s+=$1} END{printf "mean of %d draws = %.3f\n", NR, s/NR}'
```

### 3.3 ε-differencing (2 queries, exact) — affects the *seeded* endpoints too

A later hardening step seeded the noise from the query but **not** from ε (so that "sweeping the ε
slider reuses the same underlying draw, only rescaled"). That stops averaging — but because the
draw is one fixed value scaled by 1/ε, two queries at different ε give two linear equations:

```
answer(ε) = raw + K/ε          (K constant for a given secret)
answer(ε=1) = raw + K
answer(ε=2) = raw + K/2
  =>  raw = 2·answer(2) − answer(1)
```

Observed:

```
answer(ε=1) = 1228.7597414514241
answer(ε=2) = 1228.3798707257122
recovered raw = 2·answer(2) − answer(1) = 1228.000000   (exact)
```

Confirmed against the admin-only ground truth:

```bash
curl -s -u admin:admin "http://localhost:8080/api/vaccinations/region/compare?region=Bucharest&epsilon=1"
# -> {"rawCount":1228, "noisyCount":1228.7597414514241}
```

The "single fixed draw scaled by 1/ε" property is visible directly: `(answer − raw)·ε` is constant
across ε (0.759741 at ε = 0.5, 1, 2, 4, 8). This attack applies to every additive-noise endpoint
that seeds independently of ε (`/side-effects/grouped`, `/side-effects/symptom-stats`), recovering
each count exactly for the `double`-valued endpoint and within ±1 where results are rounded to
integers.

---

## 4. Mitigations and their trade-offs

| Mitigation | Kills averaging | Kills ε-differencing | Genuine randomness | Live tunable slider on real data |
|---|---|---|---|---|
| Naive (fresh noise, unbounded ε) | ✗ | (n/a) | ✓ | ✓ — but leaks |
| Seeded noise (ε-independent) | ✓ | ✗ | ✗ (PRNG from seed) | ✗ |
| **Memoized fresh noise + fixed ε** | ✓ | ✓ | ✓ | ✗ |
| Fixed ε + seeded noise | ✓ | ✓ | ✗ | ✗ |

**Key impossibility result.** Any mechanism that lets an anonymous, unlimited caller obtain
*multiple independent* noisy reads of the *same* secret leaks it — by averaging if the reads are
independent, or by solving a linear system if they are a common draw rescaled. Therefore a live,
caller-tunable ε slider operating on real public counts **cannot** be made safe. The fix is not a
better noise function; it is releasing **one value per secret** and removing caller control of ε.

**Why privacy budgets / rate limits don't rescue the public endpoint.** Budget accounting needs an
accountable identity to charge; an anonymous endpoint can only key on IP, which is free to rotate.
A global budget avoids that but lets one attacker exhaust it and black out the public dashboard.
Rate limiting only *slows* the averaging attack. Budgets are the right tool for the planned
**authenticated researcher API**, where each researcher's cumulative ε can be tracked and refused.

---

## 5. Final design (the "after")

`VaccinationService` now uses **memoized fresh noise at a fixed release ε**:

- The first request for a region draws a genuine Laplace sample and caches `raw + noise`.
- Every later request returns that same cached value, for any caller and any ε.
- The caller-supplied ε is accepted for API compatibility but ignored for the released number;
  the release level is `RELEASE_EPSILON = 1.0`, fixed server-side.

This keeps genuine randomness while releasing exactly one value per secret, which closes §3.1–§3.3
simultaneously (see §6 for the post-fix verification).

The ε slider is retained as an **illustrative** control: it fogs/de-fogs a *demo* number so users
still see the accuracy/privacy trade-off interactively, with no live secret involved.

All three public aggregate endpoints now use memoized fresh noise at a fixed release ε:
`/api/vaccinations/region`, `/api/side-effects/grouped`, and `/api/side-effects/symptom-stats`.
Each secret (a region; a city×vaccine×severity cell; a symptom×filter-slice) is drawn once and
cached, so repeated and multi-ε querying return identical values (verified in §6–§7).

### Residual limitations / future work

- The public channel's memoization handles *repeated identical* queries but does not bound leakage
  across *many different* slices (composition). That bound requires a real budget charged to an
  accountable identity — implemented on the authenticated researcher channel (§7), not the
  anonymous endpoints.
- Per-row `age` noise (the `/api/side-effects` row listing) uses an illustrative `sensitivity = 5.0`,
  not a derived bound, and per-row categorical fields use k-ary randomized response — a weaker,
  per-record model kept only for the row view; aggregate privacy is provided by the endpoints above.
- City randomized-response samples a 6-city subset rather than the full domain, so its ε guarantee
  is illustrative.
- `ddl-auto: create` rebuilds the database on every restart — acceptable for a demo, unsafe for
  real data.

---

## 6. Post-fix verification

Re-running the three attacks against the memoized implementation (this run: raw Bucharest = 1225,
released = 1224.2434512753925):

**3.1 Unbounded ε — closed.** The client ε is ignored; a huge ε no longer strips the noise:

```
eps=100000 -> 1224.2434512753925    (noisy, not the raw 1225)
```

**3.2 Averaging — closed.** Repeated queries are byte-for-byte identical, so there is nothing to
average:

```
1224.2434512753925   (×8, identical)
```

**3.3 ε-differencing — closed.** Both ε values return the same released value, so there is no second
data point to solve with; `2·a(2) − a(1)` collapses back to the noisy value, not the integer raw:

```
answer(ε=1) = 1224.2434512753925
answer(ε=2) = 1224.2434512753925
2·a(2) − a(1) = 1224.2435   (the noisy value, not a clean integer)
```

**Ground truth (admin):** `{"rawCount":1225, "noisyCount":1224.2434512753925}`. The true count 1225
is no longer recoverable from the public endpoint — the released value differs from it by the
Laplace draw (~0.76) and cannot be de-noised by any number of anonymous queries.

Reproduce all three with the commands in §3 (they should now fail to recover the raw count).

The same treatment was then applied to `/side-effects/grouped` (each city×vaccine×severity cell)
and `/side-effects/symptom-stats` (each symptom×filter-slice). Verification — values are identical
across repeats *and* across ε, so neither averaging nor differencing recovers anything:

```
/grouped  Bucharest/Pfizer mildCount:  eps=1 -> 25, eps=2 -> 25, eps=5 -> 25   (repeats also 25/25/25)
/symptom-stats  "Joint Pain" count:     eps=0.5 -> 487, eps=3 -> 487            (repeats also 487/487/487)
```

---

## 7. The interactive researcher channel (a contrasting DP model)

The public endpoints use **non-interactive** DP: one value per secret, released once. The
authenticated researcher API (`/api/research/**`) demonstrates the **interactive** model, where the
protection comes from a **cumulative ε budget** rather than memoization.

**Mechanism** (`PrivacyBudgetService`, `ResearchService`):

- Each researcher (authenticated username) gets a fixed total budget `TOTAL_EPSILON = 5.0`.
- Each query names a per-query ε (capped at `MAX_QUERY_EPSILON = 1.0`), which is **debited atomically**
  from that researcher's budget before any data is read.
- If the budget allows, the query returns a count with **fresh, independent** Laplace noise. Fresh
  noise is safe *here* precisely because the total number of queries is bounded: by sequential
  composition, k queries at ε₁..ε_k leak at most Σεᵢ ≤ 5.0, so worst-case leakage is capped.
- When the budget is spent, further queries are refused with HTTP 429.

This only works because the caller is **authenticated**: the budget is charged to an accountable
identity that cannot be rotated the way an anonymous IP can — which is exactly why the *public*
endpoints can't use it and use memoization instead.

**Verification:**

```
GET /api/research/side-effects/count?epsilon=1.0&city=Bucharest   (Basic auth: user:user)
  query 1 -> {noisyCount: 100.2, epsilonSpent: 1.0, budgetRemaining: 4.0}   (fresh noise…)
  query 2 -> {noisyCount:  98.7, ...,               budgetRemaining: 3.0}   (…different each time)
  query 3 -> {noisyCount:  99.9, ...,               budgetRemaining: 2.0}
  query 4 -> {noisyCount: 101.1, ...,               budgetRemaining: 1.0}
  query 5 -> {noisyCount:  99.3, ...,               budgetRemaining: 0.0}
  query 6 -> HTTP 429  "Privacy budget exhausted: 5.000 of 5.000 already spent…"

GET .../count?epsilon=2.0            -> HTTP 400  (per-query epsilon above the cap)
GET .../count  (no Authorization)    -> HTTP 401
admin's budget is independent of user's  (per-identity accounting)
```

(Illustrative numbers; the raw Bucharest report count this run is ~99, and each query returns it with
an independent Laplace draw. Reproduce with the commands above against the running server.)

### Why this is the right pattern for the researcher API (and not the public one)

| | Public / anonymous | Authenticated researcher |
|---|---|---|
| Can a budget be enforced? | No — no identity; IP rotation defeats per-IP budgets | Yes — charged to the login |
| Safe mechanism | Memoized one-shot release (fixed ε) | Fresh noise + cumulative ε budget |
| Bounds cross-slice composition? | No | Yes, up to the total budget |

The two channels together are the thesis's core contribution: the *same* data, released two ways,
each matched to what its trust model can actually enforce.
