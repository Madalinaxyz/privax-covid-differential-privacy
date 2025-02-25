package com.covid.api.rest.service;

import lombok.Data;

@Data
public class CountComparison {
    private long rawCount;
    private double noisyCount;

    public CountComparison(long rawCount, double noisyCount) {
        this.rawCount = rawCount;
        this.noisyCount = noisyCount;
    }
}
