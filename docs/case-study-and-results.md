# 6. Case Study and Results Evaluation

> Thesis-chapter draft. This chapter demonstrates Privax in a concrete scenario (the case study) and
> then evaluates how well it works — its differential-privacy correctness, its resistance to attack,
> and its functionality. Rewrite the prose in your own academic voice where you wish; the technical
> claims are drawn from the running system, and the supporting evidence lives in
> `differential-privacy-analysis.md` (design and full pentest) and `dp-verification.md` (mechanism
> validation). Because the demonstration database reseeds on every restart, exact counts differ
> between runs; the properties described here do not.

---

## 6.1 Purpose of the Case Study

Every claim made earlier in this thesis — that data can be shared usefully without exposing the people
in it, that differential privacy is stronger than removing names, that a report can be counted without
ever being traced back — is only worth as much as a working demonstration of it. The purpose of this
chapter is to provide that demonstration and then to test it honestly.

Concretely, the case study is designed to answer four questions:

1. **Does the platform actually work end to end** — can a person submit a report, and can anyone then
   see the resulting patterns without logging in?
2. **Do the roles behave as intended** — does an ordinary user, an approved clinician, and an
   administrator each get exactly the access they should, and no more?
3. **Is the differential privacy real and correct** — is the noise genuinely applied, does it match
   the mathematics, and does the privacy/accuracy trade-off behave as the theory predicts?
4. **Does the guarantee survive an attacker** — can someone who is actively trying to recover a raw
   value or single out an individual succeed?

The first two questions are answered by the functional walkthrough (6.3, 6.6). The third is answered
by the mechanism evaluation (6.4), and the fourth — the one I consider the most important — by the
adversarial testing (6.5). I set out deliberately to try to break my own system, because a privacy
platform that has never been attacked has not really been tested at all.

---

## 6.2 Case Study Scenario and Data

The scenario is a public vaccine side-effect reporting platform. Members of the public submit reports
of what they experienced after being vaccinated; anyone can browse the reported patterns on a map and
in charts; approved clinicians submit reports on a patient's behalf and run their own aggregate
queries; and an administrator decides who is granted clinician access.

### The data is deliberately synthetic

A decision I made early, and did not compromise on, is that the demonstration uses **only simulated
data**. There are no real medical records anywhere in the system. This was partly practical — I had no
ethical way to collect real post-vaccination reports for a student project — but it was also a matter
of principle. It would have been strange to build a platform about protecting people's medical data and
then populate it with real people's medical data to show it off. Using synthetic data means the
demonstration can be as detailed and public as I like, because there is no real person behind any row
to protect. This mirrors a wider move in privacy research toward synthetic data as a way to develop and
show systems without exposing anyone.

The generated data is not random noise; it is shaped to look like plausible real data so that the
platform behaves realistically:

- a **severity distribution** of roughly 80% mild, 14% moderate, 5% severe, and 1% fatal, matching the
  shape one would expect from real adverse-event reporting, where the overwhelming majority of reports
  are minor;
- **symptoms grouped by severity tier**, so that a mild report never carries a severe symptom such as
  myocarditis, keeping every generated record clinically plausible;
- the **29 largest Romanian cities**, four vaccines, and an age range spanning the adult population.

The severe symptoms the data models are not invented; they mirror the rare but real adverse events that
post-vaccination surveillance has documented. Myocarditis following mRNA vaccination, for instance, is
rare — on the order of two cases per 100,000 vaccinated people, rising to roughly six per 100,000 in
young males after a second dose — and is usually mild to moderate, yet its concentration in one specific
group is exactly the kind of pattern that only becomes visible when the data can be broken down finely
[13], [15]. In the same period, a thrombosis-with-thrombocytopenia syndrome was identified after
adenoviral-vector vaccines at roughly one case per 100,000, occurring mostly in younger women [14].
Modelling such events in the synthetic data — as rare, severe, and clustered rather than spread evenly —
lets the platform demonstrate the hardest case to protect: the individual who is easy to single out
precisely because their experience is unusual. It is also a reminder of why granular reporting matters
at all: these signals were found by looking closely at *who* was affected, which is only safe to do
publicly if the looking is done through a privacy guarantee.

The backend seeds this data on start-up — on the order of a few thousand reports and tens of thousands
of vaccination records — which is enough to make the map and the prevalence charts meaningful while
remaining an unmistakably demonstrative dataset. It is important to state plainly that these numbers
carry no epidemiological meaning; they exist only to exercise the platform.

