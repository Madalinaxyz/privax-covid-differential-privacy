package com.covid.api.rest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.covid.api.rest.dto.VaccineDTO;
import com.covid.api.rest.model.Vaccine;
import com.covid.api.rest.service.VaccineService;

import java.util.List;

/**
 * REST controller for managing vaccine information.
 */
@RestController
@RequestMapping("/api/vaccines")
public class VaccineController {

    private final VaccineService vaccineService;

    @Autowired
    public VaccineController(VaccineService vaccineService) {
        this.vaccineService = vaccineService;
    }

    /**
     * Retrieves a list of all vaccines.
     *
     * @return a list of Vaccine objects.
     */
    @GetMapping
    public List<Vaccine> getAllVaccines() {
        return vaccineService.getAllVaccines();
    }

    /**
     * Retrieves a specific vaccine by its ID.
     *
     * @param id the ID of the vaccine.
     * @return the Vaccine object.
     */
    @GetMapping("/{id}")
    public Vaccine getVaccineById(@PathVariable Long id) {
        return vaccineService.getVaccineById(id);
    }

    /**
     * Creates a new vaccine record.
     *
     * @param vaccineDTO the vaccine details.
     * @return the created Vaccine object.
     */
    @PostMapping
    public Vaccine createVaccine(@RequestBody VaccineDTO vaccineDTO) {
        return vaccineService.createVaccine(vaccineDTO);
    }

    /**
     * Updates an existing vaccine record.
     *
     * @param id the ID of the vaccine to update.
     * @param vaccineDTO the updated vaccine details.
     * @return the updated Vaccine object.
     */
    @PutMapping("/{id}")
    public Vaccine updateVaccine(@PathVariable Long id, @RequestBody VaccineDTO vaccineDTO) {
        return vaccineService.updateVaccine(id, vaccineDTO);
    }

    /**
     * Deletes a vaccine by its ID.
     *
     * @param id the ID of the vaccine to delete.
     */
    @DeleteMapping("/{id}")
    public void deleteVaccine(@PathVariable Long id) {
        vaccineService.deleteVaccine(id);
    }
}
