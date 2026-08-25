import React, { useEffect, useState, useMemo } from "react";
import {
  Table, TableRow, TableHeaderCell, TableHeader, TableCell, TableBody,
  Icon, Select, Dropdown,
} from "semantic-ui-react";
import EpsilonSlider from "./EpsilonSlider";
import { cityCoordinates } from "../misc/Helpers";
import { generateIllustrativeReports, noiseReport } from "./illustrativeReports";

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

const TableReport = () => {
  /* ── State ── */
  const [page, setPage]           = useState(0);
  const [size, setSize]           = useState(10);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir]     = useState(null);
  const [filters, setFilters]     = useState({ severity: "ALL", vaccineName: "ALL", city: "", symptom: "" });
  const [epsilon, setEpsilon]     = useState(1.0);

  /* ── Illustrative dataset (synthetic, generated once, mirrors the real distribution) ── */
  const dataset = useMemo(() => generateIllustrativeReports(240), []);

  /* Apply DP noise at the current ε, then filter + sort — all client-side, since the rows
     are synthetic. This is what makes the slider safe AND fully live. */
  const processed = useMemo(() => {
    let rows = dataset.map((row) => noiseReport(row, epsilon));

    if (filters.severity && filters.severity !== "ALL") rows = rows.filter((r) => r.severity === filters.severity);
    if (filters.vaccineName && filters.vaccineName !== "ALL") rows = rows.filter((r) => r.vaccineName === filters.vaccineName);
    if (filters.city) rows = rows.filter((r) => r.city === filters.city);
    if (filters.symptom) {
      const q = filters.symptom.toLowerCase();
      rows = rows.filter((r) => (r.symptoms || []).some((s) => s.toLowerCase().includes(q)));
    }

    if (sortField && sortDir) {
      const dir = sortDir === "asc" ? 1 : -1;
      rows = [...rows].sort((a, b) => {
        let av = a[sortField], bv = b[sortField];
        if (sortField === "reportedAt") { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
        if (typeof av === "string") return av.localeCompare(bv) * dir;
        return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
      });
    }
    return rows;
  }, [dataset, epsilon, filters, sortField, sortDir]);

  /* Reset to the first page whenever the result set changes. */
  useEffect(() => { setPage(0); }, [epsilon, filters, size, sortField, sortDir]);

  const totalElements = processed.length;
  const totalPages    = Math.max(1, Math.ceil(totalElements / size));
  const safePage      = Math.min(page, totalPages - 1);
  const pageRows      = processed.slice(safePage * size, safePage * size + size);

  /* ── Sort handler — cycles asc → desc → none on repeated clicks ── */
  const toggleSort = (field) => {
    if (!SORTABLE.includes(field)) return;
    if (sortField !== field) { setSortField(field); setSortDir("asc"); return; }
    if (sortDir === "asc")    { setSortDir("desc"); return; }
    setSortField(null); setSortDir(null);
  };
  const sortIcon = (field) => {
    if (sortField !== field) return "sort";
    return sortDir === "asc" ? "sort up" : "sort down";
  };
  /* aria-sort value for a column header (screen-reader announcement). */
  const ariaSortFor = (field) => {
    if (sortField !== field) return "none";
    return sortDir === "asc" ? "ascending" : "descending";
  };
  /* A sortable header cell: keyboard-focusable button + aria-sort on the cell. */
  const sortableHeader = (field, label) => (
    <TableHeaderCell aria-sort={ariaSortFor(field)}>
      <button type="button" className="th-content th-sort" onClick={() => toggleSort(field)}>
        {label} <Icon name={sortIcon(field)} />
      </button>
    </TableHeaderCell>
  );

  /* ── Filter handler ── */
  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  /* ── Pagination helpers ── */
  const fromIdx = totalElements === 0 ? 0 : safePage * size + 1;
  const toIdx   = safePage * size + pageRows.length;

  const buildPageList = () => {
    const out = [];
    const last = totalPages - 1;
    if (last < 0) return out;
    const window = 1;
    const add = (p) => out.push(p);
    add(0);
    if (safePage - window > 1) out.push("…");
    for (let p = Math.max(1, safePage - window); p <= Math.min(last - 1, safePage + window); p++) if (p !== 0 && p !== last) add(p);
    if (safePage + window < last - 1) out.push("…");
    if (last > 0) add(last);
    return out.filter((p, i, arr) => arr.indexOf(p) === i);
  };

  return (
    <div className="report-card">
      <div className="report-illustrative-note">
        <strong>Illustrative examples.</strong> These rows are synthetic — generated to mirror the
        real data (severity mix, symptoms, cities, vaccines) — so you can safely explore the
        privacy/accuracy trade-off. The real, privately-released numbers are in the <em>Map</em> and
        <em> Symptom prevalence</em> views.
      </div>

      <EpsilonSlider
        value={epsilon}
        onChange={setEpsilon}
        hint="Drag ε to watch differential-privacy noise blur ← → sharpen these illustrative rows, live."
      />

      {/* Toolbar: total count + page size */}
      <div className="report-toolbar">
        <div className="report-count">
          {totalElements > 0
            ? <>Showing <strong>{fromIdx.toLocaleString()}–{toIdx.toLocaleString()}</strong> of <strong>{totalElements.toLocaleString()}</strong> examples</>
            : <>No examples match the current filters</>}
        </div>
        <div className="report-page-size">
          <label id="page-size-label">Page size</label>
          <Select
            compact
            aria-labelledby="page-size-label"
            options={PAGE_SIZE_OPTIONS}
            value={size}
            onChange={(_, { value }) => setSize(value)}
          />
        </div>
      </div>

      <div className="report-table-wrap">
        <Table striped sortable>
          <TableHeader>
            <TableRow>
              {sortableHeader("age", "Age")}
              {sortableHeader("severity", "Severity")}
              {sortableHeader("vaccineName", "Vaccine")}
              <TableHeaderCell>Symptoms</TableHeaderCell>
              {sortableHeader("reportedAt", "Reported At")}
              {sortableHeader("city", "City")}
              <TableHeaderCell>Additional Info</TableHeaderCell>
            </TableRow>
            {/* Filter row — sits below the header */}
            <TableRow className="report-filter-row">
              <TableHeaderCell />
              <TableHeaderCell>
                <Select fluid aria-label="Filter by severity" options={SEVERITY_OPTIONS} value={filters.severity} onChange={(_, { value }) => setFilter("severity", value)} />
              </TableHeaderCell>
              <TableHeaderCell>
                <Select fluid aria-label="Filter by vaccine" options={VACCINE_OPTIONS} value={filters.vaccineName} onChange={(_, { value }) => setFilter("vaccineName", value)} />
              </TableHeaderCell>
              <TableHeaderCell>
                <Dropdown fluid selection search clearable aria-label="Filter by symptom" options={SYMPTOM_OPTIONS} value={filters.symptom} placeholder="All symptoms" onChange={(_, { value }) => setFilter("symptom", value || "")} />
              </TableHeaderCell>
              <TableHeaderCell />
              <TableHeaderCell>
                <Dropdown fluid selection search clearable aria-label="Filter by city" options={CITY_OPTIONS} value={filters.city} placeholder="All cities" onChange={(_, { value }) => setFilter("city", value || "")} />
              </TableHeaderCell>
              <TableHeaderCell />
            </TableRow>
          </TableHeader>

          <TableBody>
            {pageRows.map((report) => (
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
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} textAlign="center" className="report-empty">
                  No examples match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination footer */}
      {totalPages > 1 && (
        <div className="report-pagination">
          <button className="page-btn page-btn-arrow" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0}>
            <Icon name="chevron left" /> Prev
          </button>

          {buildPageList().map((p, i) =>
            p === "…"
              ? <span className="page-ellipsis" key={`e${i}`}>…</span>
              : (
                <button key={p} className={`page-btn page-num ${p === safePage ? "active" : ""}`} onClick={() => setPage(p)}>
                  {p + 1}
                </button>
              )
          )}

          <button className="page-btn page-btn-arrow" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}>
            Next <Icon name="chevron right" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TableReport;
