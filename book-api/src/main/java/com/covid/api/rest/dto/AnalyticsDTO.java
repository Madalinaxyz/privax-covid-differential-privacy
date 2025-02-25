package com.covid.api.rest.dto;

/**
 * Data Transfer Object for aggregated analytics data.
 * Contains metrics such as total appointments, total vaccines administered,
 * and total side-effect reports.
 */
public class AnalyticsDTO {

    private long totalAppointments;
    private long totalVaccinesAdministered;
    private long totalSideEffectReports;

    // Default constructor
    public AnalyticsDTO() {
    }

    // Parameterized constructor
    public AnalyticsDTO(long totalAppointments, long totalVaccinesAdministered, long totalSideEffectReports) {
        this.totalAppointments = totalAppointments;
        this.totalVaccinesAdministered = totalVaccinesAdministered;
        this.totalSideEffectReports = totalSideEffectReports;
    }

    /**
     * Returns the total number of appointments.
     *
     * @return total appointments.
     */
    public long getTotalAppointments() {
        return totalAppointments;
    }

    /**
     * Sets the total number of appointments.
     *
     * @param totalAppointments the total appointments to set.
     */
    public void setTotalAppointments(long totalAppointments) {
        this.totalAppointments = totalAppointments;
    }

    /**
     * Returns the total number of vaccines administered.
     *
     * @return total vaccines administered.
     */
    public long getTotalVaccinesAdministered() {
        return totalVaccinesAdministered;
    }

    /**
     * Sets the total number of vaccines administered.
     *
     * @param totalVaccinesAdministered the total vaccines administered to set.
     */
    public void setTotalVaccinesAdministered(long totalVaccinesAdministered) {
        this.totalVaccinesAdministered = totalVaccinesAdministered;
    }

    /**
     * Returns the total number of side-effect reports.
     *
     * @return total side-effect reports.
     */
    public long getTotalSideEffectReports() {
        return totalSideEffectReports;
    }

    /**
     * Sets the total number of side-effect reports.
     *
     * @param totalSideEffectReports the total side-effect reports to set.
     */
    public void setTotalSideEffectReports(long totalSideEffectReports) {
        this.totalSideEffectReports = totalSideEffectReports;
    }
}
