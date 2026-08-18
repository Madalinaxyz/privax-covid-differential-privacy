package com.covid.api.rest.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

    @Column(name = "city", nullable = false)
    private String city;

    /** Who submitted the report (self / family member / clinician) — the provenance signal. */
    @Enumerated(EnumType.STRING)
    @Column(name = "reporter_type", nullable = false, length = 20)
    private ReporterType reporterType = ReporterType.SELF;

    /**
     * Optional opaque patient reference used by the clinician for their own internal tracking.
     * Stored as-is, but NEVER serialized to any API response ({@link JsonIgnore}) — it is a
     * clinician-internal identifier and must not leak into the public reports feed. A future
     * clinician-only read-back should expose it via a dedicated, authorized DTO instead.
     */
    @JsonIgnore
    @Column(name = "patient_code", length = 64)
    private String patientCode;

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
