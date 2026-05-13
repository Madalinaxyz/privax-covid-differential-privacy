package com.covid.api.rest.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Setter
public class GroupedReportDTO {
    private String city;
    private String vaccineName;
    private Long mildCount;
    private Long moderateCount;
    private Long severeCount;
    private Long fatalCount;

    // Constructor, Getters, Setters
}