---

## 6.3 Case Study Execution

The platform was exercised along the paths a real visitor and each kind of account would take. Insert
screenshots at the marked points.

### As a member of the public (no account)

1. **Open the Reports section.** The map loads reports by city and severity, and the symptom-prevalence
   chart shows how common each symptom is. No login is required — browsing the anonymised data is fully
   public, which is the whole point of the platform. *(screenshot: map + prevalence chart)*
2. **Filter.** Filtering by vaccine, severity, and city updates the aggregates. The numbers stay
   coherent because the filters are applied on the server before the differentially-private figures are
   produced. *(screenshot: a filtered view)*
3. **Move the epsilon slider.** On the illustrative table, dragging ε changes the displayed rows: at a
   low ε the values are heavily scrambled, at a high ε they sharpen. This makes the privacy/accuracy
   trade-off visible and tangible. *(screenshot: low ε vs high ε)*

### As a registered user

4. **Log in and submit a report.** Submitting requires a free account — a light abuse control — but the
   report is stored with no link to the account that made it. The confirmation shows the report was
   accepted; nothing in the system connects it back to the submitter. *(screenshot: submission form)*

### As a clinician (DOCTOR)

5. **Submit on a patient's behalf.** After an administrator has approved the account, the clinician page
   allows a report to be filed for a patient, with an optional internal patient code. That code is
   stored but never returned by any part of the API. *(screenshot: clinician form)*
6. **Run a budgeted query.** The research console answers aggregate count questions against a personal
   privacy budget; each query spends part of it, and once the budget is gone the console refuses further
   queries. *(screenshot: research console + budget)*

### As an administrator

7. **Approve a clinician.** The admin panel lists pending clinician requests and lets the administrator
   approve or reject them. Only an administrator can reach this page. *(screenshot: admin panel)*

Walking these paths shows the three release channels in use at once: the public sees noised aggregates,
the clinician spends a budget for sharper answers, and no one — at any role — is shown a real individual
record.

---

## 6.4 Evaluation of the Differential Privacy Mechanism

This section evaluates two distinct things: that the mechanism is **correct**, and the **trade-off** it
exposes between privacy and accuracy.

### Correctness

It is not enough to add some random noise and call it private; the noise has to satisfy the
differential-privacy definition. The exact formulas used in the implementation were therefore validated
independently (the full validation is in `dp-verification.md`):

- the **Laplace sampler** reproduces a true Laplace distribution — over two million samples its mean is
  approximately zero and its variance approximately twice the square of the scale, as the distribution
  requires;
- the **Laplace mechanism** applied to counts, on two databases that differ by a single person, has an
  output-density ratio bounded by exactly `e^ε` — which is precisely the ε-differential-privacy
  guarantee;
- **k-ary randomized response**, used for categorical fields, keeps the true value with probability
  `e^ε/(e^ε+k−1)` and its output-probability ratio is exactly `e^ε`.

Both mechanisms therefore provably satisfy ε-differential privacy, and the running code matches the
validated formulas line for line. This matters because it moves the privacy claim from "the numbers
look noisy" to "the release satisfies a stated mathematical definition."

### The privacy / accuracy trade-off

Epsilon is the dial between privacy and accuracy. A smaller ε adds more noise and protects harder; a
larger ε adds less noise and reveals more. The relationship is summarised below.

| Epsilon (ε) | Noise level | Privacy protection | Result accuracy |
|---|---|---|---|
| 0.1 | High | Very high | Lower |
| 0.5 | Moderate | High | Moderate |
| 1.0 | Lower | Lower | Higher |

Testing surfaced a subtlety that is easy to get wrong. The noise is calibrated to what **one person**
can change — a count's sensitivity is one — not to the size of the count itself. At ε = 1 the noise on
a count is only about one or two, which looks tiny beside a count of several hundred, yet it is exactly
enough to make "n" and "n−1" indistinguishable, and that is all it needs to do to hide any one person.
On a small, rare count the same one-or-two of noise is a large fraction of the value, so rare cases are
automatically protected more, relative to their size — which is reassuring, because rare cases are the
ones easiest to single out.

### Choosing epsilon

One question I could not answer with mathematics alone is which value of ε to use. There is, in fact,
no consensus in the field on how to choose it; researchers have argued that implementations should at
least publish the ε they used so that choices can be compared and debated [12]. Privax releases its
public figures at a fixed ε = 1.0, a moderate value that keeps the aggregate views useful while still
masking individuals, and — importantly — it is fixed on the server so that a visitor cannot raise it to
strip the noise. I present this as a reasoned choice for a demonstrative platform, not as a universally
correct value, and I return to its limits in 6.8.

