package com.covid.api.rest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.covid.api.rest.dto.GroupedReportDTO;
import com.covid.api.rest.dto.SideEffectReportDTO;
import com.covid.api.rest.model.SideEffectReport;
import com.covid.api.rest.service.SideEffectService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;

import static com.covid.api.config.SwaggerConfig.BASIC_AUTH_SECURITY_SCHEME;

import java.util.List;

@RestController
@RequestMapping("/api/side-effects")
public class SideEffectController {

    private final SideEffectService sideEffectService;

    @Autowired
    public SideEffectController(com.covid.api.rest.service.SideEffectService sideEffectService) {
        this.sideEffectService = sideEffectService;
    }

    @PostMapping
    public SideEffectReport reportSideEffect(@Valid @RequestBody SideEffectReportDTO reportDTO) {
        return sideEffectService.reportSideEffect(reportDTO);
    }

    /** Clinician-only: submits a report on behalf of a patient. */
    @PostMapping("/clinician")
    public SideEffectReport reportSideEffectAsClinician(@Valid @RequestBody SideEffectReportDTO reportDTO) {
        return sideEffectService.reportSideEffectAsClinician(reportDTO);
    }

    // NOTE: There is deliberately NO GET endpoint that returns individual reports.
    // Per-record differential privacy is infeasible (curse of dimensionality), so we never
    // release individual rows publicly. Rigorous DP releases live in the aggregate endpoints
    // below (/grouped, /symptom-stats — fixed-epsilon, memoized) and in the budgeted researcher
    // API (/api/research/**). The browsable "View Reports" table in the UI is illustrative,
    // synthetic data generated client-side. See docs/differential-privacy-analysis.md.

    @GetMapping("/grouped")
    public ResponseEntity<List<GroupedReportDTO>> getGroupedReports(
        @RequestParam(value = "vaccineName", required = false) String vaccineName,
        @RequestParam(value = "severityLevel", required = false) String severityLevel,
        @RequestParam(value = "epsilon", required = false) Double epsilon
    ) {
        return ResponseEntity.ok(sideEffectService.getGroupedReports(vaccineName, severityLevel, epsilon));
    }

    /** DP-noised per-symptom prevalence counts (the privacy-preserving way to release symptom data). */
    @GetMapping("/symptom-stats")
    public ResponseEntity<List<com.covid.api.rest.dto.SymptomCountDTO>> getSymptomStats(
        @RequestParam(value = "epsilon",     required = false) Double epsilon,
        @RequestParam(value = "city",        required = false) String city,
        @RequestParam(value = "severity",    required = false) String severity,
        @RequestParam(value = "vaccineName", required = false) String vaccineName
    ) {
        return ResponseEntity.ok(sideEffectService.getSymptomStats(city, severity, vaccineName, epsilon));
    }
}
