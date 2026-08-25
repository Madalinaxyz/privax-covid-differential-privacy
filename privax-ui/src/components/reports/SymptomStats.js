import React, { useEffect, useState, useCallback } from "react";
import { Select, Loader, Dimmer } from "semantic-ui-react";
import { privaxApi } from "../misc/PrivaxApi";
import { cityCoordinates } from "../misc/Helpers";
import EpsilonSlider from "./EpsilonSlider";

const SEVERITY_OPTIONS = [
  { key: "ALL", value: "ALL", text: "All severities" },
  { key: "MILD", value: "MILD", text: "Mild" },
  { key: "MODERATE", value: "MODERATE", text: "Moderate" },
  { key: "SEVERE", value: "SEVERE", text: "Severe" },
  { key: "FATAL", value: "FATAL", text: "Fatal" },
];

const VACCINE_OPTIONS = [
  { key: "ALL", value: "ALL", text: "All vaccines" },
  { key: "Pfizer", value: "Pfizer", text: "Pfizer" },
  { key: "Moderna", value: "Moderna", text: "Moderna" },
  { key: "AstraZeneca", value: "AstraZeneca", text: "AstraZeneca" },
  { key: "Johnson & Johnson", value: "Johnson & Johnson", text: "Johnson & Johnson" },
];

const CITY_OPTIONS = [
  { key: "ALL", value: "", text: "All cities" },
  ...Object.keys(cityCoordinates).sort().map((c) => ({ key: c, value: c, text: c })),
];

const SymptomStats = () => {
  const [rows, setRows] = useState([]);
  const [epsilon, setEpsilon] = useState(1.0);
  const [filters, setFilters] = useState({ severity: "ALL", vaccineName: "ALL", city: "" });
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await privaxApi.getSymptomStats({
        epsilon,
        city: filters.city || null,
        severity: filters.severity,
        vaccineName: filters.vaccineName,
      });
      setRows(res.data || []);
    } catch (error) {
      console.error("Error fetching symptom stats:", error);
      setRows([]);
    }
    setLoading(false);
  }, [epsilon, filters]);

  /* Debounced so dragging the slider doesn't spam the API. */
  useEffect(() => {
    const t = setTimeout(fetchStats, 300);
    return () => clearTimeout(t);
  }, [epsilon, filters, fetchStats]);

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const max = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1;
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="report-card">
      <EpsilonSlider
        value={epsilon}
        onChange={setEpsilon}
        disabled
        label="Privacy level (epsilon)"
        hint="Fixed at ε = 1.0 — each symptom count is released at one privacy level for everyone, so it can't be de-noised by tuning ε."
      />

      {/* Filters */}
      <div className="report-toolbar">
        <div className="symptom-filters">
          <Select compact aria-label="Filter by severity" options={SEVERITY_OPTIONS} value={filters.severity}
                  onChange={(_, { value }) => setFilter("severity", value)} />
          <Select compact aria-label="Filter by vaccine" options={VACCINE_OPTIONS} value={filters.vaccineName}
                  onChange={(_, { value }) => setFilter("vaccineName", value)} />
          <Select compact search aria-label="Filter by city" options={CITY_OPTIONS} value={filters.city}
                  onChange={(_, { value }) => setFilter("city", value || "")} />
        </div>
        <div className="report-count">
          {loading ? "Loading…" : <>≈ <strong>{total.toLocaleString()}</strong> symptom mentions</>}
        </div>
      </div>

      <Dimmer.Dimmable as="div" dimmed={loading}>
        <Dimmer active={loading} inverted><Loader /></Dimmer>
        <ul className="symptom-bars">
          {rows.map((r) => (
            <li className="symptom-bar-row" key={r.symptom}>
              <span className="symptom-bar-name">{r.symptom}</span>
              <span className="symptom-bar-track">
                <i style={{ width: `${Math.max(2, (r.count / max) * 100)}%` }} />
              </span>
              <span className="symptom-bar-count">{r.count.toLocaleString()}</span>
            </li>
          ))}
          {!loading && rows.length === 0 && (
            <li className="report-empty">No symptoms match the current filters.</li>
          )}
        </ul>
      </Dimmer.Dimmable>
    </div>
  );
};

export default SymptomStats;
