package com.covid.api.rest.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;


@Entity
@Table(name = "side_effect_reports")
@Getter
@Setter
public class SideEffectReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ElementCollection
    @CollectionTable(name = "side_effect_symptoms", joinColumns = @JoinColumn(name = "report_id"))
    @Column(name = "symptom")
    private List<String> symptoms;

    // @Column(nullable = false)
    // private int severity;

    private int age;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SeverityLevel severity;

    @Column(length = 500)
    private String additionalInfo;

    @Column(nullable = false)
    private LocalDateTime reportedAt;

    @Column(name = "vaccine_name", nullable = false)
    private String vaccineName;

    @Column(name = "vcity", nullable = false)
    private String city;

    public SideEffectReport() {
    }

    public SideEffectReport(int age, List<String> symptoms, SeverityLevel severity, String additionalInfo, LocalDateTime reportedAt, String vaccineName, String city) {
        this.age = age;
        this.symptoms = symptoms;
        this.severity = severity;
        this.additionalInfo = additionalInfo;
        this.reportedAt = reportedAt;
        this.vaccineName = vaccineName;
        this.city = city;
    }
}
