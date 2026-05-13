package com.covid.api.rest.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
@AllArgsConstructor
public class VaccinationRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private int age;
    private String region;
    private String vaccineType;
    private int numberOfDoses;
    private LocalDate vaccinationDate;

    public VaccinationRecord() {
    }

    public VaccinationRecord(int age, String region, String vaccineType, int numberOfDoses, LocalDate vaccinationDate) {
        this.age = age;
        this.region = region;
        this.vaccineType = vaccineType;
        this.numberOfDoses = numberOfDoses;
        this.vaccinationDate = vaccinationDate;
    }
}
