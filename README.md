# Privax

> **Private voices in a public crisis.**
> A platform for anonymous vaccine side-effect reporting, with mathematical privacy guarantees built into every number.

---

## The story behind this

> *I went through partial paralysis. Panic attacks. Body aches that lasted long after the world moved on.*
>
> *I tried to report it. I tried to explain it.*
> ***My experience never made it into a chart.***
>
> *So I built this — so yours would.*

Privax was born from a real experience of being invisible to the medical system after vaccination. Reporting forms were buried. Helplines stayed busy. Many symptoms were dismissed as anxiety, coincidence, or simply *"not in the studies."* People stopped reporting — not because they were fine, but because they felt unheard.

This project exists to change that. It is **not anti-vaccine**. It is *for people*. It treats every experience — mild, moderate, severe, lingering — as data the system never collected, and gives it a permanent, anonymous, statistically protected home.

---

## What Privax does

- **Collects anonymous reports** of post-vaccination experiences — symptoms, severity, duration, location, vaccine
- **Visualizes patterns** on an interactive map and in tabular form, so individuals can see how their experience compares to others
- **Protects privacy mathematically** using differential privacy (Laplace noise) on every aggregated statistic
- **Compares vaccines side-by-side** by reported symptoms and severity
- **Scales beyond COVID** — the platform is vaccine-agnostic by design, built for whatever comes next

---

## Why differential privacy

Standard "anonymization" leaks. If a dataset says *"7 people in Bucharest aged 34 reported tremors after Pfizer,"* and you happen to be one of them, you can be re-identified.

Privax solves this by adding **calibrated Laplace noise** to every aggregate count before it leaves the database. The math (`ε` = epsilon, the privacy budget) guarantees that no observer — researcher, journalist, or attacker — can determine whether any *single individual* is in the dataset.

Public aggregate statistics are released at a **fixed privacy level (`ε`)** chosen on the server, so the numbers can't be de-noised by simply dialing `ε` up. The `ε` control on the reports **table** lets you watch the trade-off in action:
- **Low ε (more privacy)** → larger noise, blurrier statistics, stronger individual protection
- **High ε (more accuracy)** → smaller noise, sharper statistics, weaker individual protection

This is the same technique used by Apple, Google, and the U.S. Census.

---

## Features

| Feature | Description |
|---|---|
| **Anonymous reporting** | Submitting needs a free login (basic abuse control), but a report is never linked back to your account |
| **Differential privacy** | Laplace noise on every aggregate query; public statistics released at a fixed server-side `ε` |
| **Interactive map** | Side-effect reports plotted by city, vaccine, and severity (Leaflet + OpenStreetMap) |
| **Illustrative table view** | Synthetic example rows (severity, vaccine, symptoms, location, time) with a live `ε` slider — a teaching view, not a release of real records |
| **Vaccine comparison** | Compare reported patterns across Pfizer, Moderna, AstraZeneca, J&J |
| **Severity tracking** | MILD / MODERATE / SEVERE / FATAL — color-coded throughout |
| **Cinematic homepage** | 11-scene narrative with parallax, starfields, editorial typography |
| **Role-based access** | Admins approve clinician requests; approved clinicians (DOCTOR) file patient reports and use the budgeted research console |
| **JWT-ready Basic auth** | Spring Security with stateless session policy |

---

## Tech stack

### Backend — `privax-api/`
- **Java 21** + **Spring Boot 3.4**
- **Spring Security** (HTTP Basic, stateless, CORS-enabled)
- **Spring Data JPA** + **PostgreSQL 16**
- **Lombok** for boilerplate reduction
- **SpringDoc OpenAPI** (Swagger UI at `/swagger-ui.html`)
- Custom **Laplace noise** implementation for differential privacy

### Frontend — `privax-ui/`
- **React 18** + **React Router v7**
- **Plus Jakarta Sans**, **Inter**, and **Cormorant Garamond** typography
- **Semantic UI React** + custom CSS design system
- **Leaflet** + **react-leaflet** for geographic visualizations
- **Axios** for API communication
- **rc-slider** for the differential privacy controls

### Infrastructure
- **PostgreSQL 16** in Docker
- **Maven Wrapper** (mvnw) — no system Maven required
- **docker-compose** for one-command DB startup

---

## Project structure

```
COVID/
├── privax-api/                              # Spring Boot backend
│   └── src/main/java/com/covid/api/
│       ├── rest/
│       │   ├── controller/                  # REST endpoints
│       │   ├── model/                       # JPA entities (Vaccine, SideEffectReport, etc.)
│       │   ├── repository/                  # Spring Data interfaces
│       │   ├── service/                     # Business logic
│       │   └── dto/                         # Request/response DTOs
│       ├── security/                        # Spring Security + CORS config
│       ├── user/                            # User entity + auth
│       ├── blog/                            # Blog posts
│       ├── config/                          # DifferentialPrivacy, Swagger, ErrorAttrs
│       └── runner/                          # DatabaseInitializer (users, vaccines, 10k vaccinations, 3k reports, blog posts)
│
├── privax-ui/                               # React frontend
│   └── src/components/
│       ├── home/                            # Hero, login, signup, auth
│       ├── reports/                         # Map, table, add-report form
│       ├── doctor/                          # Clinician report console
│       ├── research/                        # Budgeted DP research console
│       ├── blog/                            # Blog index + posts
│       ├── admin/                           # User management + clinician approvals
│       ├── user/                            # User dashboard
│       ├── misc/                            # API client, navbar, pending banner
│       └── context/                         # Auth context
│
├── docker-compose.yml                       # Postgres (privaxdb)
└── README.md
```

