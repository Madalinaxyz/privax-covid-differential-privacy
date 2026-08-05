package com.covid.api.runner;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.covid.api.blog.BlogPost;
import com.covid.api.blog.BlogPostRepository;
import com.covid.api.rest.model.ReporterType;
import com.covid.api.rest.model.SeverityLevel;
import com.covid.api.rest.model.SideEffectReport;
import com.covid.api.rest.model.VaccinationRecord;
import com.covid.api.rest.model.Vaccine;
import com.covid.api.rest.repository.SideEffectReportRepository;
import com.covid.api.rest.repository.VaccinationRecordRepository;
import com.covid.api.rest.repository.VaccineRepository;
import com.covid.api.security.SecurityConfig;
import com.covid.api.user.User;
import com.covid.api.user.UserService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Slf4j
@RequiredArgsConstructor
@Component
public class DatabaseInitializer implements CommandLineRunner {

    @Autowired
    private VaccinationRecordRepository vaccinationRecordRepository;
    private final SideEffectReportRepository sideEffectReportRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final VaccineRepository vaccineRepository;
    private final BlogPostRepository blogPostRepository;


    private static final String[] REGIONS = {
        "Bucharest", "Cluj", "Timisoara", "Iasi", "Constanta", "Brasov", "Oradea", "Craiova"
    };
    
    private static final String[] VACCINE_TYPES = {
        "Pfizer", "Moderna", "AstraZeneca", "Johnson & Johnson"
    };

    // Symptoms grouped by clinical severity tier, so generated reports stay plausible
    // (a MILD report never lists a severe symptom like Myocarditis).
    private static final List<String> MILD_SYMPTOMS = Arrays.asList(
            "Fever", "Fatigue", "Headache", "Muscle Pain", "Chills", "Nausea",
            "Dizziness", "Joint Pain", "Injection Site Pain", "Swollen Lymph Nodes", "Rash"
    );
    private static final List<String> MODERATE_SYMPTOMS = Arrays.asList(
            "Vomiting", "Brain Fog", "Insomnia", "Anxiety", "Heart Palpitations",
            "Chest Pain", "Shortness of Breath", "Numbness / Tingling", "Tinnitus"
    );
    private static final List<String> SEVERE_SYMPTOMS = Arrays.asList(
            "Myocarditis", "Anaphylaxis", "Guillain-Barré Syndrome", "Bell's Palsy",
            "Blood Clots", "Seizures", "Encephalitis", "Psychosis",
            "Transverse Myelitis", "Immune Thrombocytopenia", "POTS", "Paralysis"
    );

    /** Symptoms a report of the given severity may plausibly list (this tier and milder). */
    private static List<String> allowedSymptomsFor(SeverityLevel severity) {
        List<String> pool = new ArrayList<>(MILD_SYMPTOMS);
        if (severity == SeverityLevel.MODERATE || severity == SeverityLevel.SEVERE || severity == SeverityLevel.FATAL) {
            pool.addAll(MODERATE_SYMPTOMS);
        }
        if (severity == SeverityLevel.SEVERE || severity == SeverityLevel.FATAL) {
            pool.addAll(SEVERE_SYMPTOMS);
        }
        return pool;
    }

    private static final List<Vaccine> VACCINES = Arrays.asList(
        new Vaccine("Pfizer", "Pfizer Inc.", 10000),
        new Vaccine("Moderna", "Moderna, Inc.", 8000),
        new Vaccine("AstraZeneca", "AstraZeneca plc", 6000),
        new Vaccine("Johnson & Johnson", "Johnson & Johnson", 5000)
    );

    private static final int NUMBER_OF_RECORDS = 10_000;
    private static final int NUMBER_OF_REPORTS = 3_000;

    private final Random random = new Random();

    @Override
    public void run(String... args) {
        insertUsers();
        insertVaccines();
        insertVaccinationRecords();
        insertSideEffectReports();
        insertBlogPosts();
        log.info("Database initialized");
    }

