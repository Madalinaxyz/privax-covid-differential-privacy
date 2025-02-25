package com.covid.api.rest.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.covid.api.rest.model.SeverityLevel;

import lombok.Data;

@Data
public class SideEffectReportDTO {
    private int age;
    private List<String> symptoms;
    private SeverityLevel severity;
    private String additionalInfo;
    private LocalDateTime reportedAt;
    private String vaccineName;
    private String city;

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
