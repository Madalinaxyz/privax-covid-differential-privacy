package com.covid.api.rest.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

/**
 * Unit tests for the two differential-privacy mechanisms, checked in isolation (no DB).
 * They verify the statistical properties the ε-DP guarantee depends on.
 */
class DifferentialPrivacyTest {

    // The service only needs its repository for query methods, not for the noise itself,
    // so a null repository is enough to reach the package-private noise method.
    private final SideEffectService service = new SideEffectService(null);

    @Test
    void laplaceNoiseHasZeroMeanAndTheCorrectSpread() {
        int n = 1_000_000;
        double scale = 1.0;
        double sum = 0, sumSq = 0;
        for (int i = 0; i < n; i++) {
            double x = service.freshLaplaceNoise(scale);
            sum += x;
            sumSq += x * x;
        }
        double mean = sum / n;
        double variance = sumSq / n - mean * mean;
        // Laplace(0, b): mean = 0, variance = 2 b^2
        assertThat(mean).isCloseTo(0.0, within(0.02));
        assertThat(variance).isCloseTo(2 * scale * scale, within(0.05));
    }

    @Test
    void laplaceSpreadScalesWithTheScaleParameter() {
        int n = 1_000_000;
        double scale = 10.0; // corresponds to epsilon = 0.1 for a counting query
        double sum = 0, sumSq = 0;
        for (int i = 0; i < n; i++) {
            double x = service.freshLaplaceNoise(scale);
            sum += x;
            sumSq += x * x;
        }
        double mean = sum / n;
        double variance = sumSq / n - mean * mean;
        assertThat(mean).isCloseTo(0.0, within(0.2));
        assertThat(variance).isCloseTo(2 * scale * scale, within(6.0)); // ~200, within 3%
    }

    @Test
    void replaceProbabilityMatchesTheFormula() {
        // q = k / (e^epsilon + k - 1)
        for (double eps : new double[]{0.5, 1.0, 2.0}) {
            for (int k : new int[]{4, 29}) {
                double expected = k / (Math.exp(eps) + k - 1.0);
                assertThat(SideEffectService.replaceProbability(eps, k)).isCloseTo(expected, within(1e-12));
            }
        }
    }

    @Test
    void randomizedResponseGivesTheCorrectEpsilonDpRatio() {
        // With replace-probability q, P(keep true) = (1-q) + q/k and P(any other) = q/k.
        // Their ratio must equal e^epsilon exactly, which is the ε-DP guarantee.
        for (double eps : new double[]{0.5, 1.0, 2.0}) {
            for (int k : new int[]{4, 29}) {
                double q = SideEffectService.replaceProbability(eps, k);
                double pKeep = (1 - q) + q / k;
                double pOther = q / k;
                assertThat(pKeep / pOther).isCloseTo(Math.exp(eps), within(1e-9));
            }
        }
    }
}
