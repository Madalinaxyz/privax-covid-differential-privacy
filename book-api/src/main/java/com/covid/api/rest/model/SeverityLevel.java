package com.covid.api.rest.model;

public enum SeverityLevel {
    MILD("Mild"), 
    MODERATE("Moderate"), 
    SEVERE("Severe"), 
    FATAL("Death");

    private final String description;

    SeverityLevel(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
