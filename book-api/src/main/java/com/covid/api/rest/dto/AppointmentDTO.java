package com.covid.api.rest.dto;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for appointment scheduling.
 * Contains necessary information for creating or updating an appointment.
 */
public class AppointmentDTO {

    private String userName;
    private LocalDateTime appointmentDate;
    private String location;
    private Long vaccineId;

    // Default constructor
    public AppointmentDTO() {
    }

    // Parameterized constructor
    public AppointmentDTO(String userName, LocalDateTime appointmentDate, String location, Long vaccineId) {
        this.userName = userName;
        this.appointmentDate = appointmentDate;
        this.location = location;
        this.vaccineId = vaccineId;
    }

    // Getters and Setters

    /**
     * Returns the name of the user scheduling the appointment.
     *
     * @return userName of the appointment owner.
     */
    public String getUserName() {
        return userName;
    }

    /**
     * Sets the name of the user scheduling the appointment.
     *
     * @param userName the user's name.
     */
    public void setUserName(String userName) {
        this.userName = userName;
    }

    /**
     * Returns the date and time of the appointment.
     *
     * @return appointmentDate of the appointment.
     */
    public LocalDateTime getAppointmentDate() {
        return appointmentDate;
    }

    /**
     * Sets the date and time for the appointment.
     *
     * @param appointmentDate the desired appointment date and time.
     */
    public void setAppointmentDate(LocalDateTime appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    /**
     * Returns the location where the appointment will take place.
     *
     * @return location for the appointment.
     */
    public String getLocation() {
        return location;
    }

    /**
     * Sets the location for the appointment.
     *
     * @param location the appointment location.
     */
    public void setLocation(String location) {
        this.location = location;
    }

    /**
     * Returns the ID of the vaccine associated with the appointment.
     *
     * @return vaccineId.
     */
    public Long getVaccineId() {
        return vaccineId;
    }

    /**
     * Sets the ID of the vaccine associated with the appointment.
     *
     * @param vaccineId the vaccine's ID.
     */
    public void setVaccineId(Long vaccineId) {
        this.vaccineId = vaccineId;
    }
}