---

## 6.5 Security and Privacy Evaluation (Adversarial Testing)

The most important evaluation is not whether the system works when used politely, but whether it holds
when someone is actively trying to break it. This section reports a black-box adversarial test of the
running platform. (The full method and evidence are in `differential-privacy-analysis.md`, §7.)

### Why this matters — the precedents

The history of "anonymised" data is a history of it being un-anonymised. Removing names has repeatedly
failed: a set of hospital records stripped of identifiers was re-identified by matching date of birth,
sex, and postcode against a public voter roll [5]; and a large collection of "anonymous" film ratings
was re-identified simply by cross-referencing it with a handful of publicly known preferences [11].
Both attacks worked not by breaking a password but by combining ordinary details until they pointed to
one person. Vaccine side-effect reports — age, city, symptoms, and timing — are exactly this kind of
data, which is why I did not want to rely on de-identification and why I felt I had to attack my own
system rather than assume it was safe.

### Threat model

I assumed an anonymous, unlimited, adaptive attacker: someone who can send any query, as many times as
they like, may already hold outside information, and whose goal is to recover a value the privacy layer
is meant to hide or to establish whether a particular person is in the data.

### Vulnerabilities found and fixed

The testing was not merely confirmatory. Over the course of the project it uncovered several real
problems — some outright data leaks, some correctness bugs in the privacy mechanism itself — each of
which I then fixed and re-verified. I report them all, because in a privacy system the record of what
went wrong and how it was closed is as much a result as the parts that worked.

| # | Vulnerability found | Why it was dangerous | Fix I made | Verified |
|---|---|---|---|---|
| 1 | **Public per-record feed** (`GET /api/side-effects`) returned real individual rows | full re-identification (see below) | endpoint removed entirely | returns HTTP 405 |
| 2 | **Exact record count leaked** through the pagination metadata (`totalElements`) | let an attacker narrow filters until a slice matched exactly one person | removed with the endpoint (feed no longer exists) | no count endpoint remains |
| 3 | **Caller-controlled ε, capped too high** on that feed (up to ~10, ≈ no noise) | an attacker could dial the noise away and read near-raw values | removed with the endpoint; public ε is now fixed server-side everywhere | ε ignored on all public views |
| 4 | **Un-noised fields** on that feed — exact timestamp and free-text note | leaked precise timing and possibly identifying text even at low ε | removed with the endpoint | not exposed anywhere |
| 5 | **`patientCode` serialised** to a public response | the one identifier in the system was exposed | `@JsonIgnore` on the field | absent from every response, read and write |
| 6 | **Account enumeration at signup** — field-specific 409 messages | let an attacker probe which usernames/emails exist | one generic 409 for any duplicate | same message for username or email |
| 7 | **Missing resources returned HTTP 500** instead of 404 | a robustness flaw and a minor information signal | `@ResponseStatus(NOT_FOUND)` on the exception | returns 404 |
| 8 | **Signup accepted a blank email** (only format was checked) | incomplete server-side validation | added `@NotBlank` to the email field | blank email rejected |
| 9 | **City randomised over a 6-city subset**, not the full 29 | broke the ε-DP guarantee for the city field (a city outside the six could only ever appear as itself) | randomised response now uses the full 29-city domain | k matches the real domain |
| 10 | **Laplace `log(0)` edge case** — a draw of exactly 0 gave infinite noise | a rare but real numerical failure in the noise | the draw is guarded so the log argument stays positive | applied to every Laplace sampler |

Items 1–8 are endpoint- and validation-level fixes; items 9–10 are fixes to the differential-privacy
mechanism itself, and matter for correctness rather than for a direct leak.

### The flagship finding — a full re-identification chain

The most serious issue (items 1–4 above) deserves spelling out, because it is a textbook example of how
"anonymous" data leaks. A public per-record endpoint had been left live after the front end had already
moved to synthetic data. It still returned **real** database rows, and three weaknesses combined into a
complete re-identification:

1. the exact number of records matching any filter leaked through the pagination metadata, so an
   attacker could add filters (city, then severity, then vaccine…) until the count fell to **one**,
   isolating a single person;
2. the caller could set ε, and the cap was so high that at the maximum the noise effectively vanished,
   revealing the categorical fields at their true values;
