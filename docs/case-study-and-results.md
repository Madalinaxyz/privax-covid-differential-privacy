# 6. Case Study and Results Evaluation

> Thesis-chapter draft. This pulls together the demonstration (case study) and the evaluation
> (differential-privacy correctness, adversarial testing, functional testing, and analysis) into one
> chapter. Rewrite the prose in your own academic voice — this file is the scaffold and the evidence,
> not finished thesis text. Supporting detail lives in `differential-privacy-analysis.md` (design +
> full pentest) and `dp-verification.md` (mechanism validation). Absolute counts come from the demo
> database, which reseeds on restart, so exact numbers differ between runs; the *properties* do not.

---

## 6.1 Purpose of the Case Study

The case study demonstrates Privax working end to end and shows that its central promise — that a
report can never be traced back to the person who made it — holds in practice, not just on paper. It
is intended to demonstrate three things:

1. the **reporting workflow** — how a report is submitted and how the data is then browsed;
2. the **role-based functionality** — what an ordinary user, an approved clinician (DOCTOR), and an
   administrator can each do;
3. the **differential privacy in action** — that the figures shown to the public are noised
   aggregates, that the noise cannot be removed, and that no individual record is ever released.

---

## 6.2 Case Study Scenario and Data

The scenario is a public vaccine side-effect reporting platform. Members of the public submit reports
of what they experienced after vaccination; anyone can then browse the reported patterns on a map and
in charts; approved clinicians can submit reports on a patient's behalf and run their own queries; and
an administrator manages who is granted clinician access.

The dataset used is **simulated (mock) data**:

- **no real medical records are used;** every report is synthetic;
- the data is generated only to demonstrate the platform's functionality and to make the privacy
  behaviour visible;
- the generated data mirrors a realistic distribution (a severity mix of roughly 80% mild, 14%
  moderate, 5% severe, 1% fatal; symptoms grouped by severity; 29 Romanian cities; four vaccines),
  so the demonstration looks and behaves like real data without any real person being involved.

The backend seeds the database on start-up (on the order of a few thousand reports and tens of
thousands of vaccination records), which is enough to make the aggregate views meaningful while
remaining a demonstrative, not clinical, dataset.

---

## 6.3 Case Study Execution

The platform was exercised through the following steps. *(Insert screenshots at each marked point.)*

1. **Authentication.** Log in with a seeded account (`user`, `doctor`, or `admin`). *(screenshot: login)*
2. **Browsing the public data (no login required).** Open the Reports section and view the map of
   reports by city and severity, and the symptom-prevalence chart. *(screenshot: map + charts)*
3. **Filtering.** Filter the data by vaccine, severity, and city and observe the aggregates update.
4. **Changing the privacy level (ε).** Move the epsilon slider on the illustrative table and observe
   the displayed rows change as the noise scales. *(screenshot: slider at low vs high ε)*
5. **Observing the privacy-protected results.** Note that the public map and charts stay stable
   regardless of the client ε, because they are released at a fixed server-side level.
6. **Submitting a report as a clinician.** Log in as the approved `doctor` account and submit a
   report on a patient's behalf, including an internal patient code. *(screenshot: clinician form)*
7. **Role-specific pages.** Show that the admin panel (user approvals) is reachable only as `admin`,
   and the research console only as `doctor`.

---

## 6.4 Evaluation of the Differential Privacy Mechanism

Two things are evaluated here: that the mechanisms are **correct** (they satisfy ε-differential
privacy), and the **trade-off** between privacy and accuracy that ε controls.

### Correctness

The exact formulas used in the implementation were validated (see `dp-verification.md`):

- the **Laplace sampler** reproduces a true Laplace distribution (mean ≈ 0, variance ≈ 2·scale²);
- the **Laplace mechanism** on neighbouring datasets (differing by one person) has an output-density
  ratio bounded by exactly `e^ε` — the ε-DP guarantee;
- **k-ary randomized response** with `q = k/(e^ε + k − 1)` has an output-probability ratio of exactly
  `e^ε`.

So both mechanisms provably satisfy ε-differential privacy.

### The privacy / accuracy trade-off

Epsilon fixes the balance between how much privacy is preserved and how accurate the released numbers
are. Lower ε means more noise and stronger protection; higher ε means less noise and sharper results.

| Epsilon (ε) | Noise level | Privacy protection | Result accuracy |
|---|---|---|---|
| 0.1 | High | Very high | Lower |
| 0.5 | Moderate | High | Moderate |
| 1.0 | Lower | Lower | Higher |

