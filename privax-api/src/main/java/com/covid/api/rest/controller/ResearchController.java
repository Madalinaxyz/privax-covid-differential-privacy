package com.covid.api.rest.controller;

import com.covid.api.rest.dto.ResearchCountResponse;
import com.covid.api.rest.service.PrivacyBudgetService;
import com.covid.api.rest.service.ResearchService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.Map;

/**
 * Authenticated researcher API: interactive differential-privacy queries against a per-researcher
 * cumulative epsilon budget. All routes under /api/research require authentication (see
 * SecurityConfig); the budget is charged to the authenticated username.
 */
@RestController
@RequestMapping("/api/research")
public class ResearchController {

    private final ResearchService researchService;
    private final PrivacyBudgetService budget;

    public ResearchController(ResearchService researchService, PrivacyBudgetService budget) {
        this.researchService = researchService;
        this.budget = budget;
    }

    /**
     * Differentially-private count of reports matching the optional filters. Spends {@code epsilon}
     * from the caller's budget and returns the noisy count plus the remaining budget. Returns 429
     * once the budget is exhausted, 400 for an invalid epsilon.
     */
    @GetMapping("/side-effects/count")
    public ResearchCountResponse count(
            Principal principal,
            @RequestParam double epsilon,
            @RequestParam(required = false) String vaccineName,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String severity) {
        return researchService.budgetedCount(principal.getName(), epsilon, vaccineName, city, severity);
    }

    /** The caller's current privacy budget (total and remaining), without spending any of it. */
    @GetMapping("/budget")
    public Map<String, Double> budget(Principal principal) {
        return Map.of(
                "budgetTotal", PrivacyBudgetService.TOTAL_EPSILON,
                "budgetRemaining", budget.remaining(principal.getName())
        );
    }
}
