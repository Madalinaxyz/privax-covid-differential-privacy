package com.covid.api.rest.service;

import org.springframework.stereotype.Service;
import java.util.Random;

/**
 * Service class for applying differential privacy mechanisms.
 * <p>
 * This example demonstrates a simple implementation that adds Laplace noise
 * to numerical values based on the configured epsilon and delta values.
 */
@Service
public class DifferentialPrivacyService {

    private final double epsilon;
    private final double delta;
    private final Random random;

    /**
     * Constructs the DifferentialPrivacyService with the provided epsilon and delta.
     *
     * @param epsilon the privacy budget parameter.
     * @param delta   the probability of privacy breach.
     */
    public DifferentialPrivacyService(double epsilon, double delta) {
        this.epsilon = epsilon;
        this.delta = delta;
        this.random = new Random();
    }

    /**
     * Applies Laplace noise to the provided value.
     * <p>
     * For demonstration, we assume a sensitivity of 1.0. The scale for the Laplace noise
     * is computed as sensitivity/epsilon.
     *
     * @param value the original numerical value.
     * @return the sanitized value with added noise.
     */
    public double addLaplaceNoise(double value) {
        double sensitivity = 1.0;
        double scale = sensitivity / epsilon;
        double noise = generateLaplaceNoise(scale);
        return value + noise;
    }

    /**
     * Generates Laplace noise using inverse transform sampling.
     *
     * @param scale the scale parameter (sensitivity/epsilon).
     * @return a noise value sampled from the Laplace distribution.
     */
    private double generateLaplaceNoise(double scale) {
        double u = random.nextDouble() - 0.5; // Uniform random number in [-0.5, 0.5]
        return -scale * Math.signum(u) * Math.log(1 - 2 * Math.abs(u));
    }

    // Additional methods for binning data, thresholding, or generating synthetic data can be added here.
}