---

## Quick start

### Prerequisites
- **Java 21+** (recommended: Amazon Corretto 21)
- **Node.js 18+** + npm
- **Docker Desktop**

### 1. Start PostgreSQL
```powershell
docker compose up -d
```
This creates the `privaxdb` database on `localhost:5432` with user `postgres` / password `postgres`.

### 2. Start the backend
```powershell
# Make sure JAVA_HOME points to a Java 21 install
$env:JAVA_HOME = "C:\path\to\jdk21"

cd privax-api
.\mvnw spring-boot:run
```
The backend starts on `http://localhost:8080` and **automatically seeds the database** with:
- 3 default users (see below)
- 4 vaccine records
- 10,000 random vaccination records
- 3,000 random side-effect reports across 29 Romanian cities
- a set of long-form blog posts

### 3. Start the frontend
```powershell
cd privax-ui
npm install
npm start
```
Opens `http://localhost:3000`.

---

## Default credentials

Seeded on first backend boot:

| Username | Password | Role |
|---|---|---|
| `admin`  | `admin`  | ADMIN |
| `user`   | `user`   | USER  |
| `doctor` | `doctor` | USER — **pending clinician request** |

> The `doctor` account is seeded as a **pending clinician request**. Sign in as `admin`, open the admin panel, and **approve** it to grant the DOCTOR role — which unlocks the clinician report page and the research console. Privileged roles are never self-granted at signup; they always require admin approval.

---

## API overview

All endpoints documented at **http://localhost:8080/swagger-ui.html** when running.

### Public (no auth)
- `POST /auth/authenticate` — login
- `POST /auth/signup` — register (privileged roles are *requested*, not granted — see credentials above)
- `GET  /api/vaccinations/region?region=` — noisy vaccination count for a region (fixed server-side ε)
- `GET  /api/side-effects/grouped?vaccineName=&severityLevel=` — counts grouped by city (the map)
- `GET  /api/side-effects/symptom-stats` — DP-noised symptom prevalence

> There is deliberately **no** endpoint that returns individual reports. Per-record differential
> privacy is infeasible (the curse of dimensionality), so only DP-protected *aggregates* are public;
> the browsable table in the UI is synthetic illustrative data. See the security note below.

### Authenticated (any logged-in user)
- `POST /api/side-effects` — submit a report
- `GET  /api/vaccines` — list vaccines

### Admin only
- `GET  /api/users` — list users
- `GET  /api/users/pending` · `POST /api/users/{username}/approve|deny` — manage clinician requests
- `GET  /api/vaccinations/region/compare?region=` — raw vs. noisy side-by-side (exposes raw counts)

### Clinician (DOCTOR) only
- `POST /api/side-effects/clinician` — submit a report on behalf of a patient
- `GET  /api/research/side-effects/count?epsilon=` — budgeted, differentially-private count

---

## Design language

The interface is built around an extracted palette from the COVID virus + data-constellation hero image:

| Token | Hex | Use |
|---|---|---|
| Void / Deep | `#050810` / `#0A0E16` | Dark scenes |
| Navy | `#0F1A2E` | Navbar, surfaces |
| Verdigris | `#2DA597` / `#3FB8A8` | Primary accent — actions, consoles, highlights |
| Cyan | `#3A9EC7` / `#4FB6D9` | Data & charts |
| Ice / Glow | `#B8DCE8` / `#E5F1F8` | Text on dark |
| Pearl / Stone | `#F7F3EA` / `#E4DCC8` | Light luxury surfaces |
| Champagne | `#C9B380` | The one warm human accent |

The homepage alternates **dark cinematic** and **light editorial** scenes so the page breathes. The personal-story scene uses a starfield + warm spotlight + Cormorant Garamond serif to feel like a film monologue.

---

## Privacy & ethics

- **No personal data is stored in a report.** Submitting requires a free login (basic abuse control), but a report is never linked back to your account.
- **All aggregate statistics shown publicly are protected by differential privacy.** No endpoint releases individual records at all — only fixed-`ε`, memoized aggregates and the budgeted researcher API.
- **Anonymous by design:** because reports carry no link to the submitting account, you can delete your account at any time — submitted reports remain only as anonymous, aggregate data with no way to trace them back to you.
- **Adversarially tested.** The public API was red-teamed (averaging, tunable-`ε`, and re-identification attacks). The DP aggregates and access controls held; a leftover public per-record endpoint that could still leak real rows was found and removed. The full attack chain, evidence, and fix are documented in [`docs/differential-privacy-analysis.md`](docs/differential-privacy-analysis.md) §7.
- **No third-party analytics or tracking.** This is a privacy-first platform by design.

---

## Roadmap (high-level)

- [x] Budgeted researcher API — differentially-private aggregate queries against a per-user ε budget
- [ ] Multi-language support (RO, EN, FR, DE)
- [ ] Anonymous claim tokens — let a submitter revoke a report without linking it to an account
- [ ] Symptom auto-suggest from a controlled medical vocabulary
- [ ] Mobile-optimized reporting flow

---

## License

This project is a personal initiative — license to be added.

---

## Acknowledgements

Built by a patient, for patients.

*"Your story is the data we have been missing."*
