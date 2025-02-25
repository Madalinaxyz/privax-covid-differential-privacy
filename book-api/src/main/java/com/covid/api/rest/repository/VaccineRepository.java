package com.covid.api.rest.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.covid.api.rest.model.Vaccine;

@Repository
public interface VaccineRepository extends JpaRepository<Vaccine, Long> {
    // You can add custom query methods here if needed.
}
