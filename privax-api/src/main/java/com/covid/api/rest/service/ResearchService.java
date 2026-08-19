package com.covid.api.rest.service;

import com.covid.api.rest.dto.ResearchCountResponse;
import com.covid.api.rest.model.SeverityLevel;
import com.covid.api.rest.model.SideEffectReport;
import com.covid.api.rest.repository.SideEffectReportRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.Random;

/**
 * Interactive, budgeted differential-privacy release for authenticated researchers.
 * <p>
 * Each call debits the researcher's cumulative epsilon budget (see {@link PrivacyBudgetService}) and,
 * if the budget allows, returns a count with <b>fresh independent</b> Laplace noise. This is the
 * standard interactive DP model: fresh noise per query is safe precisely because the total number of
 * queries is bounded by the budget, so worst-case leakage is capped. Contrast with the public
 * endpoints, which release one memoized value per secret because their callers are anonymous and
 * therefore un-budgetable.
 */
@Service
public class ResearchService {

    private final SideEffectReportRepository sideEffectReportRepository;
    private final PrivacyBudgetService budget;
    private final Random random = new Random();

    @Autowired
    public ResearchService(SideEffectReportRepository sideEffectReportRepository, PrivacyBudgetService budget) {
        this.sideEffectReportRepository = sideEffectReportRepository;
        this.budget = budget;
    }

    /**
     * Budgeted, differentially-private count of reports matching the optional filters.
     * The budget is debited BEFORE the data is read, so a rejected (over-budget) query never touches
     * the database.
     */
    public ResearchCountResponse budgetedCount(
            String researcher, double epsilon, String vaccineName, String city, String severity) {

        double remaining = budget.spend(researcher, epsilon); // throws if invalid / over budget

        long raw = sideEffectReportRepository.count(buildSpec(vaccineName, city, severity));
        double noisy = Math.max(0, raw + freshLaplaceNoise(1.0 / epsilon)); // counting query: sensitivity = 1

        return new ResearchCountResponse(noisy, epsilon, PrivacyBudgetService.TOTAL_EPSILON, remaining);
    }

    /** Filters live on the report root (no symptom join), so the count is an exact per-row count. */
    private Specification<SideEffectReport> buildSpec(String vaccineName, String city, String severity) {
        Specification<SideEffectReport> spec = Specification.where(null);

        if (vaccineName != null && !vaccineName.isBlank() && !"ALL".equalsIgnoreCase(vaccineName)) {
            final String v = vaccineName.trim().toLowerCase();
            spec = spec.and((root, q, cb) -> cb.like(cb.lower(root.get("vaccineName")), "%" + v + "%"));
        }
        if (city != null && !city.isBlank() && !"ALL".equalsIgnoreCase(city)) {
            final String c = city.trim().toLowerCase();
            spec = spec.and((root, q, cb) -> cb.like(cb.lower(root.get("city")), "%" + c + "%"));
        }
        if (severity != null && !severity.isBlank() && !"ALL".equalsIgnoreCase(severity)) {
            try {
                final SeverityLevel sev = SeverityLevel.valueOf(severity.toUpperCase());
                spec = spec.and((root, q, cb) -> cb.equal(root.get("severity"), sev));
            } catch (IllegalArgumentException ignored) { /* invalid severity → ignore filter */ }
        }
        return spec;
    }

    /** A fresh Laplace draw via inverse transform sampling — independent per query, by design. */
    private double freshLaplaceNoise(double scale) {
        double r = random.nextDouble();          // [0, 1)
        if (r == 0.0) r = Math.ulp(0.5);         // avoid u == -0.5 -> log(0) -> infinite noise
        double u = r - 0.5;                       // (-0.5, 0.5)
        return -scale * Math.signum(u) * Math.log(1 - 2 * Math.abs(u));
    }
}
