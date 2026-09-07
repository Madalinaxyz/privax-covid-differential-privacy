package com.covid.api.rest.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.covid.api.rest.model.SeverityLevel;
import com.covid.api.rest.repository.SideEffectReportRepository;
import com.covid.api.user.UserService;

@RequiredArgsConstructor
@RestController
@RequestMapping("/public")
public class PublicController {

    private final UserService userService;
    private final SideEffectReportRepository sideEffectReportRepository;

    @GetMapping("/numberOfUsers")
    public Integer getNumberOfUsers() {
        return userService.getUsers().size();
    }

    /**
     * Aggregate platform stats for the homepage counters.
     * Returns real DB-derived numbers so the UI never shows misleading values.
     */
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        long total      = sideEffectReportRepository.count();
        long vaccines   = sideEffectReportRepository.countDistinctVaccines();
        long symptoms   = sideEffectReportRepository.countDistinctSymptoms();

        // "Resolved" = MILD + MODERATE reports (i.e., everyone who recovered without serious outcomes)
        long mild       = sideEffectReportRepository.countBySeverity(SeverityLevel.MILD);
        long moderate   = sideEffectReportRepository.countBySeverity(SeverityLevel.MODERATE);
        long resolvedPct = total == 0 ? 0 : Math.round(100.0 * (mild + moderate) / total);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalReports",       total);
        stats.put("vaccinesTracked",    vaccines);
        stats.put("symptomsDocumented", symptoms);
        stats.put("resolvedPercentage", resolvedPct);
        return stats;
    }
}
