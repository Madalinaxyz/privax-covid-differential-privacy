package com.covid.api.rest.dto;

/**
 * Response for a budgeted researcher count query: the differentially-private (noisy) count, the
 * epsilon this query spent, and the researcher's total / remaining budget after the spend.
 * The raw count is never included.
 */
public record ResearchCountResponse(
        double noisyCount,
        double epsilonSpent,
        double budgetTotal,
        double budgetRemaining
) {}
