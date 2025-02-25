package com.covid.api.rest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.covid.api.rest.service.CountComparison;
import com.covid.api.rest.service.VaccinationService;

@RestController
@RequestMapping("/api/vaccinations")
public class VaccinationDataController {

    @Autowired
    private VaccinationService vaccinationService;

    /**
     * Endpoint pentru obținerea numărului de vaccinări pentru o regiune cu DP.
     * Parametrii:
     *   - region: regiunea de interogat
     *   - epsilon: parametrul de confidențialitate
     */
    @GetMapping("/region")
    public ResponseEntity<Double> getVaccinationCountByRegion(
            @RequestParam String region,
            @RequestParam double epsilon) {
        double noisyCount = vaccinationService.getVaccinationCountByRegion(region, epsilon);
        return ResponseEntity.ok(noisyCount);
    }

    /**
     * Endpoint pentru compararea valorii brute și a celei cu zgomot, pentru a demonstra trade-off-ul.
     */
    @GetMapping("/region/compare")
    public ResponseEntity<CountComparison> compareVaccinationCountByRegion(
            @RequestParam String region,
            @RequestParam double epsilon) {
        CountComparison comparison = vaccinationService.getVaccinationCountComparisonByRegion(region, epsilon);
        return ResponseEntity.ok(comparison);
    }

    @GetMapping("/test")
    public String test() {
        return "Scuccess";
    }
}
