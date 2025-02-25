package com.covid.api.rest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.covid.api.rest.dto.AppointmentDTO;
import com.covid.api.rest.model.Appointment;
import com.covid.api.rest.service.AppointmentService;

import java.util.List;

/**
 * REST controller for managing vaccine appointment scheduling.
 */
@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @Autowired
    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    /**
     * Retrieves a list of all appointments.
     *
     * @return a list of Appointment objects.
     */
    @GetMapping
    public List<Appointment> getAllAppointments() {
        return appointmentService.getAllAppointments();
    }

    /**
     * Retrieves a specific appointment by its ID.
     *
     * @param id the ID of the appointment.
     * @return the Appointment object.
     */
    @GetMapping("/{id}")
    public Appointment getAppointmentById(@PathVariable Long id) {
        return appointmentService.getAppointmentById(id);
    }

    /**
     * Creates a new appointment.
     *
     * @param appointmentDTO the data for the new appointment.
     * @return the created Appointment object.
     */
    @PostMapping
    public Appointment createAppointment(@RequestBody AppointmentDTO appointmentDTO) {
        return appointmentService.createAppointment(appointmentDTO);
    }

    /**
     * Updates an existing appointment.
     *
     * @param id the ID of the appointment to update.
     * @param appointmentDTO the updated appointment data.
     * @return the updated Appointment object.
     */
    @PutMapping("/{id}")
    public Appointment updateAppointment(@PathVariable Long id, @RequestBody AppointmentDTO appointmentDTO) {
        return appointmentService.updateAppointment(id, appointmentDTO);
    }

    /**
     * Deletes an appointment by its ID.
     *
     * @param id the ID of the appointment to delete.
     */
    @DeleteMapping("/{id}")
    public void deleteAppointment(@PathVariable Long id) {
        appointmentService.deleteAppointment(id);
    }
}