    private void insertBlogPosts() {
        if (blogPostRepository.count() > 0) return;

        // ────────────────────────────────────────────────────────────
        // Article 1 — Why I built Privax
        // ────────────────────────────────────────────────────────────
        BlogPost p2 = new BlogPost();
        p2.setSlug("why-i-built-privax");
        p2.setTitle("Why I built Privax");
        p2.setExcerpt("This isn't an anti-vaccine project. It's a pro-listening one. Here's the " +
                      "difference, and why the difference matters more than ever.");
        p2.setAuthor("The patient who built Privax");
        p2.setContent("""
# Why I built Privax

Let me say what this is, and what it isn't.

This is **not** an anti-vaccine project. I got vaccinated. I would do it again. Vaccines have saved lives I love. None of that is up for debate on this platform.

This **is** a project about something else: **what happens after.**

## The thing nobody quite says

Public health communication tends to compress reality into two clean buckets. The official one says: *"vaccines are safe and effective."* The opposing one says: *"vaccines are dangerous."* Both buckets are too small.

The space the buckets miss is the space most people I've spoken to actually live in:

> *"I'm glad I got it. And something happened to me that nobody could explain, and nobody wrote down, and it changed how I trust the system."*

That sentence shouldn't be radical. But it is, because there's almost nowhere to put it. Official reporting systems are designed for clinically-confirmed adverse events. Social media is designed for outrage. There is very little space, in either, for **honest, granular, anonymized accounts** of what real people actually experienced.

That's what Privax is for.

## What it does, exactly

People who got vaccinated submit reports — symptoms, severity, duration, location, vaccine — anonymously. The platform aggregates those reports into patterns. Researchers, journalists, and the public can see the patterns. Nobody can see the individuals.

The "nobody can see the individuals" part is enforced by [**differential privacy**](/blog/understanding-the-epsilon-slider) — a mathematical guarantee that the published statistics don't leak information about any single person, no matter how clever the observer.

## What it does not do

- It does not replace medical advice.
- It does not claim causation.
- It does not adjudicate whether your symptom was *"really"* from the vaccine.
- It does not sell, share, or monetize your data.
- It does not require an account.

It just listens, and counts, and makes the counts visible.

## Why I think this matters

The lesson I took from the last pandemic isn't *"trust the science."* I do trust the science. The lesson I took is that **the science depends on the listening**. When the listening fails — when reporting forms are buried, when symptoms get dismissed, when people stop trying — the science gets worse, not just the patients.

If we build better listening, we build better science. That's the whole bet.

> Every honest report is a small act of repair.

If you have a story to add, you can add it without giving up your privacy. If you don't, you can read what others have added. Either way, you're part of something that didn't exist before: a record that doesn't disappear when the appointment is over.
""");
        p2.setTags(Arrays.asList("manifesto", "origin"));
        p2.setPublishedAt(LocalDateTime.now().minusDays(14));
        blogPostRepository.save(p2);

        // ────────────────────────────────────────────────────────────
        // Article 3 — Understanding the epsilon slider
        // ────────────────────────────────────────────────────────────
        BlogPost p3 = new BlogPost();
        p3.setSlug("understanding-the-epsilon-slider");
        p3.setTitle("Understanding the epsilon slider");
        p3.setExcerpt("Privacy isn't binary — it's a dial. Here's what the slider on every Privax " +
                      "chart actually does to the data, explained without a single equation.");
        p3.setAuthor("The patient who built Privax");
        p3.setContent("""
# Understanding the epsilon slider

If you've used Privax for more than thirty seconds, you've seen it: a horizontal slider labeled **epsilon**, sitting above almost every chart. Slide it left, the numbers wobble more. Slide it right, the numbers sharpen.

That slider is the most important control on this platform. Here's what it actually does — without any math you don't already know.

## Privacy and accuracy are on opposite ends of one rope

Imagine two extremes:

**On one end** — perfect accuracy. Every report shows up in the data exactly as it was submitted. If you submitted *"37-year-old, Cluj-Napoca, Pfizer, tremor"*, that exact combination is visible to anyone who looks. Researchers love this. So do people who want to figure out who you are.

**On the other end** — perfect privacy. Every report is reduced to noise. The data tells you nothing identifiable about anyone. Privacy advocates love this. Researchers can't use it.

Both extremes are useless in practice. Real privacy is the dial *between* them. That dial has a name in mathematics: **epsilon**, written `ε`.

## What the slider actually controls

When you drag the slider:

- **Toward the left (low ε, e.g. 0.1)** → the platform adds **more noise** to every aggregate count. The "23 reports from Bucharest" you see might actually be 21, or 26, or 19 — you can't tell. Strong individual privacy. Statistics get blurry.
- **Toward the right (high ε, e.g. 10)** → less noise. The "23 reports from Bucharest" you see is much closer to the true 23 — maybe ±1. Sharper statistics. Weaker privacy.

The noise itself comes from a specific mathematical distribution called *Laplace*, with a precisely-tuned width. The width is `sensitivity ÷ epsilon`. Lower epsilon, wider noise, more privacy. That's the entire formula.

## Why noise protects people

Here's the part that feels counterintuitive: *deliberately wrong* numbers can be more honest than *exactly right* ones.

Suppose only one person in Sibiu reported a particular rare side effect. The raw data says **"1 report, Sibiu, [specific symptom]"**. If you live in Sibiu and you know one of your neighbors had that symptom, you've just identified them in the data.

With epsilon = 1 and Laplace noise, that "1" might be displayed as "0" or "3" or "-1 (rounded to 0)". You can no longer be sure whether your neighbor is in the data or not. **The neighbor's privacy is protected — even though the underlying database is unchanged.**

The aggregate trends remain visible. Bucharest still has more reports than Sibiu. Pfizer still shows different patterns than Moderna. Researchers can still do meaningful work. Individuals just can't be re-identified.

## Where Privax lands by default

The default slider position on Privax is **ε = 1.0**. This is a moderate-privacy setting, well within the range used by the **U.S. Census Bureau**, **Apple's emoji telemetry**, and **Google's keyboard data collection**.

You're free to slide it. The point isn't that one value is correct — it's that the trade-off should be **visible and adjustable**, not hidden behind a black box.

> When you see Privax statistics shift as you move the slider, you're watching the privacy/utility trade-off play out in real time. That's not a bug. That's the whole point.

## A small note on what this doesn't fix

Differential privacy protects you from inference attacks on the published data. It does not protect you from:

- A platform that stores your submission alongside your name (Privax doesn't).
- A platform that shares the raw database with third parties (Privax doesn't).
- A platform that gets breached (we minimize personal data we hold, precisely because we can't guarantee perfect security).

Differential privacy is **one layer** of a privacy system, not the whole house. But it's the layer that makes "anonymous statistics" mean something stronger than a promise.

That's what the slider is for. Slide it. Watch the numbers move. Understand the trade-off. Decide what you trust.
""");
        p3.setTags(Arrays.asList("explainer", "differential-privacy"));
        p3.setPublishedAt(LocalDateTime.now().minusDays(7));
        blogPostRepository.save(p3);

        // ────────────────────────────────────────────────────────────
        // Article 4 — What the data is starting to tell us
        // ────────────────────────────────────────────────────────────
        BlogPost p4 = new BlogPost();
        p4.setSlug("what-the-data-is-starting-to-tell-us");
        p4.setTitle("What the data is starting to tell us");
        p4.setExcerpt("It's early, and the sample is small, and the conclusions are preliminary. " +
                      "But three patterns have already shown up — and one of them surprised me.");
        p4.setAuthor("The patient who built Privax");
        p4.setContent("""
# What the data is starting to tell us

It's early. The platform has been live for a short time. The dataset is small compared to what national registries hold. Anything I say here should be read with that caveat first.

But three patterns have already appeared, and one of them genuinely surprised me. I want to walk through them — partly because they're interesting, partly because **the way patterns emerge from this data is itself worth understanding**.

## Pattern 1 — Most reports cluster on days 1–3

When people who report side effects also include a timeline, the heaviest concentration of symptom *onset* is in the first 72 hours after the dose. This isn't surprising — it matches what clinical trials show.

What is interesting: **for many symptoms, the platform shows a second small bump around day 14–21**. Fatigue, brain fog, joint pain. The trial data captures the first peak well. The second peak is much less documented, because most clinical follow-up protocols don't ask about it.

That doesn't mean the second peak is *caused* by the vaccine. It might be coincidence, or seasonal, or a reporting bias (people are more likely to write things down when they're frustrated, and people get frustrated when a symptom drags on). But the platform makes it **visible** — which is the first step toward someone qualified asking better questions.

## Pattern 2 — Severity is heavily right-skewed

The vast majority of reports — about **80%** in our seeded distribution and a similar share in early real submissions — fall in the **mild** category. Moderate is next, around 14%. Severe is rare. Fatal is extraordinarily rare.

This matches what every real adverse-event registry shows. It's worth saying out loud because the loudest discussions online compress the data into the rarest categories. **The honest picture is that most people who get vaccinated have nothing notable to report, or have mild symptoms that resolve within days.** Privax exists to make sure the small minority who experience more isn't ignored — *and* to make sure the majority who experienced little isn't drowned out by the few.

> Both ends of the distribution deserve representation. Neither end is the whole story.

## Pattern 3 — The thing that surprised me

The single most common *combination* of symptoms in early reports isn't fatigue + headache, which is what I would have guessed. It's **fatigue + brain fog + sleep disturbance**, occurring as a trio more often than chance would predict if each were independent.

I don't know what this means yet. Three symptoms clustering doesn't imply a single underlying mechanism — they could share a confounder (poor sleep makes anything feel worse), or there could be a real biological signal, or it could be that people who experience one of these are more likely to notice and report the others.

What I do know: **this kind of cluster is exactly what large-scale anonymous reporting is supposed to surface**. A doctor seeing one patient won't notice. A clinical trial measuring pre-specified endpoints won't notice. A community of people writing down what they actually felt — that's where these signals come from.

## Why I'm not making bigger claims

It would be very easy to write a sensational version of this post. *"Vaccine Triad Discovered!"* — that kind of thing. I am deliberately not doing that, for three reasons:

1. **The sample size is small.** Patterns in small samples sometimes vanish in larger ones.
2. **Reporting bias is real.** People with symptoms are more motivated to submit than people without.
3. **Causation isn't shown.** Correlation in observational data is a starting point for hypotheses, not a finished claim.

What this platform does is generate the starting points. The finished claims need clinicians, statisticians, peer review, and time.

But the starting points — *those* have been missing. And starting points are where every honest answer eventually comes from.
""");
        p4.setTags(Arrays.asList("data", "insights"));
        p4.setPublishedAt(LocalDateTime.now().minusDays(4));
        blogPostRepository.save(p4);

        // ────────────────────────────────────────────────────────────
        // Article 5 — Your story is the data we've been missing
        // ────────────────────────────────────────────────────────────
        BlogPost p5 = new BlogPost();
        p5.setSlug("your-story-is-the-data-weve-been-missing");
        p5.setTitle("Your story is the data we've been missing");
        p5.setExcerpt("Three reasons people give for not reporting their side effects — and what " +
                      "each of those reasons accidentally costs the rest of us.");
        p5.setAuthor("The patient who built Privax");
        p5.setContent("""
# Your story is the data we've been missing

When I talk to people about reporting their post-vaccine symptoms, they almost always give one of three reasons for not doing it. I've heard each of these dozens of times. I've also said each of them, at different points, myself.

I want to take them seriously — and then explain what each one costs.

## Reason 1: *"It probably wasn't the vaccine."*

This is the most common one. It's also the most reasonable-sounding. You don't want to be the person who blames every headache on the shot. You don't want to add to misinformation. You don't want to be *that* person.

Here's the thing: **a report on Privax is not a claim of causation.** It's a record that *X happened to you, at *Y time, after *Z event*. That's it. The job of figuring out whether the timing is meaningful is not yours. It's the job of researchers who have access to thousands of reports, statistical training, and clinical context.

By not reporting, you're not protecting science from a false signal. You're starving science of a real data point. *"It probably wasn't"* is exactly the kind of marginal observation that, in aggregate across thousands of people, becomes statistically distinguishable from *"it actually wasn't."* That distinction only emerges if you write it down.

## Reason 2: *"My doctor said it was nothing."*

I have so much sympathy for this one. When a medical professional dismisses your experience, the natural instinct is to trust their judgment — they've trained for this, and you haven't.

But here's what doctors are good at, and what they're not:

- **Doctors are excellent** at diagnosing one patient in one visit using their personal experience and a constrained time budget.
- **Doctors are not built** to detect population-level patterns across thousands of patients they will never see.

That's not a failure of medicine. It's a structural feature of how medical care is organized. The platform that *can* detect those patterns — VAERS, EudraVigilance, Privax, the broader pharmacovigilance ecosystem — only works if patients themselves are the data source.

> When your doctor says *"it's nothing,"* what they often mean is *"in my limited window, I can't tell."* Reporting isn't disagreeing with your doctor. It's giving someone else a chance to look.

## Reason 3: *"I don't want to give my data to a database."*

Of the three, this is the one I respect most, and it's the one I built Privax to answer.

Most reporting systems don't tell you what they do with your submission. They ask for your name, your date of birth, your address. The data sits in a database with imperfect security and unclear retention policies. If you've been burned before, *"please report your symptoms"* sounds like *"please give us another piece of you to lose."*

Privax was designed from the first line of code on this principle: **the platform should not need your identity in order to do its job.** Your reports go through a [differential-privacy filter](/blog/understanding-the-epsilon-slider) before they become public statistics. No personally identifying information is stored alongside your report. You can submit anonymously, with no account at all.

I can't promise zero-risk — anyone who tells you that is lying about security. I can promise that **the risk to you is much smaller than the cost to everyone if you don't report**, and that the platform is designed to keep it that way.

## What it actually costs to stay silent

Every unreported symptom is a data point that doesn't exist. Multiplied across enough people, that absence has consequences:

- **Researchers** can't see the patterns they need to investigate.
- **Future patients** with similar symptoms can't find anyone who shared the experience.
- **Public health communication** keeps using the same incomplete information, and the gap between official messaging and lived experience keeps growing.
- **The next person who walks into a clinic with your symptom** gets the same dismissal you did, because nobody has accumulated evidence that it's a real pattern.

That last one is what changed my mind. I built this platform after realizing I wasn't the only person being told *"it's anxiety."* If even one of those people, years before me, had written it down somewhere a researcher could find it — the conversation in my appointment might have been different.

I can't go back and write it down for the person who came before me. But I can write it down for whoever comes after.

> So can you.
""");
        p5.setTags(Arrays.asList("manifesto", "personal"));
        p5.setPublishedAt(LocalDateTime.now().minusDays(1));
        blogPostRepository.save(p5);

        log.info("Inserted 4 long-form blog posts.");
    }

