package com.covid.api.rest.repository;


import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.covid.api.rest.dto.GroupedReportDTO;
import com.covid.api.rest.model.SideEffectReport;

@Repository
public interface SideEffectReportRepository extends JpaRepository<SideEffectReport, Long> {
    // You can add custom query methods here if needed.
    Page<SideEffectReport> findAll(Pageable pageable);

    // @Query("SELECT new com.covid.api.rest.dto.GroupedReportDTO(r.city, r.vaccineName, " +
    //    "SUM(CASE WHEN r.severity = 'MILD' THEN 1 ELSE 0 END), " +
    //    "SUM(CASE WHEN r.severity = 'MODERATE' THEN 1 ELSE 0 END), " +
    //    "SUM(CASE WHEN r.severity = 'SEVERE' THEN 1 ELSE 0 END), " +
    //    "SUM(CASE WHEN r.severity = 'FATAL' THEN 1 ELSE 0 END)) " +
    //    "FROM SideEffectReport r " +
    //    "WHERE (:vaccineName IS NULL OR r.vaccineName = :vaccineName) " +
    //    "GROUP BY r.city, r.vaccineName")
    // List<GroupedReportDTO> findGroupedReports(@Param("vaccineName") String vaccineName);

    // @Query("SELECT new com.covid.api.rest.dto.GroupedReportDTO(r.city, r.vaccineName, " +
    //    "SUM(CASE WHEN UPPER(r.severity) = 'MILD' THEN 1 ELSE 0 END), " +
    //    "SUM(CASE WHEN UPPER(r.severity) = 'MODERATE' THEN 1 ELSE 0 END), " +
    //    "SUM(CASE WHEN UPPER(r.severity) = 'SEVERE' THEN 1 ELSE 0 END), " +
    //    "SUM(CASE WHEN UPPER(r.severity) = 'FATAL' THEN 1 ELSE 0 END)) " +
    //    "FROM SideEffectReport r " +
    //    "WHERE (:vaccineName IS NULL OR :vaccineName = 'ALL' OR UPPER(r.vaccineName) = UPPER(:vaccineName)) " +
    //    "GROUP BY r.city, r.vaccineName")
    // List<GroupedReportDTO> findGroupedReports(@Param("vaccineName") String vaccineName);

    @Query("SELECT new com.covid.api.rest.dto.GroupedReportDTO(r.city, r.vaccineName, " +
       "SUM(CASE WHEN UPPER(r.severity) = 'MILD' THEN 1 ELSE 0 END), " +
       "SUM(CASE WHEN UPPER(r.severity) = 'MODERATE' THEN 1 ELSE 0 END), " +
       "SUM(CASE WHEN UPPER(r.severity) = 'SEVERE' THEN 1 ELSE 0 END), " +
       "SUM(CASE WHEN UPPER(r.severity) = 'FATAL' THEN 1 ELSE 0 END)) " +
       "FROM SideEffectReport r " +
       "WHERE (:vaccineName IS NULL OR :vaccineName = 'ALL' OR UPPER(r.vaccineName) = UPPER(:vaccineName)) " +
       "AND (:severityLevel IS NULL OR :severityLevel = 'ALL' OR UPPER(r.severity) = UPPER(:severityLevel)) " +
       "GROUP BY r.city, r.vaccineName")
    List<GroupedReportDTO> findGroupedReports(
        @Param("vaccineName") String vaccineName,
        @Param("severityLevel") String severityLevel
    );

}
