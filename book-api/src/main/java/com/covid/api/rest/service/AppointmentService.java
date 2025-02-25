package com.covid.api.rest.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.covid.api.exception.ResourceNotFoundException;
import com.covid.api.rest.dto.AppointmentDTO;
import com.covid.api.rest.model.Appointment;
import com.covid.api.rest.model.Vaccine;
import com.covid.api.rest.repository.AppointmentRepository;
import com.covid.api.rest.repository.VaccineRepository;

import java.util.List;

/**
 * Service class for handling business logic related to appointments.
 */
@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final VaccineRepository vaccineRepository;

    @Autowired
    public AppointmentService(AppointmentRepository appointmentRepository, VaccineRepository vaccineRepository) {
        this.appointmentRepository = appointmentRepository;
        this.vaccineRepository = vaccineRepository;
    }

    /**
     * Retrieves all appointments from the repository.
     *
     * @return a list of all appointments.
     */
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    /**
     * Retrieves a specific appointment by its ID.
     *
     * @param id the appointment ID.
     * @return the appointment.
     * @throws ResourceNotFoundException if the appointment is not found.
     */
    public Appointment getAppointmentById(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", id));
    }

    /**
     * Creates a new appointment based on the provided DTO.
     *
     * @param appointmentDTO the appointment data.
     * @return the created appointment.
     * @throws ResourceNotFoundException if the vaccine associated with the appointment is not found.
     */
    public Appointment createAppointment(AppointmentDTO appointmentDTO) {
        // Validate and fetch the vaccine using the provided vaccineId.
        Vaccine vaccine = vaccineRepository.findById(appointmentDTO.getVaccineId())
                .orElseThrow(() -> new ResourceNotFoundException("Vaccine", "id", appointmentDTO.getVaccineId()));

        // Create a new Appointment entity.
        Appointment appointment = new Appointment(
                appointmentDTO.getUserName(),
                appointmentDTO.getAppointmentDate(),
                appointmentDTO.getLocation(),
                vaccine
        );
        return appointmentRepository.save(appointment);
    }

    /**
     * Updates an existing appointment with new data.
     *
     * @param id the ID of the appointment to update.
     * @param appointmentDTO the updated appointment data.
     * @return the updated appointment.
     * @throws ResourceNotFoundException if the appointment or the vaccine is not found.
     */
    public Appointment updateAppointment(Long id, AppointmentDTO appointmentDTO) {
        // Retrieve the existing appointment.
        Appointment existingAppointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", id));

        // Update appointment details.
        existingAppointment.setUserName(appointmentDTO.getUserName());
        existingAppointment.setAppointmentDate(appointmentDTO.getAppointmentDate());
        existingAppointment.setLocation(appointmentDTO.getLocation());

        // Update the associated vaccine if a new vaccineId is provided.
        if (appointmentDTO.getVaccineId() != null) {
            Vaccine vaccine = vaccineRepository.findById(appointmentDTO.getVaccineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vaccine", "id", appointmentDTO.getVaccineId()));
            existingAppointment.setVaccine(vaccine);
        }

        return appointmentRepository.save(existingAppointment);
    }

    /**
     * Deletes an appointment by its ID.
     *
     * @param id the ID of the appointment to delete.
     * @throws ResourceNotFoundException if the appointment is not found.
     */
    public void deleteAppointment(Long id) {
        Appointment existingAppointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", id));
        appointmentRepository.delete(existingAppointment);
    }
}