    private void insertUsers() {
        USERS.forEach(user -> {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            userService.saveUser(user);
        });
    }

    private void insertVaccines() {
        if (vaccineRepository.count() == 0) {
            vaccineRepository.saveAll(VACCINES);
            log.info("Inserted predefined vaccines into the database.");
        } else {
            log.info("Vaccines already exist, skipping initialization.");
        }
    }

    private void insertVaccinationRecords() {
        if (vaccinationRecordRepository.count() == 0) {
            List<VaccinationRecord> records = new ArrayList<>();
            
            LocalDate startDate = LocalDate.of(2020, 1, 1);
            long daysBetween = LocalDate.now().toEpochDay() - startDate.toEpochDay();
            
            for (int i = 0; i < NUMBER_OF_RECORDS; i++) {
                int age = 16 + random.nextInt(60); // 16 to 100
                int numberOfDoses = 1 + random.nextInt(2);
                String region = REGIONS[random.nextInt(REGIONS.length)];
                String vaccineType = VACCINE_TYPES[random.nextInt(VACCINE_TYPES.length)];
                LocalDate vaccinationDate = startDate.plusDays(random.nextInt((int) daysBetween + 1));
                VaccinationRecord record = new VaccinationRecord(age, region, vaccineType, numberOfDoses, vaccinationDate);
                records.add(record);
            }
            
            vaccinationRecordRepository.saveAll(records);
            System.out.println("Inserted " + NUMBER_OF_RECORDS + " random vaccination records.");
        } else {
            System.out.println("Vaccination records already exist, skipping data initialization.");
        }
    }

