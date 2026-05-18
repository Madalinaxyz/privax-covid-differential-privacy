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
    public SideEffectReport reportSideEffect(@RequestBody SideEffectReportDTO reportDTO) {
        return sideEffectService.reportSideEffect(reportDTO);
    }

    @GetMapping("/all")
    public List<SideEffectReport> getAllSideEffects() {
        return sideEffectService.getAllSideEffects();
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
        @RequestParam(value = "city",        required = false) String city
    ) {
        Page<SideEffectReport> reports = sideEffectService.getSideEffectReports(
            pageable, vaccineName, severity, city
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
}
