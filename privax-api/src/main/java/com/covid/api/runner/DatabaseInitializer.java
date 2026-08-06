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

        // ────────────────────────────────────────────────────────────
        // Article 6 — A field guide to reading the reports
        // ────────────────────────────────────────────────────────────
        BlogPost p6 = new BlogPost();
        p6.setSlug("a-field-guide-to-reading-the-reports");
        p6.setTitle("A field guide to reading the reports");
        p6.setExcerpt("Three views, one privacy dial, and a few things to keep in mind before you " +
                      "draw conclusions. Here's how to actually read what Privax shows you.");
        p6.setAuthor("The patient who built Privax");
        p6.setContent("""
# A field guide to reading the reports

The [Reports page](/reports) has three tabs and a slider. Here's what each one is for, and how to read it honestly.

## The table

Each row is one anonymized report, passed through the differential-privacy layer before it reaches you. Individual rows are **illustrative** — think of them as "what a plausible report looks like," not as a specific person's record. If you filter by a column, that column is shown as-is so the filter makes sense; the others carry noise.

## The map

Circles sit on Romanian cities, sized by how many reports came from there, split by severity. The counts are noised in proportion to the epsilon slider — so a city showing "20" might truly be 18 or 23. Look at **shape and relative size**, not exact numbers.

## Symptom prevalence

A ranked bar chart of how common each symptom is. This is the most statistically trustworthy view, because a count over thousands of people barely moves when you add privacy noise — while a single person stays hidden inside it.

## Three honest cautions

1. **Reports are voluntary.** People with symptoms are more motivated to submit than people without — so raw prevalence overstates how common side effects are in the general population.
2. **Correlation isn't causation.** A symptom appearing after a vaccine is a timing, not a mechanism.
3. **Small numbers are noisy on purpose.** When a count is tiny, the privacy noise dominates — that's the system protecting the handful of people the number represents.

> Read Privax the way you'd read a weather map, not a bank statement: the pattern is real, the last digit is not.
""");
        p6.setTags(Arrays.asList("guide", "differential-privacy"));
        p6.setPublishedAt(LocalDateTime.now().minusDays(2));
        blogPostRepository.save(p6);

        // ────────────────────────────────────────────────────────────
        // Article 7 — What differential privacy is *not*
        // ────────────────────────────────────────────────────────────
        BlogPost p7 = new BlogPost();
        p7.setSlug("what-differential-privacy-is-not");
        p7.setTitle("What differential privacy is not");
        p7.setExcerpt("The term gets used loosely. Here are five things people assume differential " +
                      "privacy means that it doesn't — and what it actually promises.");
        p7.setAuthor("The patient who built Privax");
        p7.setContent("""
# What differential privacy is not

Differential privacy is a precise mathematical promise, and precise promises are easy to overstate. Five clarifications.

## It is not "anonymization"

Classic anonymization removes names and hopes for the best. It has failed repeatedly — people have been re-identified from "anonymous" data using a birthday and a zip code. Differential privacy makes a guarantee that holds **no matter what outside information an attacker has**.

## It is not encryption

Encryption protects data *in transit or at rest* from people who shouldn't see it. Differential privacy protects individuals *inside published statistics* that everyone is allowed to see. Different problem, different tool.

## It is not "the data is fake"

The underlying reports are real. The noise is added to the **published answers**, calibrated to be small relative to the signal but large relative to any single person's contribution.

## It is not free

Every query spends a little "privacy budget." Answer unlimited questions and the guarantee erodes — which is exactly why serious deployments cap how much can be asked. (Privax's per-row table is deliberately illustrative for this reason; the aggregate views are the rigorous ones.)

## It is not all-or-nothing

Privacy isn't a switch, it's the **epsilon dial**. Low epsilon, strong privacy, blurrier stats. High epsilon, the reverse. The honest move is to make that trade-off visible — which is the whole point of the slider.
""");
        p7.setTags(Arrays.asList("explainer", "differential-privacy"));
        p7.setPublishedAt(LocalDateTime.now().minusDays(3));
        blogPostRepository.save(p7);

        // ────────────────────────────────────────────────────────────
        // Article 8 — The curse of dimensionality
        // ────────────────────────────────────────────────────────────
        BlogPost p8 = new BlogPost();
        p8.setSlug("the-curse-of-dimensionality");
        p8.setTitle("Why we don't privatize your symptoms one by one");
        p8.setExcerpt("A short, honest story about a mechanism that was mathematically correct and " +
                      "completely useless — and what it taught us about high-dimensional data.");
        p8.setAuthor("The patient who built Privax");
        p8.setContent("""
# Why we don't privatize your symptoms one by one

Early on, Privax tried to protect the symptom list the "obvious" way: treat each of the 32 possible symptoms as a yes/no bit, and flip each bit with a calibrated coin. Rigorous. Provably private. And, in practice, garbage.

## The math that ruins it

To protect all 32 symptom bits under one privacy budget, you have to split that budget across all 32 — by a rule called *composition*. Split a small budget 32 ways and each coin becomes almost fair. The result: nearly half of every report's symptoms flip. A person who reported "fever" comes out carrying fifteen random symptoms.

At the strongest privacy setting the slider allows, the symptom column was **pure noise at every position**. Correct, unusable.

## The lesson

This is the **curse of dimensionality**, and it's not a bug — it's why real systems (the US Census, Apple, Google) never publish a privatized copy of each person's full high-dimensional record. They publish **aggregates**: how many people had fever, how many had fatigue.

So that's what Privax does now. Individual symptoms are shown truthfully but only where they can't be tied back to you; the privacy-protected symptom view is the **prevalence chart**, where a count over thousands of people absorbs the noise gracefully.

> The most useful thing a failed mechanism can do is teach you which question you should have been asking.
""");
        p8.setTags(Arrays.asList("explainer", "differential-privacy", "technical"));
        p8.setPublishedAt(LocalDateTime.now().minusDays(5));
        blogPostRepository.save(p8);

        // ────────────────────────────────────────────────────────────
        // Article 9 — Patients, families, and clinicians
        // ────────────────────────────────────────────────────────────
        BlogPost p9 = new BlogPost();
        p9.setSlug("patients-families-and-clinicians");
        p9.setTitle("Who gets to report? Patients, families, and clinicians");
        p9.setExcerpt("A design decision about grief, trust, and who is allowed to speak for someone " +
                      "who can no longer speak for themselves.");
        p9.setAuthor("The patient who built Privax");
        p9.setContent("""
# Who gets to report? Patients, families, and clinicians

A quiet but important question shaped Privax's data model: **who is allowed to file a report?**

## The trap we avoided

It's tempting to say "only the patient can report their own experience." Clean, until you hit the hardest case: a fatal outcome. The person it happened to cannot file it. If the form silently refused, a grieving family member would be turned away — and the most serious signal of all would go uncounted.

## What real registries do

The established adverse-event systems — VAERS in the US, EudraVigilance in the EU — don't gate *who* may report. They accept reports from patients, family members, and healthcare professionals alike, and they record a **reporter type** so the provenance is known.

Privax follows the same principle. Anyone can report any outcome. Each report is stamped **self**, **family**, or **clinician**, and clinician reports go through a separate, verified channel.

## Why provenance beats permission

Restricting who can report doesn't actually improve trust — a bad actor can lie about a mild symptom just as easily. What helps is recording *on whose behalf* a report was filed, and being honest that voluntary reports are inherently unverifiable. That honesty is more useful than a false gate.

> Sometimes the kindest design and the most rigorous design are the same design.
""");
        p9.setTags(Arrays.asList("methodology", "design"));
        p9.setPublishedAt(LocalDateTime.now().minusDays(9));
        blogPostRepository.save(p9);

        // ────────────────────────────────────────────────────────────
        // Article 10 — A security retrospective
        // ────────────────────────────────────────────────────────────
        BlogPost p10 = new BlogPost();
        p10.setSlug("hardening-privax-a-security-retrospective");
        p10.setTitle("Hardening Privax: a security retrospective");
        p10.setExcerpt("A privacy platform that leaks raw data is a contradiction. Here's what a hard " +
                       "look at our own code turned up — and what we changed.");
        p10.setAuthor("The patient who built Privax");
        p10.setContent("""
# Hardening Privax: a security retrospective

Building a privacy platform means holding yourself to the standard you advertise. A deliberate review of our own code found real problems. In the spirit of "audit anything," here's the honest list.

## Differential privacy could be switched off

The noise was only applied when the privacy parameter was present. Omit it from the request, and raw data came back. A separate endpoint returned the entire dataset un-noised. **Fix:** the privacy layer is now unconditional — a missing or inflated parameter can't disable it, and the raw endpoint is gone.

## Non-admins could manage accounts

Several endpoints had no authorization rule, so any logged-in user could list accounts, read emails, or delete the administrator. **Fix:** user, catalogue, and appointment management are restricted to admins, verified against a full role-by-endpoint matrix.

## Errors overshared

API error responses included internal exception class names — small, but it's free reconnaissance for an attacker. **Fix:** error bodies now carry a message and validation details, nothing more.

## What review can't fix

One honest limitation remains: a filterable table of individual records will always leak information under unlimited querying. That's not a bug to patch — it's why differential privacy needs a **query budget**, which is our next piece of work. The aggregate views already meet the bar.

> The point of a security retrospective isn't to look flawless. It's to prove you actually looked.
""");
        p10.setTags(Arrays.asList("security", "engineering"));
        p10.setPublishedAt(LocalDateTime.now().minusDays(11));
        blogPostRepository.save(p10);

        // ────────────────────────────────────────────────────────────
        // Article 11 — On being believed (newest → featured)
        // ────────────────────────────────────────────────────────────
        BlogPost p11 = new BlogPost();
        p11.setSlug("on-being-believed");
        p11.setTitle("On being believed");
        p11.setExcerpt("The opposite of being dismissed isn't being proven right. It's being written " +
                       "down. A short note on why that matters more than it sounds.");
        p11.setAuthor("The patient who built Privax");
        p11.setContent("""
# On being believed

There's a specific kind of tiredness that comes from explaining the same thing to the same doctor and watching it not land. It isn't anger. It's something quieter — the slow realization that your experience isn't going anywhere, that it will end when the appointment does.

## What Privax is really for

People sometimes assume this platform is about proving a point. It isn't. Being **written down** is not the same as being **proven right**, and Privax only promises the first one. Your report doesn't win an argument. It just refuses to disappear.

That turns out to matter more than it sounds. A single account is a story. Ten thousand accounts, counted honestly and protected mathematically, are the beginning of a question a researcher can actually ask.

## The smallest useful act

You don't have to be certain the vaccine caused what you felt. You don't have to have a diagnosis. You only have to be willing to write down *what happened, and when* — and to trust that the platform will keep the "who" to itself.

> Every honest report is a small act of repair — not of the argument, but of the record.

If you have a story, [add it](/reports). If you don't, read the ones that are already here. Either way, someone who felt what you felt is no longer standing in that appointment alone.
""");
        p11.setTags(Arrays.asList("personal", "manifesto"));
        p11.setPublishedAt(LocalDateTime.now().minusHours(6));
        blogPostRepository.save(p11);

        // ────────────────────────────────────────────────────────────
        // Severe-symptom guides. Note: general, non-prescriptive information,
        // grounded in mainstream public-health understanding. Each carries a
        // disclaimer and points to clinicians and official reporting systems.
        // ────────────────────────────────────────────────────────────
        String disclaimer = """

---

> **This is general information, not medical advice.** Privax is not a medical device or a doctor. If you think you are experiencing a serious reaction, contact a clinician — and for emergency warning signs, call your local emergency number. To contribute to official safety monitoring, report to your national system (VAERS in the US, EudraVigilance in the EU, or the WHO's VigiAccess). Nothing here establishes that a vaccine *caused* any individual's symptom.
""";

        // Article 12 — Myocarditis
        BlogPost p12 = new BlogPost();
        p12.setSlug("understanding-myocarditis-after-mrna-vaccines");
        p12.setTitle("Myocarditis after mRNA vaccines: what we know");
        p12.setExcerpt("Chest pain and palpitations in the days after a dose can be frightening. Here's " +
                       "what myocarditis is, who it tends to affect, and what happens next.");
        p12.setAuthor("Privax health notes");
        p12.setContent("""
# Myocarditis after mRNA vaccines: what we know

**Myocarditis** is inflammation of the heart muscle. It has been recognised as a rare adverse event after mRNA COVID-19 vaccines (Pfizer, Moderna), most often in adolescent and young adult males, and more often after the second dose.

## What people describe

The accounts are strikingly consistent: **chest pain or pressure, shortness of breath, or a fluttering / pounding heartbeat**, usually within a few days of the dose. Many describe the hardest part as being unsure whether it was "serious enough" to go in — and the relief, later, of having it taken seriously.

## What the evidence says, honestly

Regulators including the EMA and CDC concluded there is a causal association, while also concluding that for most groups the benefits of vaccination still outweigh this rare risk. Importantly, **most reported cases are mild**, respond to standard treatment, and improve — though follow-up and individual variation matter, which is exactly why it's monitored.

## What is typically done

Care is directed by a clinician, usually a cardiologist. It commonly involves rest, anti-inflammatory medication, and follow-up imaging (ECG, echocardiogram, sometimes cardiac MRI) to track recovery. Strenuous exercise is usually paused until cleared.

## When to seek help

Seek **prompt medical evaluation** for chest pain, breathlessness, or palpitations after vaccination — and **emergency care** for severe or crushing chest pain, fainting, or difficulty breathing.
""" + disclaimer);
        p12.setTags(Arrays.asList("symptom-guide", "medical", "myocarditis"));
        p12.setPublishedAt(LocalDateTime.now().minusDays(7));
        blogPostRepository.save(p12);

        // Article 13 — Anaphylaxis
        BlogPost p13 = new BlogPost();
        p13.setSlug("anaphylaxis-and-vaccines-the-first-fifteen-minutes");
        p13.setTitle("Anaphylaxis and vaccines: the first fifteen minutes");
        p13.setExcerpt("It's the reason you're asked to wait after your shot. What a severe allergic " +
                       "reaction looks like, why it's so rare, and why the treatment works fast.");
        p13.setAuthor("Privax health notes");
        p13.setContent("""
# Anaphylaxis and vaccines: the first fifteen minutes

**Anaphylaxis** is a severe, whole-body allergic reaction that comes on quickly — typically within minutes to an hour. With vaccines it is **very rare**, which is precisely why you're asked to wait and be observed for 15–30 minutes afterwards: the window when it would most likely appear is the window you're being watched.

## What it looks like

Signs can include **hives or widespread rash, swelling of the face, lips or throat, difficulty breathing or wheezing, a sudden drop in blood pressure, dizziness or feeling faint**. It escalates fast, which is why recognising it early matters.

## Why the waiting room is the plan

Clinics that give vaccines are equipped to treat anaphylaxis on the spot. The first-line treatment is **epinephrine (adrenaline)**, given without delay, followed by emergency care and monitoring. Given early, it is highly effective.

## If you're higher risk

People with a history of severe allergic reactions — especially to a previous dose or a known vaccine component — should tell the person administering the vaccine beforehand, so the right precautions and observation time are in place.

## When to seek help

Any signs of a severe allergic reaction — throat tightness, trouble breathing, faintness — are a **medical emergency**: use an adrenaline auto-injector if prescribed and call emergency services immediately.
""" + disclaimer);
        p13.setTags(Arrays.asList("symptom-guide", "medical", "anaphylaxis"));
        p13.setPublishedAt(LocalDateTime.now().minusDays(10));
        blogPostRepository.save(p13);

        // Article 14 — Blood clots / TTS
        BlogPost p14 = new BlogPost();
        p14.setSlug("unusual-blood-clots-and-adenovirus-vaccines");
        p14.setTitle("Unusual blood clots (TTS) and adenovirus-vector vaccines");
        p14.setExcerpt("A rare clotting syndrome linked to some viral-vector vaccines — what the warning " +
                       "signs are, the timeline to watch, and why it changed how some vaccines are used.");
        p14.setAuthor("Privax health notes");
        p14.setContent("""
# Unusual blood clots (TTS) and adenovirus-vector vaccines

**Thrombosis with thrombocytopenia syndrome (TTS)** is a rare condition combining unusual blood clots with a low platelet count. It has been associated with **adenovirus-vector** COVID-19 vaccines (such as AstraZeneca and Johnson & Johnson) — **not** the mRNA vaccines.

## The timeline to watch

When it occurs, it has typically appeared **roughly 4 to 30 days after vaccination**. The clots are sometimes in unusual places, such as the veins draining the brain or the abdomen.

## Warning signs people are told to watch for

- A **severe or persistent headache** that doesn't ease with usual painkillers, or blurred vision
- **Shortness of breath, chest pain**, leg swelling or persistent abdominal pain
- **Tiny blood spots** under the skin beyond the injection site

## What is typically done

TTS is a specialist emergency. Treatment differs deliberately from ordinary clot care — it generally **avoids standard heparin** and may use alternative anticoagulants and immunoglobulin (IVIG), guided by haematology. Because of this risk, several countries restricted or prioritised alternative vaccines for certain age groups.

## When to seek help

The warning signs above in the days-to-weeks after an adenovirus-vector vaccine warrant **urgent medical assessment** — don't wait them out.
""" + disclaimer);
        p14.setTags(Arrays.asList("symptom-guide", "medical", "blood-clots"));
        p14.setPublishedAt(LocalDateTime.now().minusDays(13));
        blogPostRepository.save(p14);

        // Article 15 — Guillain-Barré Syndrome
        BlogPost p15 = new BlogPost();
        p15.setSlug("guillain-barre-syndrome-what-to-watch-for");
        p15.setTitle("Guillain-Barré syndrome: tingling that climbs");
        p15.setExcerpt("A rare nerve condition flagged as a small safety signal with some vaccines. What " +
                       "it feels like, why the timeline matters, and how it's treated.");
        p15.setAuthor("Privax health notes");
        p15.setContent("""
# Guillain-Barré syndrome: tingling that climbs

**Guillain-Barré syndrome (GBS)** is a rare condition in which the immune system attacks the peripheral nerves, causing weakness and abnormal sensation. A small increased-risk signal has been observed with some **adenovirus-vector** COVID-19 vaccines, echoing a signal seen historically with certain other vaccines. It remains **rare**.

## What people describe

A common pattern is **tingling or weakness starting in the feet or legs and gradually climbing upward**, sometimes with unsteadiness walking or weakness in the face. What people online most often say they wish they'd known: that the *progression* — symptoms spreading over hours to days — is the part to act on quickly.

## Why the timeline matters

GBS can worsen over days, and early hospital care improves outcomes. It is not something to monitor from home once it's spreading.

## What is typically done

GBS is managed in hospital. Standard treatments are **intravenous immunoglobulin (IVIG)** or **plasma exchange**, plus supportive care and monitoring of breathing and swallowing in more severe cases. **Many people recover** over weeks to months, though recovery varies and rehabilitation is often part of it.

## When to seek help

Progressive weakness or numbness — especially spreading upward, or affecting breathing, swallowing or the face — needs **prompt medical assessment**.
""" + disclaimer);
        p15.setTags(Arrays.asList("symptom-guide", "medical", "guillain-barre"));
        p15.setPublishedAt(LocalDateTime.now().minusDays(16));
        blogPostRepository.save(p15);

        // Article 16 — Anxiety (immunization stress-related response)
        BlogPost p16 = new BlogPost();
        p16.setSlug("anxiety-around-vaccination");
        p16.setTitle("Anxiety around vaccination: the stress the needle brings");
        p16.setExcerpt("A racing heart, dizziness, a wave of panic. For many people the anxiety is real " +
                       "— and mostly a response to the moment, not the medicine. Here's the honest picture.");
        p16.setAuthor("Privax health notes");
        p16.setContent("""
# Anxiety around vaccination: the stress the needle brings

A pounding heart, dizziness, sweating, a feeling of panic — plenty of people experience these around a vaccination, and they are genuinely unpleasant. Understanding *where* they come from helps.

## Immunization stress-related responses

The World Health Organization recognises a category called **immunization stress-related responses (ISRR)** — reactions triggered by the **experience** of being vaccinated rather than by the vaccine's ingredients. Anticipation, fear of needles, and the clinical setting can set off the body's stress response: **fainting (a vasovagal reaction), hyperventilation, dizziness, palpitations, tingling**. These tend to cluster right around the time of the injection, and can even spread through a group who see someone else react.

## The honest framing

This matters: ISRR is **real and worth taking seriously**, but it points to the *situation* being stressful, not to the vaccine causing an anxiety disorder. For most people these reactions are short-lived. Symptoms in the days afterward can also have ordinary causes — a mild fever, poor sleep, caffeine, or simply the background stress that a pandemic put everyone under.

## What people describe

Many say the hardest part wasn't the symptom itself but **not feeling believed** afterwards. Being anxious after a medical event doesn't make the anxiety imaginary.

## What can help

- Tell the clinician beforehand if needles frighten you — lying down, hydration, and a few minutes of observation help.
- Slow, steady breathing counters hyperventilation.
- If **anxiety or panic persists** well beyond the appointment, or interferes with daily life, that's a good reason to speak with a clinician or a mental-health professional — it's treatable.
""" + disclaimer);
        p16.setTags(Arrays.asList("symptom-guide", "medical", "mental-health", "anxiety"));
        p16.setPublishedAt(LocalDateTime.now().minusDays(18));
        blogPostRepository.save(p16);

        // Article 17 — Psychosis (framed honestly: no established causal link)
        BlogPost p17 = new BlogPost();
        p17.setSlug("psychosis-and-vaccination-what-the-evidence-shows");
        p17.setTitle("Psychosis and vaccination: coincidence, stress, and what the evidence shows");
        p17.setExcerpt("A serious topic that deserves a careful answer. What psychosis is, why timing " +
                       "isn't causation, and why — whatever the trigger — it needs urgent care.");
        p17.setAuthor("Privax health notes");
        p17.setContent("""
# Psychosis and vaccination: coincidence, stress, and what the evidence shows

**Psychosis** means losing contact with reality — hallucinations, delusions, or badly disorganised thinking. It is serious, frightening for everyone around it, and **treatable**. This post is about a question people do ask, and it deserves an honest answer rather than a comfortable one.

## What the evidence actually shows

There is **no established causal link** between COVID-19 vaccines and psychosis. What exists in the literature is a small number of **isolated case reports** — and case reports, by design, cannot show that one thing caused another.

Two facts make coincidences inevitable:

- New-onset psychosis has a **background rate** in the population that continues whether or not anyone is vaccinated. With millions of doses given, some new episodes will land near a vaccination purely by timing.
- The pandemic itself brought **severe psychological stress, isolation, disrupted sleep, and — with COVID infection — direct neurological effects**. These are powerful confounders.

So when someone experiences psychosis after a vaccine, the honest statement is *"this happened, and we cannot conclude the vaccine caused it."*

## Why Privax still listens

Being unable to prove causation is not the same as dismissing an experience. People and families who have lived through this often describe feeling unheard. The platform's job is to record what happened, honestly, without pretending to a certainty the evidence doesn't support.

## What to do — this part is not ambiguous

Regardless of any suspected trigger, psychosis is a situation that needs **prompt professional help**, and early treatment improves outcomes. Contact a GP or mental-health service; use a **crisis line** if things are escalating; and if there is any risk of harm to the person or others, treat it as an **emergency** and call emergency services.
""" + disclaimer);
        p17.setTags(Arrays.asList("symptom-guide", "medical", "mental-health", "psychosis"));
        p17.setPublishedAt(LocalDateTime.now().minusDays(21));
        blogPostRepository.save(p17);

        log.info("Inserted 16 long-form blog posts.");
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