    private static final List<User> USERS = Arrays.asList(
            new User("admin",  "admin",  "Admin",          "admin@mycompany.com",  SecurityConfig.ADMIN),
            new User("user",   "user",   "User",           "user@mycompany.com",   SecurityConfig.USER),
            new User("doctor", "doctor", "Dr. Ana Popescu","doctor@mycompany.com", SecurityConfig.DOCTOR)
    );


    // private void insertSideEffectReports() {
    //     if (sideEffectReportRepository.count() == 0) {
    //         List<SideEffectReport> reports = new ArrayList<>();

    //         LocalDateTime startDate = LocalDateTime.now().minusYears(3); // Reports from last 3 years
    //         long daysBetween = startDate.until(LocalDateTime.now(), java.time.temporal.ChronoUnit.DAYS);

    //         for (int i = 0; i < NUMBER_OF_REPORTS; i++) {
    //             int age = 16 + random.nextInt(85); // Random age between 16-100
    //             List<String> symptoms = generateRandomSymptoms();
    //             SeverityLevel severity = SeverityLevel.values()[random.nextInt(SeverityLevel.values().length)];
    //             String additionalInfo = random.nextBoolean() ? "Patient had mild symptoms but recovered quickly." : "";
    //             LocalDateTime reportedAt = startDate.plusDays(random.nextInt((int) daysBetween + 1))
    //                                                 .plusHours(random.nextInt(24))
    //                                                 .plusMinutes(random.nextInt(60));
    //             String vaccineName = VACCINE_TYPES[random.nextInt(VACCINE_TYPES.length)];
    //             SideEffectReport report = new SideEffectReport(age, symptoms, severity, additionalInfo, reportedAt, vaccineName);
    //             reports.add(report);
    //         }

