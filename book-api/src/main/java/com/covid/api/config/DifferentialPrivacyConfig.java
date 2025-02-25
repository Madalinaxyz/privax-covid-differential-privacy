package com.covid.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.covid.api.rest.service.DifferentialPrivacyService;

/**
 * Configuration class for setting up differential privacy parameters.
 * <p>
 * This class reads the epsilon and delta values from the application.properties file
 * (with default values provided) and uses them to create a DifferentialPrivacyService bean.
 */
@Configuration
public class DifferentialPrivacyConfig {

    // Inject epsilon from application.properties, defaulting to 1.0 if not set.
    @Value("${differentialprivacy.epsilon:1.0}")
    private double epsilon;

    // Inject delta from application.properties, defaulting to 0.00001 if not set.
    @Value("${differentialprivacy.delta:0.00001}")
    private double delta;

    /**
     * Creates a bean for DifferentialPrivacyService with the configured epsilon and delta values.
     *
     * @return an instance of DifferentialPrivacyService
     */
    @Bean
    public DifferentialPrivacyService differentialPrivacyService() {
        return new DifferentialPrivacyService(epsilon, delta);
    }
}
