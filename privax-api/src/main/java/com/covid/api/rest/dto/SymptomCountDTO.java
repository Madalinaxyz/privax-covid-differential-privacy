package com.covid.api.rest.dto;

/** One symptom and how many reports listed it (count is DP-noised before it leaves the service). */
public class SymptomCountDTO {

    private String symptom;
    private long count;

    public SymptomCountDTO(String symptom, Long count) {
        this.symptom = symptom;
        this.count = count == null ? 0L : count;
    }

    public String getSymptom() { return symptom; }
    public void setSymptom(String symptom) { this.symptom = symptom; }

    public long getCount() { return count; }
    public void setCount(long count) { this.count = count; }
}
