import React, { useEffect, useState, useCallback } from "react";
import {
  Table, TableRow, TableHeaderCell, TableHeader, TableCell, TableBody,
  Icon, Select, Dropdown, Loader, Dimmer
} from "semantic-ui-react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { privaxApi } from "../misc/PrivaxApi";
import { applyDifferentialPrivacy, cityCoordinates } from "../misc/Helpers";

const PAGE_SIZE_OPTIONS = [
  { key: 10,  value: 10,  text: "10 per page"  },
  { key: 25,  value: 25,  text: "25 per page"  },
  { key: 50,  value: 50,  text: "50 per page"  },
  { key: 100, value: 100, text: "100 per page" },
];

const SEVERITY_OPTIONS = [
  { key: "ALL",      value: "ALL",      text: "All severities" },
  { key: "MILD",     value: "MILD",     text: "Mild"           },
  { key: "MODERATE", value: "MODERATE", text: "Moderate"       },
  { key: "SEVERE",   value: "SEVERE",   text: "Severe"         },
  { key: "FATAL",    value: "FATAL",    text: "Fatal"          },
];

const VACCINE_OPTIONS = [
  { key: "ALL",                value: "",                  text: "All vaccines"     },
  { key: "Pfizer",             value: "Pfizer",            text: "Pfizer"           },
  { key: "Moderna",            value: "Moderna",           text: "Moderna"          },
  { key: "AstraZeneca",        value: "AstraZeneca",       text: "AstraZeneca"      },
  { key: "Johnson & Johnson",  value: "Johnson & Johnson", text: "Johnson & Johnson"},
];

const CITY_OPTIONS = [
  { key: "ALL", value: "", text: "All cities" },
  ...Object.keys(cityCoordinates)
    .sort()
    .map((c) => ({ key: c, value: c, text: c })),
];

const SORTABLE = ["age", "severity", "vaccineName", "reportedAt", "city"];

