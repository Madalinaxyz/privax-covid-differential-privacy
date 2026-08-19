package com.covid.api.rest.service;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.covid.api.rest.repository.VaccinationRecordRepository;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class VaccinationService {

    @Autowired
    private VaccinationRecordRepository vaccinationRecordRepository;

    /**
     * The single, fixed privacy level at which public counts are released.
     * <p>
     * Clients do NOT get to choose this. A caller-tunable epsilon on a live secret is exploitable
     * two ways: (1) pass a huge epsilon so the noise scale (= 1/epsilon) collapses to ~0 and the raw
     * count is returned; (2) query the same secret at two epsilons and solve the two linear equations
     * for the raw value. Pinning the release epsilon server-side removes both levers.
     * See docs/differential-privacy-analysis.md.
     */
    private static final double RELEASE_EPSILON = 1.0;

    // Genuine randomness — the released noise is a real Laplace draw, not a deterministic seed.
    private final Random random = new Random();

    /**
     * Each region's noisy count is drawn ONCE and then reused for every later request.
     * <p>
     * This is what makes repeated querying safe: an attacker who asks 1,000 times receives the SAME
     * number 1,000 times, so there is nothing to average away (the averaging attack) and no second
     * sample at a different epsilon to difference against (the epsilon-differencing attack). The map
     * is bounded by the number of distinct regions and is cleared on restart (the demo DB reseeds on
     * restart anyway, so a fresh noise draw per run is exactly what we want).
     */
    private final Map<String, Double> releasedCounts = new ConcurrentHashMap<>();

    /**
     * Returns the region's differentially-private count, drawing (and caching) genuine Laplace noise
     * on first access and returning that same value on every subsequent call.
     */
    private double releasedCountFor(String region) {
        return releasedCounts.computeIfAbsent(region, r -> {
            long rawCount = vaccinationRecordRepository.countByRegion(r);
            double scale = 1.0 / RELEASE_EPSILON; // counting query: sensitivity = 1
            return rawCount + freshLaplaceNoise(scale);
        });
    }

    /** A fresh Laplace sample via inverse transform sampling: noise = -scale * sgn(u) * ln(1 - 2|u|). */
    private double freshLaplaceNoise(double scale) {
        double r = random.nextDouble();          // [0, 1)
        if (r == 0.0) r = Math.ulp(0.5);         // avoid u == -0.5 -> log(0) -> infinite noise
        double u = r - 0.5;                       // (-0.5, 0.5)
        return -scale * Math.signum(u) * Math.log(1 - 2 * Math.abs(u));
    }

    /**
     * Public: the differentially-private vaccination count for a region.
     * <p>
     * The {@code epsilon} argument is accepted for API compatibility but intentionally IGNORED for
     * the released value — the release level is fixed server-side ({@link #RELEASE_EPSILON}). This is
     * deliberate: honouring a caller-supplied epsilon on a live public count is the vulnerability
     * (see {@link #RELEASE_EPSILON}). The epsilon slider is kept as an illustrative control that
     * operates on demo data, not on this endpoint.
     */
    public double getVaccinationCountByRegion(String region, double epsilon) {
        return releasedCountFor(region);
    }

    /**
     * Admin-only demonstration of the accuracy/privacy trade-off (raw vs noisy). Uses the same
     * released (memoized) noisy value so it is consistent with what the public endpoint returns.
     * The raw count is exposed here only because the route is locked to ADMIN at the security layer.
     */
    public CountComparison getVaccinationCountComparisonByRegion(String region, double epsilon) {
        long rawCount = vaccinationRecordRepository.countByRegion(region);
        return new CountComparison(rawCount, releasedCountFor(region));
    }
}
