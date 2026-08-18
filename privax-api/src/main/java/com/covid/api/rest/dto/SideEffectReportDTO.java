package com.covid.api.rest.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.covid.api.rest.model.SeverityLevel;
import com.covid.api.rest.model.ReporterType;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SideEffectReportDTO {
    @Min(value = 0, message = "age must be between 0 and 120")
    @Max(value = 120, message = "age must be between 0 and 120")
    private int age;

    private List<String> symptoms;

    @NotNull(message = "severity is required")
    private SeverityLevel severity;

    @Size(max = 500, message = "additionalInfo must be at most 500 characters")
    private String additionalInfo;

    private LocalDateTime reportedAt;

    @NotBlank(message = "vaccineName is required")
    private String vaccineName;

    @NotBlank(message = "city is required")
    private String city;

    /** Who is filing this report — SELF or FAMILY from the public form (CLINICIAN is set server-side). */
    private ReporterType reporterType;

    /** Optional, only sent by clinicians via the /clinician endpoint. */
    @Size(max = 64, message = "patientCode must be at most 64 characters")
    private String patientCode;

    public SideEffectReportDTO() {
    }

    public SideEffectReportDTO(int age, List<String> symptoms, SeverityLevel severity, String additionalInfo, LocalDateTime reportedAt, String vaccineName, String city) {
        this.age = age;
        this.symptoms = symptoms;
        this.severity = severity;
        this.additionalInfo = additionalInfo;
        this.reportedAt = reportedAt;
        this.vaccineName = vaccineName;
        this.city = city;
    }
}