3. the timestamp and the free-text note were never noised at all.

Chained, these let an attacker single out one individual and then read that person's near-exact record —
age, city, severity, vaccine, exact date, and note. This is precisely the failure mode that defeated the
"anonymised" datasets in the precedents above [5], [11]. I removed the endpoint entirely; Privax now has
**no** per-record read path, and the fix was re-verified (the endpoint returns 405 for every method and
every ε). Finding a gap between what I had designed and what I had actually deployed, and closing it, is
a more honest and more useful result than a claim that the system was perfect from the first commit.

### Attacks tested that already held

Alongside the issues above, a wider set of attacks was attempted and found already closed — evidence
that the defences behave as intended, not only that the known holes were patched.

| Attack | What it tries | Result |
|---|---|---|
| Averaging | repeat one aggregate query to average the noise away | Held — results are memoised; every repeat is identical |
| Tunable-ε / differencing | query at very low vs very high ε to solve for the truth | Held — public ε is fixed server-side; results identical across ε |
| Singling-out via aggregates | narrow filters until a slice matches one person | Held — the count is noised, so a slice cannot confirm any individual |
| SQL injection | inject SQL through filter parameters | Held — parameterised queries; injected strings match nothing, schema intact |
| Cross-origin theft (CORS) | read authenticated responses from a hostile web page | Held — origin pinned to the front end; no cross-origin access granted |
| Privilege escalation | request an ADMIN/DOCTOR role at signup | Held — accounts created as ordinary users; privileged roles need admin approval |
| Password-hash exposure | read a password hash from a user endpoint | Held — a DTO is returned; the hash is never serialised, even for the admin |
| Management endpoints | reach Spring Actuator (env, beans, heap dump) | Held — not exposed (HTTP 401) |
| Error-message leakage | force an error and read a stack trace | Held — clean error body, no stack trace |
| Path traversal | bypass access control via a crafted path (`/api/users/me/../pending`) | Held — normalised and still authorised by role |
| Blog author PII | read an author's email from a public post | Held — the author field is a display string only |

Two low-severity information-disclosure items were noted and deliberately left in place, because neither
reveals any individual's membership: the homepage counters (`/public/stats`) are exact global totals,
and the API schema (OpenAPI/Swagger) is public — both appropriate for a demonstrative build, and both
flagged for a production deployment.

### Conclusion

After the fixes, no endpoint releases raw individual records, credentials, or personal identifiers. The
attacks that defeat ordinary anonymisation — averaging, ε-tuning, differencing, and re-identification by
linkage — were all closed, and the correctness bugs in the mechanism itself (items 9–10) were repaired
so that the ε-DP guarantee holds as stated. Individual-level protection now rests entirely on the
differentially-private aggregates, the budgeted researcher channel, and the anonymous-at-rest data
model.

---

## 6.6 Functional Evaluation

Alongside the privacy testing, each main feature was checked against its expected behaviour, so that
the platform can be said to work, not merely to be private.

| Feature | Expected behaviour | Result |
|---|---|---|
| Authentication | valid credentials log in; invalid are rejected | Works |
| Role-based authorization | USER / DOCTOR / ADMIN each reach only their own functions | Works — enforced server-side (401 / 403) |
| Report submission (public) | a logged-in user can submit a report | Works — login required, report unlinked |
| Report submission (clinician) | an approved clinician can submit with a patient code | Works — code stored, never returned |
| Report visualisation | the map and charts render the aggregated data | Works — no login required |
| Filtering and sorting | filters by vaccine, severity, and city apply correctly | Works |
| Differential-privacy processing | public figures are noised at a fixed ε and memoised | Works — verified in 6.4 and 6.5 |
| Admin functions | approve or reject clinician requests, manage users | Works — administrator only |
| Research console | budgeted queries, refused once the budget is spent | Works — clinician only |
| Error handling | missing resources return 404, not 500; no stack traces leak | Works |

Every feature behaved as intended. Notably, the access-control checks all failed *closed* — an
unauthorised request is refused rather than quietly served — which is the behaviour a privacy platform
must have.

---

## 6.7 Results Analysis

The results should be read together rather than feature by feature, because their combined message is
the point.

The mechanism evaluation shows that the privacy is **real and correct**: the noise is genuinely
applied, it matches the mathematics, and it satisfies the ε-differential-privacy definition rather than
merely resembling it. The trade-off behaves exactly as the theory predicts — lower ε means more noise,
stronger privacy, and less accuracy; higher ε means the reverse — and Privax manages that trade-off not
with a single global setting but by separating the data into channels, giving each audience the
strongest protection compatible with what it actually needs.

