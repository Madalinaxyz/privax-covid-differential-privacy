package com.covid.api.rest.model;


import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Data
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_name", nullable = false)
    private String userName;

    @Column(name = "appointment_date", nullable = false)
    private LocalDateTime appointmentDate;

    @Column(nullable = false)
    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vaccine_id", nullable = false)
    private Vaccine vaccine;

    public Appointment() {
    }

    public Appointment(String userName, LocalDateTime appointmentDate, String location, Vaccine vaccine) {
        this.userName = userName;
        this.appointmentDate = appointmentDate;
        this.location = location;
        this.vaccine = vaccine;
    }
}