An important subtlety observed in testing is that the noise is calibrated to what **one person** can
change (a count's sensitivity is 1), not to the size of the count. At ε = 1 the noise is only about
±1–2, which looks small next to a large count but is exactly enough to hide any single individual's
contribution; on a small (rare) count the same noise is a much larger fraction, so rare cases are
automatically protected more strongly relative to their size. Privax releases its public figures at a
fixed ε = 1.0, chosen as a moderate balance for a demonstrative platform.

---

## 6.5 Security and Privacy Evaluation (Adversarial Testing)

Beyond checking that the mechanism is correct, the running system was tested **as an attacker would**:
black-box, against the live API, trying to recover a raw value, single out an individual, or reach
data above the caller's privilege. (Full detail in `differential-privacy-analysis.md`, §7.)

**Threat model.** An anonymous, unlimited, adaptive attacker who chooses query parameters and may
already hold outside information, whose goal is to recover a value the privacy layer is meant to hide.

**Attacks attempted and results:**

| Attack | What it tries | Result |
|---|---|---|
| **Read an individual record** | fetch raw rows from the per-record feed | **Closed** — the endpoint returns HTTP 405; no per-record feed exists |
| **Averaging** | repeat the same aggregate query and average out the noise | **Closed** — results are memoised, identical on every repeat |
| **Tunable-ε / differencing** | query at very low vs very high ε to solve for the true value | **Closed** — public ε is fixed server-side; results identical across ε |
| **Singling-out** | narrow filters until a slice matches one person | **Closed** — counts are noised, so a slice cannot confirm a single individual |
| **SQL injection** | inject SQL through filter parameters | **Closed** — parameterised JPQL/Specifications; payloads match nothing |
| **Cross-origin theft (CORS)** | read authenticated responses from a hostile origin | **Closed** — origin pinned to the front-end; no `Access-Control-Allow-Origin` returned |
| **Privilege escalation** | request an ADMIN/DOCTOR role at signup | **Closed** — accounts are created as USER; privileged roles require admin approval |
| **Account enumeration** | probe which usernames/emails exist via signup | **Closed** — a single generic 409 for any duplicate |
| **Identifier leak** | read `patientCode` from any response | **Closed** — `@JsonIgnore` strips it on read and write paths |

**A vulnerability found and fixed.** The testing was not only confirmatory. It found a real gap: a
public per-record endpoint had been left live after the front-end moved to synthetic data, and it
returned real rows noised with a caller-controlled ε (capped at a level high enough to be effectively
no noise), while the exact record count leaked through the pagination metadata. Chained together, these
allowed a full re-identification. The endpoint was removed and the fix re-verified (it now returns
405). Reporting this honestly — a gap between design and deployment, found by adversarial testing and
closed — is itself a result.

**Conclusion.** After the fix, no endpoint releases raw individual records, credentials, or personal
identifiers; individual-level protection rests entirely on the differentially-private aggregates, the
budgeted researcher API, and the anonymous-at-rest data model.

---

## 6.6 Functional Evaluation

Each main feature was checked against its expected behaviour:

| Feature | Expected behaviour | Result |
|---|---|---|
| Authentication | valid credentials log in; invalid are rejected | Works |
| Role-based authorization | USER / DOCTOR / ADMIN each reach only their own functions | Works (401/403 enforced server-side) |
| Report submission (public) | a logged-in user can submit a report | Works (login required) |
| Report submission (clinician) | an approved DOCTOR can submit with a patient code | Works; patient code never returned |
| Report visualisation | map and charts render the aggregated data | Works, no login required |
| Filtering and sorting | filters by vaccine/severity/city apply correctly | Works |
| Differential privacy processing | public figures are noised at a fixed ε and memoised | Works (verified in 6.4/6.5) |
| Admin functions | approve/deny clinician requests, manage users | Works (ADMIN only) |
| Research console | budgeted DP queries with 429 on exhaustion | Works (DOCTOR only) |

---

## 6.7 Results Analysis

The obtained results highlight the trade-off between data privacy and statistical utility. Lower
epsilon values introduce a higher level of noise, providing stronger privacy protection while also
reducing the accuracy of the aggregated results; conversely, higher epsilon values improve accuracy
but provide weaker privacy. Privax manages this trade-off not with a single setting but by separating
the data into channels — a fixed, moderate ε for the public aggregates, a spending budget for
researchers, and synthetic data for the illustrative per-record view — so that each audience receives
the strongest protection compatible with its needs.

The adversarial testing shows that these guarantees hold in practice and not only in theory: the
attacks that defeat ordinary de-identification (averaging, ε-tuning, differencing, and re-identification
by linkage) were all closed, and the one real gap that testing uncovered was fixed and re-verified.
Taken together, the correctness proof (6.4) and the adversarial evaluation (6.5) support the central
claim of the thesis — that an individual cannot be identified from anything the platform releases.

---

## 6.8 Limitations

The evaluation is subject to the following limitations:

- the data is **simulated**, not real medical records;
- the **dataset is limited in size** and generated to a fixed distribution, so it does not capture the
  messiness of real-world reporting;
- only a **small number of test users** and roles were exercised;
- there was **no testing in a real healthcare environment**, and no clinicians or patients took part;
- Privax is a **demonstrative research prototype**, not a production system — for example, it uses
  HTTP Basic authentication over plain HTTP and does not implement transport encryption (HTTPS) or
  encryption at rest, which would be required before any real deployment;
- the evaluation **does not constitute a clinical or epidemiological study**, and no medical
  conclusions should be drawn from the demonstration data;
- privacy loss is bounded **per release channel** but not by a single global budget across all
  channels, which would be the rigorous next step.
