package com.covid.api.rest.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;


@Entity
@Table(name = "vaccines")
@Data
public class Vaccine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String manufacturer;

    @Column(nullable = false)
    private int availableDoses;

    @OneToMany(mappedBy = "vaccine", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Appointment> appointments = new HashSet<>();

    public Vaccine() {
    }

    public Vaccine(String name, String manufacturer, int availableDoses) {
        this.name = name;
        this.manufacturer = manufacturer;
        this.availableDoses = availableDoses;
    }
}
