package com.covid.api.rest.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.covid.api.rest.dto.SideEffectReportDTO;
import com.covid.api.rest.model.SideEffectReport;
import com.covid.api.rest.repository.SideEffectReportRepository;

import java.util.List;

@Service
public class SideEffectService {
    private final SideEffectReportRepository sideEffectReportRepository;

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
}
