package com.covid.api.rest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import com.covid.api.rest.dto.SideEffectReportDTO;
import com.covid.api.rest.model.SideEffectReport;
import com.covid.api.rest.service.SideEffectService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import static com.covid.api.config.SwaggerConfig.BASIC_AUTH_SECURITY_SCHEME;

import java.util.List;

/**
 * REST controller for handling side-effect reporting.
 */
@RestController
@RequestMapping("/api/side-effects")
public class SideEffectController {

    private final SideEffectService sideEffectService;

    @Autowired
    public SideEffectController(com.covid.api.rest.service.SideEffectService sideEffectService) {
        this.sideEffectService = sideEffectService;
    }

    /**
     * Endpoint for users to submit a side-effect report anonymously.
     *
     * @param reportDTO the side-effect report data.
     * @return the created SideEffectReport object.
     */
    @PostMapping
    public SideEffectReport reportSideEffect(@RequestBody SideEffectReportDTO reportDTO) {
        return sideEffectService.reportSideEffect(reportDTO);
    }

    /**
     * (Optional) Endpoint to retrieve all side-effect reports.
     * This can be used for internal analysis and may be restricted.
     *
     * @return a list of all SideEffectReport objects.
     */
    @GetMapping("/all")
    public List<SideEffectReport> getAllSideEffects() {
        return sideEffectService.getAllSideEffects();
    }

    @Operation(security = {@SecurityRequirement(name = BASIC_AUTH_SECURITY_SCHEME)})
    @GetMapping
    public Page<SideEffectReport> getSideEffects(Pageable pageable) {
        return sideEffectService.findAll(pageable);
    }
}