    //         sideEffectReportRepository.saveAll(reports);
    //         log.info("Inserted {} random side effect reports.", NUMBER_OF_REPORTS);
    //     } else {
    //         log.info("Side effect reports already exist, skipping initialization.");
    //     }
    // }

    private void insertSideEffectReports() {
        if (sideEffectReportRepository.count() == 0) {
            List<SideEffectReport> reports = new ArrayList<>();
    
            LocalDateTime startDate = LocalDateTime.now().minusYears(3); // Reports from last 3 years
            long daysBetween = startDate.until(LocalDateTime.now(), java.time.temporal.ChronoUnit.DAYS);
    
            List<String> cities = List.of(
                "Bucharest", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Craiova", "Brașov", "Galați",
                "Ploiești", "Oradea", "Brăila", "Arad", "Pitești", "Sibiu", "Bacău", "Târgu Mureș",
                "Baia Mare", "Buzău", "Satu Mare", "Râmnicu Vâlcea", "Drobeta-Turnu Severin", "Botoșani",
                "Reșița", "Deva", "Slatina", "Focșani", "Vaslui", "Târgoviște", "Bistrița"
            );
    
            for (int i = 0; i < NUMBER_OF_REPORTS; i++) {
                int age = 16 + random.nextInt(85); // Random age between 16-100
                SeverityLevel severity = weightedRandomSeverity();
                List<String> symptoms = generateRandomSymptoms(severity); // symptoms consistent with severity
                String additionalInfo = generateAdditionalInfo(severity);
                LocalDateTime reportedAt = startDate.plusDays(random.nextInt((int) daysBetween + 1))
                                                    .plusHours(random.nextInt(24))
                                                    .plusMinutes(random.nextInt(60))
                                                    .plusSeconds(random.nextInt(60))
                                                    .withNano(0);
                String vaccineName = VACCINE_TYPES[random.nextInt(VACCINE_TYPES.length)];
                String city = cities.get(random.nextInt(cities.size()));

                SideEffectReport report = new SideEffectReport(age, symptoms, severity, additionalInfo, reportedAt, vaccineName, city);
                report.setReporterType(reporterTypeFor(severity)); // a deceased person can't self-report
                reports.add(report);
            }
    
            sideEffectReportRepository.saveAll(reports);
            log.info("Inserted {} random side effect reports.", NUMBER_OF_REPORTS);
        } else {
            log.info("Side effect reports already exist, skipping initialization.");
        }
    }

