package com.covid.api.rest.service;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.covid.api.rest.repository.VaccinationRecordRepository;

import java.util.Random;

@Service
public class VaccinationService {

    @Autowired
    private VaccinationRecordRepository vaccinationRecordRepository;
    
    // Folosim un Random pentru generarea numerelor uniforme
    private final Random random = new Random();

    /**
     * Adaugă zgomot Laplace la o valoare.
     * 
     * @param value valoarea originală (ex. numărul de vaccinări)
     * @param epsilon parametrul de confidențialitate (un epsilon mai mic înseamnă o protecție mai puternică)
     * @param sensitivity sensibilitatea (1 pentru interogări de numărare)
     * @return valoarea cu zgomotul adăugat
     */
    public double addLaplaceNoise(double value, double epsilon, double sensitivity) {
        double scale = sensitivity / epsilon;
        double u = random.nextDouble() - 0.5;
        // Formula pentru zgomotul Laplace: noise = -scale * sgn(u) * ln(1 - 2|u|)
        double noise = -scale * Math.signum(u) * Math.log(1 - 2 * Math.abs(u));
        return value + noise;
    }

    /**
     * Obține numărul de vaccinări pentru o anumită regiune, cu adăugarea zgomotului pentru DP.
     * 
     * @param region regiunea pentru care se face numărătoarea
     * @param epsilon parametrul de confidențialitate
     * @return numărul de vaccinări cu zgomot (valoare de tip double)
     */
    public double getVaccinationCountByRegion(String region, double epsilon) {
        long rawCount = vaccinationRecordRepository.countByRegion(region);
        return addLaplaceNoise(rawCount, epsilon, 1);
    }
    
    // Pentru demonstrarea trade-off-ului între acuratețe și confidențialitate
    public CountComparison getVaccinationCountComparisonByRegion(String region, double epsilon) {
        long rawCount = vaccinationRecordRepository.countByRegion(region);
        double noisyCount = addLaplaceNoise(rawCount, epsilon, 1);
        return new CountComparison(rawCount, noisyCount);
    }
}
