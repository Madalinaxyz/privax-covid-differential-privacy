package com.covid.api.rest.dto;

import lombok.Data;

/**
 * Data Transfer Object for vaccine details.
 * Contains necessary information for creating or updating a vaccine record.
 */
@Data
public class VaccineDTO {

    private String name;
    private String manufacturer;
    private int availableDoses;

    // Default constructor
    public VaccineDTO() {
    }

    // Parameterized constructor
    public VaccineDTO(String name, String manufacturer, int availableDoses) {
        this.name = name;
        this.manufacturer = manufacturer;
        this.availableDoses = availableDoses;
    }
}