    /**
     * Realistic provenance for seeded data: fatal outcomes are reported by a clinician or a
     * family member (never the deceased); other reports are mostly self-reported.
     */
    private ReporterType reporterTypeFor(SeverityLevel severity) {
        if (severity == SeverityLevel.FATAL) {
            return random.nextBoolean() ? ReporterType.CLINICIAN : ReporterType.FAMILY;
        }
        double r = random.nextDouble();
        if (r < 0.85) return ReporterType.SELF;
        if (r < 0.95) return ReporterType.FAMILY;
        return ReporterType.CLINICIAN;
    }

    private List<String> generateRandomSymptoms(SeverityLevel severity) {
        List<String> pool = allowedSymptomsFor(severity);
        int numberOfSymptoms = 1 + random.nextInt(3); // Randomly pick 1-3 symptoms
        List<String> selectedSymptoms = new ArrayList<>();
        for (int i = 0; i < numberOfSymptoms; i++) {
            String symptom = pool.get(random.nextInt(pool.size()));
            if (!selectedSymptoms.contains(symptom)) {
                selectedSymptoms.add(symptom);
            }
        }
        return selectedSymptoms;
    }

    /**
     * Realistic post-vaccine severity distribution.
     * Real-world vaccine adverse-event registries (VAERS, EudraVigilance) show
     * the vast majority of reports are mild, with fatalities being extraordinarily rare.
     *
     *   MILD     ~80%   (typical: arm soreness, fatigue, mild fever)
     *   MODERATE ~14%   (more pronounced symptoms, but resolved without hospitalization)
     *   SEVERE    ~5%   (hospitalization or persistent symptoms)
     *   FATAL     ~1%   (rare in real life — slightly elevated here so the data point exists)
     */
    private SeverityLevel weightedRandomSeverity() {
        double r = random.nextDouble();           // 0.0 inclusive, 1.0 exclusive
        if (r < 0.80) return SeverityLevel.MILD;       // 80%
        if (r < 0.94) return SeverityLevel.MODERATE;   // +14% → 94%
        if (r < 0.99) return SeverityLevel.SEVERE;     // +5%  → 99%
        return SeverityLevel.FATAL;                    // +1%  → 100%
    }

