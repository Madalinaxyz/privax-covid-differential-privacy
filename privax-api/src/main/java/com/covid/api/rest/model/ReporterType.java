package com.covid.api.rest.model;

/**
 * Who submitted a side-effect report — the provenance signal, mirroring the "reporter type"
 * tracked by real pharmacovigilance systems (VAERS, EudraVigilance). Anyone may report any
 * outcome; this records on whose behalf, rather than restricting who is allowed to report.
 */
public enum ReporterType {
    /** The affected person reporting for themselves. */
    SELF,
    /** A family member / carer reporting on someone's behalf (e.g. a fatal outcome). */
    FAMILY,
    /** A clinician reporting for a patient (submitted via the /clinician endpoint). */
    CLINICIAN
}
