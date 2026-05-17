package com.covid.api.rest.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.covid.api.rest.dto.GroupedReportDTO;
import com.covid.api.rest.dto.SideEffectReportDTO;
import com.covid.api.rest.model.SeverityLevel;
import com.covid.api.rest.model.SideEffectReport;
import com.covid.api.rest.repository.SideEffectReportRepository;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class SideEffectService {
    private final SideEffectReportRepository sideEffectReportRepository;
    private static final Random random = new Random();

    @Autowired
    public SideEffectService(SideEffectReportRepository sideEffectReportRepository) {
        this.sideEffectReportRepository = sideEffectReportRepository;
    }

    public SideEffectReport reportSideEffect(SideEffectReportDTO sideEffectReportDTO) {
        SideEffectReport sideEffectReport = new SideEffectReport(
                sideEffectReportDTO.getAge(),
                sideEffectReportDTO.getSymptoms(),
                sideEffectReportDTO.getSeverity(),
                sideEffectReportDTO.getAdditionalInfo(),
                sideEffectReportDTO.getReportedAt(),
                sideEffectReportDTO.getVaccineName(),
                sideEffectReportDTO.getCity()
        );
        return sideEffectReportRepository.save(sideEffectReport);
    }

    public List<SideEffectReport> getAllSideEffects() {
        return sideEffectReportRepository.findAll();
    }

    public Page<SideEffectReport> findAll(Pageable pageable) {
        return sideEffectReportRepository.findAll(pageable);
    }

    public Page<SideEffectReport> findAll(Pageable pageable, Double epsilon) {
        Page<SideEffectReport> reports = sideEffectReportRepository.findAll(pageable);
        if (epsilon != null && epsilon > 0) {
            reports = applyDifferentialPrivacy(reports, epsilon);
        }

        return reports;
    }


    public Page<SideEffectReport> getSideEffectReports(int page, int size, Double epsilon) {
        Page<SideEffectReport> reports = sideEffectReportRepository.findAll(PageRequest.of(page, size));

        return reports;
    }


    public List<GroupedReportDTO> getGroupedReports(String vaccineName, String severityLevel) {
        return sideEffectReportRepository.findGroupedReports(vaccineName, severityLevel);
    }


    public List<GroupedReportDTO> getGroupedReports(String vaccineName, String severityLevel, Double epsilon) {
        List<GroupedReportDTO> reports = sideEffectReportRepository.findGroupedReports(vaccineName, severityLevel);

        if (epsilon != null && epsilon > 0) {
            reports = applyDifferentialPrivacy(reports, epsilon, severityLevel);
        }

        return reports;
    }

    /**
     * Applies Laplace noise only to the requested severity bucket(s).
     * When a specific severity is selected, the other counts are forced to 0
     * so noise doesn't leak false positives onto the map.
     */
    private List<GroupedReportDTO> applyDifferentialPrivacy(List<GroupedReportDTO> reports, double epsilon, String severityLevel) {
        double sensitivity = 1.0;
        double scale = sensitivity / epsilon;

        boolean filtered = severityLevel != null && !severityLevel.equalsIgnoreCase("ALL");
        String filter   = filtered ? severityLevel.toUpperCase() : null;

        for (GroupedReportDTO report : reports) {
            if (!filtered || "MILD".equals(filter)) {
                report.setMildCount(Math.max(0, (long) (report.getMildCount() + laplaceNoise(scale))));
            } else {
                report.setMildCount(0L);
            }

            if (!filtered || "MODERATE".equals(filter)) {
                report.setModerateCount(Math.max(0, (long) (report.getModerateCount() + laplaceNoise(scale))));
            } else {
                report.setModerateCount(0L);
            }

            if (!filtered || "SEVERE".equals(filter)) {
                report.setSevereCount(Math.max(0, (long) (report.getSevereCount() + laplaceNoise(scale))));
            } else {
                report.setSevereCount(0L);
            }

            if (!filtered || "FATAL".equals(filter)) {
                report.setFatalCount(Math.max(0, (long) (report.getFatalCount() + laplaceNoise(scale))));
            } else {
                report.setFatalCount(0L);
            }
        }

        return reports;
    }

    private double laplaceNoise(double scale) {
        double u = random.nextDouble() - 0.5;
        return -scale * Math.signum(u) * Math.log(1 - 2 * Math.abs(u));
    }






    private Page<SideEffectReport> applyDifferentialPrivacy(Page<SideEffectReport> reports, double epsilon) {
        double sensitivity = 5.0; // Higher sensitivity to make noise visible
        double scale = sensitivity / epsilon; // Noise scale depends on epsilon

        List<SideEffectReport> noisyReports = reports.stream().map(report -> {
            report.setAge(Math.max(18, (int) (report.getAge() + laplaceNoise(scale))));
            report.setSeverity(randomizeSeverity(report.getSeverity(), epsilon));
            report.setVaccineName(randomizeVaccine(report.getVaccineName(), epsilon));
            report.setCity(randomizeCity(report.getCity(), epsilon));
            report.setSymptoms(randomizeSymptoms(report.getSymptoms(), epsilon));

            return report;
        }).collect(Collectors.toList());

        return new PageImpl<>(noisyReports, reports.getPageable(), reports.getTotalElements());
    }

    private SeverityLevel randomizeSeverity(SeverityLevel original, double epsilon) {
        if (random.nextDouble() < (1 / epsilon)) { // Higher epsilon = less randomness
            SeverityLevel[] values = SeverityLevel.values();
            return values[random.nextInt(values.length)]; // Pick a random severity
        }
        return original;
    }

    private String randomizeVaccine(String original, double epsilon) {
        List<String> vaccines = Arrays.asList("Pfizer", "Moderna", "AstraZeneca", "Johnson & Johnson");

        if (random.nextDouble() < (1 / epsilon)) { // Introduce noise
            return vaccines.get(random.nextInt(vaccines.size()));
        }
        return original;
    }

    private String randomizeCity(String original, double epsilon) {
        List<String> cities = Arrays.asList("Bucharest", "Cluj-Napoca", "Timișoara", "Iași", "Brașov", "Constanța");
    
        if (random.nextDouble() < (1 / epsilon)) { // Introduce randomness
            return cities.get(random.nextInt(cities.size()));
        }
        return original;
    }

    private List<String> randomizeSymptoms(List<String> originalSymptoms, double epsilon) {
        List<String> commonSymptoms = Arrays.asList("Fatigue", "Fever", "Headache", "Muscle Pain", "Chills", "Dizziness");
        List<String> newSymptoms = new ArrayList<>(originalSymptoms);

        if (random.nextDouble() < (1 / epsilon)) { 
            newSymptoms.add(commonSymptoms.get(random.nextInt(commonSymptoms.size())));
        }

        if (random.nextDouble() < (1 / epsilon)) {
            if (!newSymptoms.isEmpty()) {
                newSymptoms.remove(random.nextInt(newSymptoms.size()));
            }
        }

        return newSymptoms;
    }

    





}
