package com.covid.api.rest.repository;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.covid.api.rest.model.SideEffectReport;

@Repository
public interface SideEffectReportRepository extends JpaRepository<SideEffectReport, Long> {
    // You can add custom query methods here if needed.
    Page<SideEffectReport> findAll(Pageable pageable);

}
