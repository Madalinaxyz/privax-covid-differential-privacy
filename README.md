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

In the UI, you can move the **epsilon slider** to see this trade-off live:
- **Low ε (more privacy)** → larger noise, blurrier statistics, stronger individual protection
- **High ε (more accuracy)** → smaller noise, sharper statistics, weaker individual protection

This is the same technique used by Apple, Google, and the U.S. Census.

---

## Features

| Feature | Description |
|---|---|
| **Anonymous reporting** | Submit experiences without an account, or with one — your choice |
| **Differential privacy** | Laplace noise on all aggregate queries; tunable `ε` per request |
| **Interactive map** | Side-effect reports plotted by city, vaccine, and severity (Leaflet + OpenStreetMap) |
| **Paginated table view** | Browse all reports with severity, vaccine, symptoms, location, time |
| **Vaccine comparison** | Compare reported patterns across Pfizer, Moderna, AstraZeneca, J&J |
| **Severity tracking** | MILD / MODERATE / SEVERE / FATAL — color-coded throughout |
| **Cinematic homepage** | 11-scene narrative with parallax, starfields, editorial typography |
| **Role-based admin** | Manage users (admins), submit reports (users) |
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
│       ├── config/                          # DifferentialPrivacy, Swagger, ErrorAttrs
│       └── runner/                          # DatabaseInitializer (seeds 10k records)
│
├── privax-ui/                               # React frontend
│   └── src/components/
│       ├── home/                            # Hero, login, signup, auth
│       ├── reports/                         # Map, table, form
│       ├── admin/                           # User management
│       ├── user/                            # User dashboard
│       ├── misc/                            # API client (privaxApi)
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
- 2 default users (see below)
- 4 vaccine records
- 10,000 random vaccination records
- 15,000 random side-effect reports across 29 Romanian cities

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
| `admin` | `admin` | ADMIN |
| `user`  | `user`  | USER  |

---

## API overview

All endpoints documented at **http://localhost:8080/swagger-ui.html** when running.

### Public (no auth)
- `POST /auth/authenticate` — login
- `POST /auth/signup` — register
- `GET  /api/vaccinations/region?region=&epsilon=` — get noisy vaccination count for a region
- `GET  /api/vaccinations/region/compare?region=&epsilon=` — raw vs. noisy side-by-side

### Authenticated
- `GET  /api/side-effects?page=0&size=10&epsilon=1.0` — paginated reports with DP noise
- `GET  /api/side-effects/grouped?vaccineName=&severityLevel=&epsilon=` — grouped by city
- `POST /api/side-effects` — submit a new report
- `GET  /api/users` — list users (admin only)
- `GET  /api/vaccines` — list vaccines

---

## Design language

The interface is built around an extracted palette from the COVID virus + data-constellation hero image:

| Token | Hex | Use |
|---|---|---|
| Void / Deep | `#050810` / `#0A0E16` | Dark scenes |
| Navy | `#0F1A2E` | Navbar, surfaces |
| Cyan | `#3A9EC7` / `#4FB6D9` | Data, primary actions |
| Ice / Glow | `#B8DCE8` / `#E5F1F8` | Text on dark |
| Pearl / Stone | `#F7F3EA` / `#E4DCC8` | Light luxury surfaces |
| Champagne | `#C9B380` | The one warm human accent |

The homepage alternates **dark cinematic** and **light editorial** scenes so the page breathes. The personal-story scene uses a starfield + warm spotlight + Cormorant Garamond serif to feel like a film monologue.

---

## Privacy & ethics

- **No personal data is required to submit a report.** You can submit fully anonymously.
- **All aggregate statistics shown publicly are protected by differential privacy.** Individual records are never displayed unmodified.
- **Your right to delete:** logged-in users can edit or remove their reports at any time.
- **No third-party analytics or tracking.** This is a privacy-first platform by design.

---

## Roadmap (high-level)

- [ ] Multi-language support (RO, EN, FR, DE)
- [ ] Researcher API for accessing aggregated datasets
- [ ] Export of personal report history (data portability)
- [ ] Symptom auto-suggest from a controlled medical vocabulary
- [ ] Mobile-optimized reporting flow

---

## License

This project is a personal initiative — license to be added.

---

## Acknowledgements

Built by a patient, for patients.

*"Your story is the data we have been missing."*
