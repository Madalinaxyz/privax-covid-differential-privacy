# Differential Privacy — Mechanism Verification

> Standalone verification record. Dated **2026-08-22**, run against the live system. This document
> shows that the differential-privacy mechanisms are (a) **mathematically correct** — the exact
> formulas used in the code provably satisfy ε-differential privacy — and (b) **working in practice**
> — the running system applies the noise correctly and resists de-noising. Absolute counts come from
> the demo database, which reseeds on restart, so exact numbers differ between runs; the *properties*
> do not. See `differential-privacy-analysis.md` for the full design and threat model.

---

## 1. What was verified

Two mechanisms carry the guarantee in Privax:

- the **Laplace mechanism** for counting queries (`releasedCount` = `raw + Laplace(1/ε)`, sensitivity 1);
- **k-ary randomized response** for categorical fields (replace-probability `q = k/(e^ε + k − 1)`).

The verification has two parts: an **analytical/statistical** check that the exact formulas satisfy
ε-DP, and an **empirical** check that the deployed endpoints behave accordingly.

---

## 2. Analytical validation (the formulas the code uses)

The exact formulas from the Java implementation were re-implemented and checked statistically
(2,000,000 samples where sampling was involved).

### 2.1 The Laplace sampler is a true Laplace(0, scale)

`X = −scale · sgn(u) · ln(1 − 2|u|)`, with `u ~ Uniform(−0.5, 0.5)` and the `log(0)` edge case guarded.

| scale | mean (expect 0) | variance (expect 2·scale²) | std (expect √2·scale) |
|---|---|---|---|
| 1 | −0.000 | 2.00 (exp. 2) | 1.413 (exp. 1.414) |
| 10 | 0.008 | 200.04 (exp. 200) | 14.144 (exp. 14.142) |

The sampler reproduces the Laplace distribution exactly.

### 2.2 The Laplace mechanism satisfies ε-DP

For counting queries (sensitivity 1, scale = 1/ε) on two neighbouring datasets that differ by one
person, the ratio of output densities is bounded by `e^ε`. The worst-case ratio was computed
analytically and confirmed empirically as the maximum observed over sampled outputs:

| ε | e^ε | analytic max density ratio | empirical max observed | verdict |
|---|---|---|---|---|
| 0.5 | 1.6487 | 1.6487 | 1.6487 | ✅ ≤ e^ε |
| 1.0 | 2.7183 | 2.7183 | 2.7183 | ✅ ≤ e^ε |
| 2.0 | 7.3891 | 7.3891 | 7.3891 | ✅ ≤ e^ε |

The ratio meets `e^ε` and never exceeds it — this *is* the ε-DP guarantee.

### 2.3 k-ary randomized response satisfies ε-DP

With `q = k/(e^ε + k − 1)`, the probability of keeping the true value is `(1−q) + q/k` and of emitting
any specific other value is `q/k`; their ratio is `e^ε` **exactly**, for every ε and domain size k:

| ε | k | q | P(keep) | output-prob ratio | e^ε | verdict |
|---|---|---|---|---|---|---|
| 0.5 | 4 | 0.8605 | 0.3547 | 1.6487 | 1.6487 | EXACT |
| 0.5 | 29 | 0.9781 | 0.0556 | 1.6487 | 1.6487 | EXACT |
| 1.0 | 4 | 0.6995 | 0.4754 | 2.7183 | 2.7183 | EXACT |
| 1.0 | 29 | 0.9441 | 0.0885 | 2.7183 | 2.7183 | EXACT |
| 2.0 | 4 | 0.3850 | 0.7112 | 7.3891 | 7.3891 | EXACT |
| 2.0 | 29 | 0.8195 | 0.2088 | 7.3891 | 7.3891 | EXACT |

(k = 4 is the vaccine domain, k = 29 the city domain.) The mechanism is exactly ε-DP for categorical
fields.

---

## 3. Empirical validation (the running system)

| Property | Evidence (2026-08-22 run) |
|---|---|
| **Real noise is applied** | admin compare: Bucharest raw `1228` → noisy `1228.52`; Cluj raw `0` → `0.70` |
| **Correct scale (1/ε)** | deviations ±~1 at ε = 1, matching std √2 ≈ 1.41 |
| **Public channel is fixed-ε** | Bucharest noisy identical at ε = 0.01 vs 9999 (`1228.5241…`) |
| **Memoised (no averaging)** | `/grouped` `mild = 16` identical across repeated queries |
| **Researcher channel: fresh noise** | five ε = 1 queries → `93.30, 88.43, 90.96, 89.82, 90.99` (all different, clustered at the true ≈ 91) |
| **Budget composition enforced** | budget `5 → 4 → 3 → 2 → 1 → 0`; 6th query → HTTP 429; ε = 2 → HTTP 400 |
| **No per-record release** | `GET /api/side-effects` → HTTP 405 |

Reproduce, e.g.:

```
# real noise (admin only)
curl -u admin:admin "http://localhost:8080/api/vaccinations/region/compare?region=Bucharest&epsilon=1"
# fresh-noise researcher channel
curl -u doctor:doctor "http://localhost:8080/api/research/side-effects/count?epsilon=1.0&city=Bucharest"
# public aggregate, unaffected by client epsilon
curl "http://localhost:8080/api/side-effects/grouped?vaccineName=Pfizer&epsilon=<x>"
```

---

## 4. Code ↔ math correspondence

The deployed Java matches the validated formulas exactly:

- `freshLaplaceNoise` / `laplaceNoise`: `−scale·sgn(u)·ln(1−2|u|)`, `log(0)` guarded;
- `releasedCount`: `raw + Laplace(1/ε)` with sensitivity 1 (correct for counting queries);
- `replaceProbability`: `k/(e^ε + k − 1)`;
- public aggregates draw the noise **once per secret and memoise it** at a fixed server-side ε;
- clamping (`≥ 0`) and rounding are post-processing and cannot weaken the guarantee.

---

## 5. Verdict

The differential privacy is **correct and complete**:

1. both mechanisms provably satisfy ε-DP — the density/probability ratio equals `e^ε` and never
   exceeds it (verified analytically and numerically);
2. the noise is genuinely applied at the correct scale (1/ε);
3. the public channel cannot be de-noised — fixed ε, memoised, so it resists averaging and
   ε-differencing;
4. the researcher channel is rigorous under sequential composition — fresh noise bounded by a
   per-user ε budget;
5. no individual record is ever released.

The implementation was therefore verified both **analytically** (the mechanisms satisfy ε-DP exactly)
and **empirically** (the running system applies the noise correctly and resists averaging, ε-tuning,
and re-identification).
