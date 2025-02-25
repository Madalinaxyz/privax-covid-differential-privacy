package com.covid.api.rest.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.covid.api.rest.dto.AnalyticsDTO;
import com.covid.api.rest.repository.AppointmentRepository;
import com.covid.api.rest.repository.SideEffectReportRepository;

/**
 * Service class for aggregating analytics data.
 */
@Service
public class AnalyticsService {

    private final AppointmentRepository appointmentRepository;
    private final SideEffectReportRepository sideEffectReportRepository;

    @Autowired
    public AnalyticsService(AppointmentRepository appointmentRepository,
                            SideEffectReportRepository sideEffectReportRepository) {
        this.appointmentRepository = appointmentRepository;
        this.sideEffectReportRepository = sideEffectReportRepository;
    }

    /**
     * Aggregates analytics data including total appointments,
     * total vaccines administered, and total side-effect reports.
     *
     * @return an AnalyticsDTO containing aggregated analytics information.
     */
    public AnalyticsDTO getAggregatedAnalytics() {
        // Count total appointments
        long totalAppointments = appointmentRepository.count();

        // For this example, we assume each appointment results in a vaccine administered.
        long totalVaccinesAdministered = totalAppointments;

        // Count total side-effect reports
        long totalSideEffectReports = sideEffectReportRepository.count();

        return new AnalyticsDTO(totalAppointments, totalVaccinesAdministered, totalSideEffectReports);
    }
}
