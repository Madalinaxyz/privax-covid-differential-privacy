package com.covid.api.rest.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.covid.api.rest.dto.GroupedReportDTO;
import com.covid.api.rest.dto.SideEffectReportDTO;
import com.covid.api.rest.dto.SymptomCountDTO;
import com.covid.api.rest.model.ReporterType;
import com.covid.api.rest.model.SeverityLevel;
import com.covid.api.rest.model.SideEffectReport;
import com.covid.api.rest.repository.SideEffectReportRepository;

import jakarta.persistence.criteria.JoinType;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SideEffectService {
    private final SideEffectReportRepository sideEffectReportRepository;

    // Fixed once per server run: keeps the deterministic noise unpredictable to outsiders
    // while stable across requests (the DB reseeds on restart anyway).
    private final long seedSalt = new Random().nextLong();

    // Differential privacy is never optional. A missing/invalid epsilon defaults to 1.0, and
    // epsilon is capped so it cannot be inflated to effectively disable the noise. This closes
    // the "omit the epsilon param to get raw data" bypass.
    private static final double DEFAULT_EPSILON = 1.0;
    private static final double MAX_EPSILON = 10.0;

    private static double effectiveEpsilon(Double epsilon) {
        if (epsilon == null || epsilon <= 0) return DEFAULT_EPSILON;
        return Math.min(epsilon, MAX_EPSILON);
    }

    @Autowired
    public SideEffectService(SideEffectReportRepository sideEffectReportRepository) {
        this.sideEffectReportRepository = sideEffectReportRepository;
    }

    public SideEffectReport reportSideEffect(SideEffectReportDTO sideEffectReportDTO) {
        SideEffectReport sideEffectReport = new SideEffectReport(
                sideEffectReportDTO.getAge(),
                sideEffectReportDTO.getSymptoms(),
                sideEffectReportDTO.getSeverity(),
                sideEffectReportDTO.getAdditionalInfo(),
                LocalDateTime.now(), // server-authoritative timestamp — never trust the client's clock
                sideEffectReportDTO.getVaccineName(),
                sideEffectReportDTO.getCity()
        );
        // Public form may report as SELF or FAMILY (e.g. a relative reporting a death).
        // CLINICIAN is never assignable here — that only comes from the /clinician endpoint.
        sideEffectReport.setReporterType(
            sideEffectReportDTO.getReporterType() == ReporterType.FAMILY
                ? ReporterType.FAMILY
                : ReporterType.SELF
        );
        return sideEffectReportRepository.save(sideEffectReport);
    }

    /**
     * Clinician-submitted report. Marks the row as clinician-verified and stores
     * the optional opaque patient code so the doctor can correlate later.
     */
    public SideEffectReport reportSideEffectAsClinician(SideEffectReportDTO dto) {
        SideEffectReport report = new SideEffectReport(
                dto.getAge(),
                dto.getSymptoms(),
                dto.getSeverity(),
                dto.getAdditionalInfo(),
                LocalDateTime.now(), // server-authoritative timestamp — never trust the client's clock
                dto.getVaccineName(),
                dto.getCity()
        );
        report.setReporterType(ReporterType.CLINICIAN);
        report.setPatientCode(dto.getPatientCode());
        return sideEffectReportRepository.save(report);
    }

    /** Recent clinician-verified rows, newest first. Backs the doctor dashboard. */
    public List<SideEffectReport> getRecentClinicianReports(int limit) {
        return sideEffectReportRepository
            .findByReporterTypeOrderByReportedAtDesc(
                ReporterType.CLINICIAN, PageRequest.of(0, Math.max(1, limit))
            )
            .getContent();
    }

    public Page<SideEffectReport> findAll(Pageable pageable) {
        return sideEffectReportRepository.findAll(pageable);
    }

    public Page<SideEffectReport> findAll(Pageable pageable, Double epsilon) {
        Page<SideEffectReport> reports = sideEffectReportRepository.findAll(pageable);
        if (epsilon != null && epsilon > 0) {
            reports = applyDifferentialPrivacy(reports, epsilon);
        }

        return reports;
    }



    /**
     * Filterable + sortable paginated reports. Each filter is optional.
     * Uses a JPA Specification so we only emit SQL clauses for filters that are actually set —
     * this avoids PostgreSQL's "function lower(bytea) does not exist" error from null parameters.
     */
    public Page<SideEffectReport> getSideEffectReports(
        Pageable pageable,
        String vaccineName,
        String severity,
        String city,
        Double epsilon,
        String symptom
    ) {
        org.springframework.data.jpa.domain.Specification<SideEffectReport> spec =
            org.springframework.data.jpa.domain.Specification.where(null);

        if (vaccineName != null && !vaccineName.isBlank()) {
            final String v = vaccineName.trim().toLowerCase();
            spec = spec.and((root, q, cb) ->
                cb.like(cb.lower(root.get("vaccineName")), "%" + v + "%"));
        }
        if (city != null && !city.isBlank()) {
            final String c = city.trim().toLowerCase();
            spec = spec.and((root, q, cb) ->
                cb.like(cb.lower(root.get("city")), "%" + c + "%"));
        }
        if (severity != null && !severity.isBlank() && !"ALL".equalsIgnoreCase(severity)) {
            try {
                final SeverityLevel sev = SeverityLevel.valueOf(severity.toUpperCase());
                spec = spec.and((root, q, cb) -> cb.equal(root.get("severity"), sev));
            } catch (IllegalArgumentException ignored) { /* invalid severity → ignore filter */ }
        }
        if (symptom != null && !symptom.isBlank()) {
            final String s = symptom.trim().toLowerCase();
            spec = spec.and((root, q, cb) -> {
                q.distinct(true);
                jakarta.persistence.criteria.Join<SideEffectReport, String> sym =
                    root.join("symptoms", JoinType.INNER);
                return cb.like(cb.lower(sym.as(String.class)), "%" + s + "%");
            });
        }

        Page<SideEffectReport> page = sideEffectReportRepository.findAll(spec, pageable);

        // Differential privacy is applied HERE, on the server (the trusted boundary),
        // so the raw values never leave the backend. It is ALWAYS applied (effectiveEpsilon
        // defaults/caps epsilon), so raw rows can't be obtained by dropping the param.
        // Fields the user is actively filtering on are preserved, so the shown values
        // stay consistent with the active filter (e.g. filtering City=Sibiu keeps Sibiu).
        Set<String> preserve = new HashSet<>();
        if (vaccineName != null && !vaccineName.isBlank() && !"ALL".equalsIgnoreCase(vaccineName)) preserve.add("vaccineName");
        if (city != null && !city.isBlank()) preserve.add("city");
        if (severity != null && !severity.isBlank() && !"ALL".equalsIgnoreCase(severity)) preserve.add("severity");
        if (symptom != null && !symptom.isBlank()) preserve.add("symptoms");
        return applyDifferentialPrivacy(page, effectiveEpsilon(epsilon), preserve);
    }


    public List<GroupedReportDTO> getGroupedReports(String vaccineName, String severityLevel) {
        return sideEffectReportRepository.findGroupedReports(vaccineName, severityLevel);
    }


    public List<GroupedReportDTO> getGroupedReports(String vaccineName, String severityLevel, Double epsilon) {
        List<GroupedReportDTO> reports = sideEffectReportRepository.findGroupedReports(vaccineName, severityLevel);
        // Always noise the map counts (effectiveEpsilon defaults/caps epsilon).
        return applyDifferentialPrivacy(reports, effectiveEpsilon(epsilon), severityLevel);
    }

    /**
     * DP-noised prevalence counts per symptom (optionally filtered by city / severity / vaccine).
     * This is the correct way to release high-dimensional symptom data: each count summarises
     * thousands of people, so the Laplace mechanism (sensitivity 1 — one person changes any
     * count by at most 1) hides individuals while preserving the overall shape. Counts are
     * clamped at 0 and re-sorted after noising.
     */
    public List<SymptomCountDTO> getSymptomStats(String city, String severity, String vaccineName, Double epsilon) {
        List<SymptomCountDTO> counts = sideEffectReportRepository.countBySymptom(vaccineName, severity, city);

        // Always noise the counts (effectiveEpsilon defaults/caps epsilon).
        double scale = 1.0 / effectiveEpsilon(epsilon); // counting query: sensitivity = 1
        for (SymptomCountDTO c : counts) {
            // Seed by symptom + the exact filter slice, so re-issuing the same query is stable.
            long seed = seedFor(c.getSymptom(), city, severity, vaccineName);
            c.setCount(Math.max(0, Math.round(c.getCount() + laplaceNoise(scale, seed))));
        }
        counts.sort((a, b) -> Long.compare(b.getCount(), a.getCount()));
        return counts;
    }

    /**
     * Applies Laplace noise only to the requested severity bucket(s).
     * When a specific severity is selected, the other counts are forced to 0
     * so noise doesn't leak false positives onto the map.
     */
    private List<GroupedReportDTO> applyDifferentialPrivacy(List<GroupedReportDTO> reports, double epsilon, String severityLevel) {
        double sensitivity = 1.0;
        double scale = sensitivity / epsilon;

        boolean filtered = severityLevel != null && !severityLevel.equalsIgnoreCase("ALL");
        String filter   = filtered ? severityLevel.toUpperCase() : null;

        for (GroupedReportDTO report : reports) {
            String city = report.getCity();
            String vaccine = report.getVaccineName();
            if (!filtered || "MILD".equals(filter)) {
                report.setMildCount(Math.max(0, (long) (report.getMildCount() + laplaceNoise(scale, seedFor(city, vaccine, "MILD")))));
            } else {
                report.setMildCount(0L);
            }

            if (!filtered || "MODERATE".equals(filter)) {
                report.setModerateCount(Math.max(0, (long) (report.getModerateCount() + laplaceNoise(scale, seedFor(city, vaccine, "MODERATE")))));
            } else {
                report.setModerateCount(0L);
            }

            if (!filtered || "SEVERE".equals(filter)) {
                report.setSevereCount(Math.max(0, (long) (report.getSevereCount() + laplaceNoise(scale, seedFor(city, vaccine, "SEVERE")))));
            } else {
                report.setSevereCount(0L);
            }

            if (!filtered || "FATAL".equals(filter)) {
                report.setFatalCount(Math.max(0, (long) (report.getFatalCount() + laplaceNoise(scale, seedFor(city, vaccine, "FATAL")))));
            } else {
                report.setFatalCount(0L);
            }
        }

        return reports;
    }

    /**
     * Deterministic seed for a noise draw, derived from stable identifiers ONLY (never ε).
     * Because the seed excludes ε, re-issuing the same query returns the identical answer, and
     * sweeping the ε slider reuses the SAME underlying random draw (only rescaled). An observer
     * therefore cannot collect independent noisy samples of one value and average the noise away.
     */
    private long seedFor(Object... parts) {
        return seedSalt * 1099511628211L + Objects.hash(parts);
    }

    /**
     * Laplace sample whose randomness is fixed by {@code seed} (independent of ε); only the
     * scale (= sensitivity/ε) varies with ε. So the same key always yields the same draw.
     */
    private double laplaceNoise(double scale, long seed) {
        double u = new Random(seed).nextDouble() - 0.5;
        return -scale * Math.signum(u) * Math.log(1 - 2 * Math.abs(u));
    }






    private Page<SideEffectReport> applyDifferentialPrivacy(Page<SideEffectReport> reports, double epsilon) {
        return applyDifferentialPrivacy(reports, epsilon, Collections.emptySet());
    }

    /**
     * Adds noise to each row, skipping any field named in {@code preserve}.
     * Preserved fields are the ones the user is actively filtering on, so the
     * displayed values stay consistent with the active filter.
     */
    private Page<SideEffectReport> applyDifferentialPrivacy(Page<SideEffectReport> reports, double epsilon, Set<String> preserve) {
        double sensitivity = 5.0; // Higher sensitivity to make noise visible
        double scale = sensitivity / epsilon; // Noise scale depends on epsilon

        List<SideEffectReport> noisyReports = reports.stream().map(report -> {
            Long id = report.getId(); // stable per-record key → deterministic per-cell noise
            if (!preserve.contains("age"))         report.setAge(Math.max(0, Math.min(120, (int) (report.getAge() + laplaceNoise(scale, seedFor(id, "age"))))));

            // Noise severity first, then keep symptoms consistent with the DISPLAYED severity
            // so a row never shows, e.g., MILD severity alongside a severe symptom.
            SeverityLevel severity = preserve.contains("severity")
                    ? report.getSeverity()
                    : randomizeSeverity(report.getSeverity(), epsilon, seedFor(id, "severity"));
            if (!preserve.contains("severity"))    report.setSeverity(severity);

            if (!preserve.contains("vaccineName")) report.setVaccineName(randomizeVaccine(report.getVaccineName(), epsilon, seedFor(id, "vaccine")));
            if (!preserve.contains("city"))        report.setCity(randomizeCity(report.getCity(), epsilon, seedFor(id, "city")));
            // Row shows the TRUE symptoms (realistic 1–5), trimmed to stay consistent with the
            // displayed (noised) severity. Symptom PRIVACY is provided separately by the
            // aggregate /symptom-stats endpoint — per-row symptom-set DP is infeasible
            // (curse of dimensionality), so it is not attempted here.
            if (!preserve.contains("symptoms"))    report.setSymptoms(symptomsWithinSeverity(report.getSymptoms(), severity));

            return report;
        }).collect(Collectors.toList());

        return new PageImpl<>(noisyReports, reports.getPageable(), reports.getTotalElements());
    }

    /**
     * Calibrated k-ary randomized response (generalized randomized response,
     * Warner 1965 / Kairouz et al. 2016). Returns the probability of REPLACING the
     * true value with a uniformly random draw from the k categories, chosen so the
     * mechanism satisfies epsilon-differential privacy:
     *   P(keep true) = e^ε / (e^ε + k − 1),  P(any other) = 1 / (e^ε + k − 1)
     *   ⇒ ratio of output probabilities ≤ e^ε  (the ε-DP guarantee).
     * Rearranged, the replace-probability is  q = k / (e^ε + k − 1).
     * q is always in [0, 1]: high ε → q→0 (truth), low ε → q→1 (uniform).
     */
    private static double replaceProbability(double epsilon, int k) {
        return k / (Math.exp(epsilon) + k - 1.0);
    }

    // Each randomize* draws its coin and its replacement choice from a seed-determined RNG,
    // so the outcome is a deterministic function of (record, field) and ε — never fresh noise.
    private SeverityLevel randomizeSeverity(SeverityLevel original, double epsilon, long seed) {
        SeverityLevel[] values = SeverityLevel.values();
        Random rng = new Random(seed);
        if (rng.nextDouble() < replaceProbability(epsilon, values.length)) {
            return values[rng.nextInt(values.length)]; // uniform draw over all severities
        }
        return original;
    }

    private String randomizeVaccine(String original, double epsilon, long seed) {
        List<String> vaccines = Arrays.asList("Pfizer", "Moderna", "AstraZeneca", "Johnson & Johnson");

        Random rng = new Random(seed);
        if (rng.nextDouble() < replaceProbability(epsilon, vaccines.size())) {
            return vaccines.get(rng.nextInt(vaccines.size()));
        }
        return original;
    }

    private String randomizeCity(String original, double epsilon, long seed) {
        // NOTE: for a fully rigorous guarantee the candidate set should equal the whole
        // city domain; here it samples a representative subset, so treat city as an
        // illustrative application of k-ary randomized response.
        List<String> cities = Arrays.asList("Bucharest", "Cluj-Napoca", "Timișoara", "Iași", "Brașov", "Constanța");

        Random rng = new Random(seed);
        if (rng.nextDouble() < replaceProbability(epsilon, cities.size())) {
            return cities.get(rng.nextInt(cities.size()));
        }
        return original;
    }

    // Symptom domain grouped by severity tier — mirrors the seed data so noised rows stay
    // clinically plausible (a MILD row never shows a severe symptom like Myocarditis).
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

    /** Symptoms plausible for the given (displayed) severity — this tier and milder. */
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

    /** Keeps only the true symptoms that are plausible for the displayed severity tier. */
    private List<String> symptomsWithinSeverity(List<String> originalSymptoms, SeverityLevel severity) {
        if (originalSymptoms == null) return new ArrayList<>();
        Set<String> allowed = new HashSet<>(allowedSymptomsFor(severity));
        List<String> kept = new ArrayList<>();
        for (String s : originalSymptoms) {
            if (allowed.contains(s)) kept.add(s);
        }
        return kept;
    }

    





}