    /** Severity-appropriate placeholder notes so the column reads like real-world data. */
    private static final String[] NOTES_MILD = {
        "Symptoms resolved within 48 hours.",
        "Felt better after rest.",
        "Mild discomfort, no medical attention needed.",
        "Resolved after 3-4 days.",
        "Symptoms cleared by the end of the week.",
    };
    private static final String[] NOTES_MODERATE = {
        "Sought medical advice but no hospitalization.",
        "Symptoms persisted for about a week.",
        "Improved with over-the-counter medication.",
        "Required time off work for recovery.",
        "Doctor advised rest and fluids.",
    };
    private static final String[] NOTES_SEVERE = {
        "Hospitalized for observation.",
        "Required emergency room visit.",
        "Long-term follow-up scheduled.",
        "Symptoms persisted for several weeks.",
        "Referred to a specialist.",
    };
    private static final String[] NOTES_FATAL = {
        "Patient had significant pre-existing conditions.",
        "Report submitted by family member.",
        "Outcome occurred several weeks after vaccination.",
        "Underlying health issues complicated recovery.",
    };

    private String generateAdditionalInfo(SeverityLevel severity) {
        // 40% of reports have no note at all
        if (random.nextDouble() < 0.40) return "";

        String[] options;
        switch (severity) {
            case MILD:     options = NOTES_MILD;     break;
            case MODERATE: options = NOTES_MODERATE; break;
            case SEVERE:   options = NOTES_SEVERE;   break;
            case FATAL:    options = NOTES_FATAL;    break;
            default:       return "";
        }
        return options[random.nextInt(options.length)];
    }

}
