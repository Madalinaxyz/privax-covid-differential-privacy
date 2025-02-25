package com.covid.api.util;

import java.util.Random;

/**
 * Utility class providing helper methods for differential privacy operations.
 */
public class PrivacyUtil {

    private static final Random random = new Random();

    /**
     * Generates Laplace noise using inverse transform sampling.
     *
     * @param scale the scale parameter (typically sensitivity/epsilon)
     * @return a noise value sampled from the Laplace distribution.
     */
    public static double generateLaplaceNoise(double scale) {
        double u = random.nextDouble() - 0.5; // uniform random in [-0.5, 0.5]
        return -scale * Math.signum(u) * Math.log(1 - 2 * Math.abs(u));
    }

    /**
     * Generates Gaussian noise.
     *
     * @param stdDev the standard deviation for the Gaussian distribution.
     * @return a noise value sampled from the Gaussian distribution.
     */
    public static double generateGaussianNoise(double stdDev) {
        return random.nextGaussian() * stdDev;
    }

    /**
     * Sanitizes a numerical value by adding Laplace noise.
     * <p>
     * This method computes the noise scale using the provided sensitivity and epsilon,
     * generates Laplace noise, and returns the value after noise addition.
     *
     * @param value       the original numerical value.
     * @param sensitivity the sensitivity of the function (default is 1.0 in many cases).
     * @param epsilon     the privacy budget parameter.
     * @return the sanitized value with Laplace noise added.
     */
    public static double sanitizeWithLaplace(double value, double sensitivity, double epsilon) {
        double scale = sensitivity / epsilon;
        double noise = generateLaplaceNoise(scale);
        return value + noise;
    }
}
