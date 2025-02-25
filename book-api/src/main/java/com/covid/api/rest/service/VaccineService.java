package com.covid.api.rest.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.covid.api.exception.ResourceNotFoundException;
import com.covid.api.rest.dto.VaccineDTO;
import com.covid.api.rest.model.Vaccine;
import com.covid.api.rest.repository.VaccineRepository;

import java.util.List;

/**
 * Service class for handling business logic related to vaccine management.
 */
@Service
public class VaccineService {

    private final VaccineRepository vaccineRepository;

    @Autowired
    public VaccineService(VaccineRepository vaccineRepository) {
        this.vaccineRepository = vaccineRepository;
    }

    /**
     * Retrieves all vaccine records.
     *
     * @return a list of all vaccines.
     */
    public List<Vaccine> getAllVaccines() {
        return vaccineRepository.findAll();
    }

    /**
     * Retrieves a specific vaccine by its ID.
     *
     * @param id the ID of the vaccine.
     * @return the Vaccine object.
     * @throws ResourceNotFoundException if the vaccine is not found.
     */
    public Vaccine getVaccineById(Long id) {
        return vaccineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vaccine", "id", id));
    }

    /**
     * Creates a new vaccine record using the provided DTO.
     *
     * @param vaccineDTO the vaccine data.
     * @return the created Vaccine object.
     */
    public Vaccine createVaccine(VaccineDTO vaccineDTO) {
        Vaccine vaccine = new Vaccine();
        vaccine.setName(vaccineDTO.getName());
        vaccine.setManufacturer(vaccineDTO.getManufacturer());
        vaccine.setAvailableDoses(vaccineDTO.getAvailableDoses());
        return vaccineRepository.save(vaccine);
    }

    /**
     * Updates an existing vaccine record with new data.
     *
     * @param id         the ID of the vaccine to update.
     * @param vaccineDTO the updated vaccine data.
     * @return the updated Vaccine object.
     * @throws ResourceNotFoundException if the vaccine is not found.
     */
    public Vaccine updateVaccine(Long id, VaccineDTO vaccineDTO) {
        Vaccine existingVaccine = vaccineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vaccine", "id", id));
        existingVaccine.setName(vaccineDTO.getName());
        existingVaccine.setManufacturer(vaccineDTO.getManufacturer());
        existingVaccine.setAvailableDoses(vaccineDTO.getAvailableDoses());
        return vaccineRepository.save(existingVaccine);
    }

    /**
     * Deletes a vaccine record by its ID.
     *
     * @param id the ID of the vaccine to delete.
     * @throws ResourceNotFoundException if the vaccine is not found.
     */
    public void deleteVaccine(Long id) {
        Vaccine existingVaccine = vaccineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vaccine", "id", id));
        vaccineRepository.delete(existingVaccine);
    }
}