The adversarial evaluation shows that this protection **holds under pressure**. The attacks that have
historically broken "anonymised" datasets [5], [11] were tried here and did not work, because Privax
does not depend on the strategy those attacks exploit — it never releases the individual-level data in
the first place, and it noises what it does release in a way that cannot be undone by repetition or by
tuning ε. The one real weakness that testing uncovered was a deployment gap, not a flaw in the
mathematics, and it was closed.

Put plainly, the two evaluations support the central claim of the thesis from two directions at once:
the correctness proof (6.4) shows that *in principle* an individual's contribution is hidden, and the
adversarial testing (6.5) shows that *in practice* an attacker cannot recover it. That agreement
between theory and testing is the strongest result the project offers.

---

## 6.8 Limitations and Future Work

It would be dishonest to present the evaluation without its limits, and stating them clearly is part of
the contribution.

**Limitations**

- The data is **simulated**, not real medical reports, and is generated to a fixed distribution, so it
  does not capture the messiness, bias, and under-reporting of real-world data.
- The **dataset is limited in size** and the number of **test users and roles** exercised was small.
- There was **no testing in a real healthcare setting**; no clinicians or patients took part, and the
  evaluation is **not a clinical or epidemiological study** — no medical conclusion should be drawn
  from the demonstration data.
- Privax is a **demonstrative research prototype**. It uses HTTP Basic authentication over plain HTTP
  and does not implement transport encryption (HTTPS) or encryption at rest; these would be required
  before any real deployment.
- Privacy loss is bounded **per release channel**, but not by a single global budget across all
  channels at once.

**Future work**

- A **global privacy accountant** that tracks total privacy loss across the public aggregates and the
  researcher queries together, so the whole system carries one bounded guarantee rather than several.
- **Transport and storage hardening** — HTTPS, encryption at rest, and a token-based (JWT) auth scheme
  in place of HTTP Basic.
- **A live, synthetic ε demonstration** on the privacy page, so a sceptical reader can watch the
  trade-off happen on data that is safe by construction — deliberately on synthetic numbers, since a
  tunable slider on real counts would itself be an attack.
- **Richer reporting** — capturing the onset and duration of symptoms as structured fields (they are
  currently only free text), and a way to withdraw a report anonymously via a one-time claim token.
- Evaluation on **larger and more realistic synthetic datasets**, and, eventually, a study of how the
  platform behaves under the kind of continuous, repeated release that real surveillance involves.

---

## New references introduced in this chapter

- **[11]** A. Narayanan and V. Shmatikov, "Robust De-anonymization of Large Sparse Datasets," in
  *Proc. 2008 IEEE Symposium on Security and Privacy*, Oakland, CA, USA, 2008, pp. 111–125. — the
  Netflix Prize re-identification; used in 6.5 and 6.7 for the failure of anonymisation.
- **[12]** C. Dwork, N. Kohli, and D. Mulligan, "Differential Privacy in Practice: Expose Your
  Epsilons!," *Journal of Privacy and Confidentiality*, vol. 9, no. 2, 2019. — used in 6.4 for the lack
  of consensus on choosing ε.
- **[13]** G. Witberg, N. Barda, S. Hoss, *et al.*, "Myocarditis after Covid-19 Vaccination in a Large
  Health Care Organization," *New England Journal of Medicine*, vol. 385, no. 23, pp. 2132–2139, 2021. —
  used in 6.2 for the incidence and demographics of vaccine-associated myocarditis.
- **[14]** A. Greinacher, T. Thiele, T. E. Warkentin, *et al.*, "Thrombotic Thrombocytopenia after
  ChAdOx1 nCov-19 Vaccination," *New England Journal of Medicine*, vol. 384, no. 22, pp. 2092–2101,
  2021. — used in 6.2 for the thrombosis-with-thrombocytopenia syndrome after adenoviral-vector vaccines.
- **[15]** M. E. Oster, D. K. Shay, J. R. Su, *et al.*, "Myocarditis Cases Reported After mRNA-Based
  COVID-19 Vaccination in the US From December 2020 to August 2021," *JAMA*, vol. 327, no. 4, pp.
  331–340, 2022. — used in 6.2 for myocarditis surveillance rates and severity.

*(Existing references reused: [5] Sweeney, re-identification; alongside the mechanism and design
sources cited in the earlier chapters.)*
