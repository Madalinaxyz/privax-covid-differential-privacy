package com.covid.api.rest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    // @Operation(security = {@SecurityRequirement(name = BASIC_AUTH_SECURITY_SCHEME)})
    // @GetMapping
    // public Page<SideEffectReport> getSideEffects(
    //     Pageable pageable,
    //     @RequestParam(value = "epsilon", required = false) Double epsilon) {
    //     return sideEffectService.findAll(pageable, epsilon);
    // }


    @GetMapping
    public ResponseEntity<Page<SideEffectReport>> getReports(
        Pageable pageable,
        @RequestParam(value = "epsilon",     required = false) Double epsilon,
        @RequestParam(value = "vaccineName", required = false) String vaccineName,
        @RequestParam(value = "severity",    required = false) String severity,
        @RequestParam(value = "city",        required = false) String city,
        @RequestParam(value = "symptom",     required = false) String symptom
    ) {
        Page<SideEffectReport> reports = sideEffectService.getSideEffectReports(
            pageable, vaccineName, severity, city, epsilon, symptom
        );
        return ResponseEntity.ok(reports);
    }

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