const TableReport = ({ handleLogError }) => {
  /* ── State ── */
  const [reports, setReports]     = useState([]);
  const [original, setOriginal]   = useState([]);
  const [totalElements, setTotal] = useState(0);
  const [totalPages, setTotalPgs] = useState(0);
  const [page, setPage]           = useState(0);
  const [size, setSize]           = useState(10);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir]     = useState(null);
  const [filters, setFilters]     = useState({ severity: "ALL", vaccineName: "", city: "" });
  const [epsilon, setEpsilon]     = useState(10.0);
  const [loading, setLoading]     = useState(false);

  /* ── Which columns are actively filtered? Those are preserved (not noised)
        so the displayed values match the active filter. ── */
  const getPreservedFields = () => {
    const preserved = [];
    if (filters.severity && filters.severity !== 'ALL') preserved.push('severity');
    if (filters.vaccineName) preserved.push('vaccineName');
    if (filters.city)        preserved.push('city');
    return preserved;
  };

  /* ── Fetcher ── */
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const sortParam = sortField && sortDir ? `${sortField},${sortDir}` : null;
      const response = await privaxApi.getSideEffectReports({
        page,
        size,
        sort: sortParam,
        vaccineName: filters.vaccineName || null,
        severity:    filters.severity,
        city:        filters.city || null,
      });
      const data = response.data;
      setOriginal(data.content || []);
      setReports(applyDifferentialPrivacy(data.content || [], epsilon, getPreservedFields()));
      setTotal(data.totalElements || 0);
      setTotalPgs(data.totalPages || 0);
    } catch (error) {
      console.error("Error fetching reports:", error);
      handleLogError?.(error);
      setReports([]);
      setOriginal([]);
      setTotal(0);
      setTotalPgs(0);
    }
    setLoading(false);
  }, [page, size, sortField, sortDir, filters, epsilon, handleLogError]);

  /* Fetch on every dependency change (auto-load first page on mount) */
  useEffect(() => { fetchReports(); /* eslint-disable-next-line */ }, [page, size, sortField, sortDir, filters]);

  /* Re-apply DP locally when epsilon changes (no re-fetch needed) */
  useEffect(() => {
    if (original.length > 0) setReports(applyDifferentialPrivacy(original, epsilon, getPreservedFields()));
    /* eslint-disable-next-line */
  }, [epsilon, original, filters]);

  /* ── Sort handler — cycles asc → desc → none on repeated clicks ── */
  const toggleSort = (field) => {
    if (!SORTABLE.includes(field)) return;
    if (sortField !== field) { setSortField(field); setSortDir("asc"); setPage(0); return; }
    if (sortDir === "asc")    { setSortDir("desc"); setPage(0); return; }
    setSortField(null); setSortDir(null); setPage(0);
  };
  const sortIcon = (field) => {
    if (sortField !== field) return "sort";
    return sortDir === "asc" ? "sort up" : "sort down";
  };

  /* ── Filter handlers ── */
  const setFilter = (key, value) => { setFilters((f) => ({ ...f, [key]: value })); setPage(0); };

  /* ── Pagination helpers ── */
  const totalShown = reports.length;
  const fromIdx    = totalElements === 0 ? 0 : page * size + 1;
  const toIdx      = page * size + totalShown;

  /* Build a compact page-number list around the current page */
  const buildPageList = () => {
    const out = [];
    const last = totalPages - 1;
    if (last < 0) return out;
    const window = 1;
    const add = (p) => out.push(p);
    add(0);
    if (page - window > 1) out.push("…");
    for (let p = Math.max(1, page - window); p <= Math.min(last - 1, page + window); p++) if (p !== 0 && p !== last) add(p);
    if (page + window < last - 1) out.push("…");
    if (last > 0) add(last);
    return out.filter((p, i, arr) => arr.indexOf(p) === i);
  };

  return (
    <div className="report-card">
      {/* Epsilon control */}
      <div className="report-epsilon">
        <div className="report-epsilon-label">
          <span>Privacy budget (epsilon)</span>
          <span className="report-epsilon-value">{epsilon.toFixed(1)}</span>
        </div>
        <Slider min={0.1} max={10} step={0.1} value={epsilon} onChange={setEpsilon} />
        <p className="report-epsilon-hint">Lower value = more privacy · Higher value = more accuracy</p>
      </div>

      {/* Toolbar: total count + page size */}
      <div className="report-toolbar">
        <div className="report-count">
          {loading ? "Loading…" : (
            totalElements > 0
              ? <>Showing <strong>{fromIdx.toLocaleString()}–{toIdx.toLocaleString()}</strong> of <strong>{totalElements.toLocaleString()}</strong> reports</>
              : <>No reports match the current filters</>
          )}
        </div>
        <div className="report-page-size">
          <label>Page size</label>
          <Select
            compact
            options={PAGE_SIZE_OPTIONS}
            value={size}
            onChange={(_, { value }) => { setSize(value); setPage(0); }}
          />
        </div>
      </div>

      <div className="report-table-wrap">
        <Dimmer.Dimmable as="div" dimmed={loading}>
          <Dimmer active={loading} inverted><Loader /></Dimmer>
          <Table striped sortable>
            <TableHeader>
              <TableRow>
                <TableHeaderCell onClick={() => toggleSort("age")}>
                  <span className="th-content">Age <Icon name={sortIcon("age")} /></span>
                </TableHeaderCell>
                <TableHeaderCell onClick={() => toggleSort("severity")}>
                  <span className="th-content">Severity <Icon name={sortIcon("severity")} /></span>
                </TableHeaderCell>
                <TableHeaderCell onClick={() => toggleSort("vaccineName")}>
                  <span className="th-content">Vaccine <Icon name={sortIcon("vaccineName")} /></span>
                </TableHeaderCell>
                <TableHeaderCell>Symptoms</TableHeaderCell>
                <TableHeaderCell onClick={() => toggleSort("reportedAt")}>
                  <span className="th-content">Reported At <Icon name={sortIcon("reportedAt")} /></span>
                </TableHeaderCell>
                <TableHeaderCell onClick={() => toggleSort("city")}>
                  <span className="th-content">City <Icon name={sortIcon("city")} /></span>
                </TableHeaderCell>
                <TableHeaderCell>Additional Info</TableHeaderCell>
              </TableRow>
              {/* Filter row — sits below the header */}
              <TableRow className="report-filter-row">
                <TableHeaderCell />
                <TableHeaderCell>
                  <Select
                    fluid
                    options={SEVERITY_OPTIONS}
                    value={filters.severity}
                    onChange={(_, { value }) => setFilter("severity", value)}
                  />
                </TableHeaderCell>
                <TableHeaderCell>
                  <Select
                    fluid
                    options={VACCINE_OPTIONS}
                    value={filters.vaccineName}
                    onChange={(_, { value }) => setFilter("vaccineName", value)}
                  />
                </TableHeaderCell>
                <TableHeaderCell />
                <TableHeaderCell />
                <TableHeaderCell>
                  <Dropdown
                    fluid
                    selection
                    search
                    clearable
                    options={CITY_OPTIONS}
                    value={filters.city}
                    placeholder="All cities"
                    onChange={(_, { value }) => setFilter("city", value || "")}
                  />
                </TableHeaderCell>
                <TableHeaderCell />
              </TableRow>
            </TableHeader>

            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell><b>{report.age}</b></TableCell>
                  <TableCell><b>{report.severity}</b></TableCell>
                  <TableCell><b>{report.vaccineName}</b></TableCell>
                  <TableCell>{report.symptoms?.join(", ")}</TableCell>
                  <TableCell>{new Date(report.reportedAt).toLocaleString()}</TableCell>
                  <TableCell><b>{report.city}</b></TableCell>
                  <TableCell>{report.additionalInfo}</TableCell>
                </TableRow>
              ))}
              {!loading && reports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} textAlign="center" className="report-empty">
                    No reports match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Dimmer.Dimmable>
      </div>

      {/* Pagination footer */}
      {totalPages > 1 && (
        <div className="report-pagination">
          <button
            className="page-btn page-btn-arrow"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <Icon name="chevron left" /> Prev
          </button>

          {buildPageList().map((p, i) =>
            p === "…"
              ? <span className="page-ellipsis" key={`e${i}`}>…</span>
              : (
                <button
                  key={p}
                  className={`page-btn page-num ${p === page ? "active" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p + 1}
                </button>
              )
          )}

          <button
            className="page-btn page-btn-arrow"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next <Icon name="chevron right" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TableReport;
