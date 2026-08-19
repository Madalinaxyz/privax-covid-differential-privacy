import React, { useEffect, useState, useCallback } from "react";
import {
  Table, TableRow, TableHeaderCell, TableHeader, TableCell, TableBody,
  Icon, Select, Dropdown, Loader, Dimmer
} from "semantic-ui-react";
import { privaxApi } from "../misc/PrivaxApi";
import EpsilonSlider from "./EpsilonSlider";
import { cityCoordinates } from "../misc/Helpers";

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
  { key: "ALL",                value: "ALL",               text: "All vaccines"     },
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

const SYMPTOM_OPTIONS = [
  { key: "",                        value: "",                        text: "All symptoms"             },
  { key: "Fever",                   value: "Fever",                   text: "Fever"                    },
  { key: "Fatigue",                 value: "Fatigue",                 text: "Fatigue"                  },
  { key: "Headache",                value: "Headache",                text: "Headache"                 },
  { key: "Muscle Pain",             value: "Muscle Pain",             text: "Muscle Pain"              },
  { key: "Chills",                  value: "Chills",                  text: "Chills"                   },
  { key: "Nausea",                  value: "Nausea",                  text: "Nausea"                   },
  { key: "Dizziness",               value: "Dizziness",               text: "Dizziness"                },
  { key: "Joint Pain",              value: "Joint Pain",              text: "Joint Pain"               },
  { key: "Injection Site Pain",     value: "Injection Site Pain",     text: "Injection Site Pain"      },
  { key: "Swollen Lymph Nodes",     value: "Swollen Lymph Nodes",     text: "Swollen Lymph Nodes"      },
  { key: "Rash",                    value: "Rash",                    text: "Rash"                     },
  { key: "Vomiting",                value: "Vomiting",                text: "Vomiting"                 },
  { key: "Brain Fog",               value: "Brain Fog",               text: "Brain Fog"                },
  { key: "Insomnia",                value: "Insomnia",                text: "Insomnia"                 },
  { key: "Anxiety",                 value: "Anxiety",                 text: "Anxiety"                  },
  { key: "Heart Palpitations",      value: "Heart Palpitations",      text: "Heart Palpitations"       },
  { key: "Chest Pain",              value: "Chest Pain",              text: "Chest Pain"               },
  { key: "Shortness of Breath",     value: "Shortness of Breath",     text: "Shortness of Breath"      },
  { key: "Numbness / Tingling",     value: "Numbness / Tingling",     text: "Numbness / Tingling"      },
  { key: "Tinnitus",                value: "Tinnitus",                text: "Tinnitus"                 },
  { key: "Myocarditis",             value: "Myocarditis",             text: "Myocarditis"              },
  { key: "Anaphylaxis",             value: "Anaphylaxis",             text: "Anaphylaxis"              },
  { key: "Guillain-Barré Syndrome", value: "Guillain-Barré Syndrome", text: "Guillain-Barré Syndrome"  },
  { key: "Bell's Palsy",            value: "Bell's Palsy",            text: "Bell's Palsy"             },
  { key: "Blood Clots",             value: "Blood Clots",             text: "Blood Clots"              },
  { key: "Seizures",                value: "Seizures",                text: "Seizures"                 },
  { key: "Encephalitis",            value: "Encephalitis",            text: "Encephalitis"             },
  { key: "Psychosis",               value: "Psychosis",               text: "Psychosis"                },
  { key: "Transverse Myelitis",     value: "Transverse Myelitis",     text: "Transverse Myelitis"      },
  { key: "Immune Thrombocytopenia", value: "Immune Thrombocytopenia", text: "Immune Thrombocytopenia"  },
  { key: "POTS",                    value: "POTS",                    text: "POTS"                     },
  { key: "Paralysis",               value: "Paralysis",               text: "Paralysis"                },
];

const SORTABLE = ["age", "severity", "vaccineName", "reportedAt", "city"];

const TableReport = ({ handleLogError }) => {
  /* ── State ── */
  const [reports, setReports]     = useState([]);
  const [totalElements, setTotal] = useState(0);
  const [totalPages, setTotalPgs] = useState(0);
  const [page, setPage]           = useState(0);
  const [size, setSize]           = useState(10);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir]     = useState(null);
  const [filters, setFilters]     = useState({ severity: "ALL", vaccineName: "ALL", city: "", symptom: "" });
  const [epsilon, setEpsilon]     = useState(1.0);
  const [loading, setLoading]     = useState(false);

  /* ── Fetcher ── */
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const sortParam = sortField && sortDir ? `${sortField},${sortDir}` : null;
      const response = await privaxApi.getSideEffectReports({
        page,
        size,
        epsilon,                                                              // ← now actually sent
        sort: sortParam,
        vaccineName: filters.vaccineName && filters.vaccineName !== 'ALL' ? filters.vaccineName : null,
        severity:    filters.severity,
        city:        filters.city || null,
        symptom:     filters.symptom || null,
      });
      const data = response.data;
      // Noise is applied server-side now; display the response verbatim.
      // Pagination metadata lives under `page` (stable DTO shape); fall back to the
      // legacy top-level fields so this keeps working either way.
      const meta = data.page || data;
      setReports(data.content || []);
      setTotal(meta.totalElements || 0);
      setTotalPgs(meta.totalPages || 0);
    } catch (error) {
      console.error("Error fetching reports:", error);
      handleLogError?.(error);
      setReports([]);
      setTotal(0);
      setTotalPgs(0);
    }
    setLoading(false);
  }, [page, size, sortField, sortDir, filters, epsilon, handleLogError]);

  /* Fetch on every dependency change (incl. epsilon — noise is applied server-side now).
     Debounced so dragging the epsilon slider doesn't spam the API. */
  useEffect(() => {
    const t = setTimeout(fetchReports, 300);
    return () => clearTimeout(t);
    /* eslint-disable-next-line */
  }, [page, size, sortField, sortDir, filters, epsilon]);

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
      <EpsilonSlider value={epsilon} onChange={setEpsilon} />

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
                <TableHeaderCell>
                  <Dropdown
                    fluid
                    selection
                    search
                    clearable
                    options={SYMPTOM_OPTIONS}
                    value={filters.symptom}
                    placeholder="All symptoms"
                    onChange={(_, { value }) => setFilter("symptom", value || "")}
                  />
                </TableHeaderCell>
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
