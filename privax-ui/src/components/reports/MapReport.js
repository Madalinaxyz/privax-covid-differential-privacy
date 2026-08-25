// import React, { useEffect, useState } from "react";
// import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import { privaxApi } from "../misc/PrivaxApi";
// import { Dropdown } from "semantic-ui-react";
// import { cityCoordinates } from "../misc/Helpers";

// // Define severity colors
// const severityColors = {
//   MILD: "green",
//   MODERATE: "orange",
//   SEVERE: "red",
//   FATAL: "black",
// };

// // Define vaccine filter options
// const vaccineOptions = [
//   { key: "all", text: "All Vaccines", value: "ALL" },
//   { key: "Pfizer", text: "Pfizer", value: "Pfizer" },
//   { key: "Moderna", text: "Moderna", value: "Moderna" },
//   { key: "AstraZeneca", text: "AstraZeneca", value: "AstraZeneca" },
//   { key: "Johnson & Johnson", text: "Johnson & Johnson" },
// ];

// const severityOffsets = {
//   MILD: [0.02, 0], // Slightly north
//   MODERATE: [0, 0.02], // Slightly east
//   SEVERE: [-0.02, 0], // Slightly south
//   FATAL: [0, -0.02], // Slightly west
// };

// const MapReport = () => {
//   const [reports, setReports] = useState([]);
//   const [filteredReports, setFilteredReports] = useState([]);
//   const [selectedVaccine, setSelectedVaccine] = useState("ALL");

//   useEffect(() => {
//     const fetchGroupedReports = async () => {
//       try {
//         const response = await privaxApi.getGroupedSideEffectReports(selectedVaccine);
//         console.log("API Response:", response.data);
//         setReports(response.data);
//         setFilteredReports(response.data);
//       } catch (error) {
//         console.error("Error fetching reports:", error);
//       }
//     };

//     fetchGroupedReports();
//   }, [selectedVaccine]);

//   useEffect(() => {
//     if (selectedVaccine === "ALL") {
//       setFilteredReports(reports);
//     } else {
//       setFilteredReports(reports.filter((report) => report.vaccineName === selectedVaccine));
//     }
//   }, [reports, selectedVaccine]);

//   // Handle vaccine filter change
//   const handleFilterChange = (e, { value }) => {
//     setSelectedVaccine(value);
//   };

//   return (
//     <div>
//       <Dropdown
//         placeholder="Filter by Vaccine"
//         fluid
//         selection
//         options={vaccineOptions}
//         value={selectedVaccine}
//         onChange={handleFilterChange}
//         style={{ marginBottom: "10px" }}
//       />

//       <MapContainer center={[45.9432, 24.9668]} zoom={6} style={{ height: "800px", width: "100%", zIndex: "3" }}>
//         <TileLayer
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//         />

//         {filteredReports.map((report, index) => {
//           const location = cityCoordinates[report.city] || { lat: 45.0, lng: 24.0 };

//           // Create an array for each severity level that exists
//           const severityLevels = [
//             { type: "MILD", count: report.mildCount },
//             { type: "MODERATE", count: report.moderateCount },
//             { type: "SEVERE", count: report.severeCount },
//             { type: "FATAL", count: report.fatalCount },
//           ];

//           return severityLevels.map((severity, i) => {
//             if (severity.count > 0) {
//               // Get offset values for shifting circles
//               const [latOffset, lngOffset] = severityOffsets[severity.type] || [0, 0];

//               return (
//                 <Circle
//                   key={`${index}-${i}`}
//                   center={[location.lat + latOffset, location.lng + lngOffset]} // Apply shift
//                   pathOptions={{
//                     color: severityColors[severity.type],
//                     fillColor: severityColors[severity.type],
//                     fillOpacity: 0.5,
//                   }}
//                   radius={severity.count * 800} // Adjust radius dynamically per severity level
//                 >
//                   <Popup>
//                     <strong>City:</strong> {report.city} <br />
//                     <strong>Vaccine:</strong> {report.vaccineName} <br />
//                     <strong>Severity:</strong> {severity.type} <br />
//                     <strong>Cases:</strong> {severity.count}
//                   </Popup>
//                 </Circle>
//               );
//             }
//             return null;
//           });
//         })}
//       </MapContainer>
//     </div>
//   );
// };

// export default MapReport;


import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { privaxApi } from "../misc/PrivaxApi";
import { Dropdown } from "semantic-ui-react";
import { cityCoordinates } from "../misc/Helpers";
import { debounce } from "lodash";
import EpsilonSlider from "./EpsilonSlider";


// Define severity colors
const severityColors = {
  MILD: "green",
  MODERATE: "orange",
  SEVERE: "red",
  FATAL: "black",
};

// Define small offsets for each severity level
const severityOffsets = {
  MILD: [0.03, 0], // Shift north
  MODERATE: [0, 0.03], // Shift east
  SEVERE: [-0.03, 0], // Shift south
  FATAL: [0, -0.03], // Shift west
};

// Define vaccine filter options
const vaccineOptions = [
  { key: "all", text: "All Vaccines", value: "ALL" },
  { key: "Pfizer", text: "Pfizer", value: "Pfizer" },
  { key: "Moderna", text: "Moderna", value: "Moderna" },
  { key: "AstraZeneca", text: "AstraZeneca", value: "AstraZeneca" },
  { key: "Johnson & Johnson", text: "Johnson & Johnson", value: "Johnson & Johnson" },
];

// Define severity filter options
const severityOptions = [
  { key: "all", text: "All Severities", value: "ALL" },
  { key: "MILD", text: "Mild", value: "MILD" },
  { key: "MODERATE", text: "Moderate", value: "MODERATE" },
  { key: "SEVERE", text: "Severe", value: "SEVERE" },
  { key: "FATAL", text: "Fatal", value: "FATAL" },
];

const MapReport = () => {
  const [epsilon, setEpsilon] = useState(1.0); // Default epsilon
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedVaccine, setSelectedVaccine] = useState("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");

  const fetchGroupedReports = async () => {
    try {
      const response = await privaxApi.getGroupedSideEffectReports(selectedVaccine, selectedSeverity, epsilon);
      setReports(response.data);
      setFilteredReports(response.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  useEffect(() => {
    const debouncedFetch = debounce(fetchGroupedReports, 500); // Wait 500ms after last change
    debouncedFetch();
    return () => debouncedFetch.cancel(); // Cleanup function to prevent multiple calls
  }, [selectedVaccine, selectedSeverity, epsilon]);
  

  return (
    <div>
      <Dropdown
        placeholder="Filter by Vaccine"
        fluid
        selection
        aria-label="Filter by vaccine"
        options={vaccineOptions}
        value={selectedVaccine}
        onChange={(e, { value }) => setSelectedVaccine(value)}
        style={{ marginBottom: "10px" }}
      />

      <Dropdown
        placeholder="Filter by Severity"
        fluid
        selection
        aria-label="Filter by severity"
        options={severityOptions}
        value={selectedSeverity}
        onChange={(e, { value }) => setSelectedSeverity(value)}
        style={{ marginBottom: "10px" }}
      />

      <div style={{ marginBottom: "20px" }}>
        <EpsilonSlider
          value={epsilon}
          onChange={setEpsilon}
          disabled
          label="Privacy level (epsilon)"
          hint="Fixed at ε = 1.0 — the map's city counts are released at one privacy level for everyone, so they can't be de-noised by tuning ε."
        />
      </div>

      {(() => {
        const totals = filteredReports.reduce(
          (acc, r) => ({
            mild:     acc.mild     + (r.mildCount     || 0),
            moderate: acc.moderate + (r.moderateCount || 0),
            severe:   acc.severe   + (r.severeCount   || 0),
            fatal:    acc.fatal    + (r.fatalCount    || 0),
          }),
          { mild: 0, moderate: 0, severe: 0, fatal: 0 }
        );
        const total = totals.mild + totals.moderate + totals.severe + totals.fatal;
        // Rows are grouped by city × vaccine, so count DISTINCT cities that have any cases,
        // not the number of grouped rows.
        const citiesAffected = new Set(
          filteredReports
            .filter(r => (r.mildCount || 0) + (r.moderateCount || 0) + (r.severeCount || 0) + (r.fatalCount || 0) > 0)
            .map(r => r.city)
        ).size;
        const pct = (n) => total > 0 ? Math.round((n / total) * 1000) / 10 : 0;
        return (
          <div className="map-stats">
            <div className="map-stat-card map-stat-hero">
              <div className="map-stat-glow" />
              <div className="map-stat-head">
                <span className="map-stat-dot" />
                <span className="map-stat-label">Total cases</span>
              </div>
              <div className="map-stat-num">{total.toLocaleString()}</div>
              <div className="map-stat-sub">across {citiesAffected} {citiesAffected === 1 ? 'city' : 'cities'}</div>
            </div>

            <div className="map-stat-card map-stat-mild">
              <div className="map-stat-glow" />
              <div className="map-stat-head">
                <span className="map-stat-dot" />
                <span className="map-stat-label">Mild</span>
              </div>
              <div className="map-stat-num">{totals.mild.toLocaleString()}</div>
              <div className="map-stat-sub">{pct(totals.mild)}% of total</div>
              <div className="map-stat-bar"><i style={{ width: `${pct(totals.mild)}%` }} /></div>
            </div>

            <div className="map-stat-card map-stat-moderate">
              <div className="map-stat-glow" />
              <div className="map-stat-head">
                <span className="map-stat-dot" />
                <span className="map-stat-label">Moderate</span>
              </div>
              <div className="map-stat-num">{totals.moderate.toLocaleString()}</div>
              <div className="map-stat-sub">{pct(totals.moderate)}% of total</div>
              <div className="map-stat-bar"><i style={{ width: `${pct(totals.moderate)}%` }} /></div>
            </div>

            <div className="map-stat-card map-stat-severe">
              <div className="map-stat-glow" />
              <div className="map-stat-head">
                <span className="map-stat-dot" />
                <span className="map-stat-label">Severe</span>
              </div>
              <div className="map-stat-num">{totals.severe.toLocaleString()}</div>
              <div className="map-stat-sub">{pct(totals.severe)}% of total</div>
              <div className="map-stat-bar"><i style={{ width: `${pct(totals.severe)}%` }} /></div>
            </div>

            <div className="map-stat-card map-stat-fatal">
              <div className="map-stat-glow" />
              <div className="map-stat-head">
                <span className="map-stat-dot" />
                <span className="map-stat-label">Fatal</span>
              </div>
              <div className="map-stat-num">{totals.fatal.toLocaleString()}</div>
              <div className="map-stat-sub">{pct(totals.fatal)}% of total</div>
              <div className="map-stat-bar"><i style={{ width: `${pct(totals.fatal)}%` }} /></div>
            </div>
          </div>
        );
      })()}

      <MapContainer center={[45.9432, 24.9668]} zoom={6} aria-label="Map of vaccine side-effect case counts by Romanian city" style={{ height: "800px", width: "100%", zIndex: "3" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {filteredReports.map((report, index) => {
          const location = cityCoordinates[report.city] || { lat: 45.0, lng: 24.0 };

          // ✅ Create an array for each severity level that exists
          const severityLevels = [
            { type: "MILD", count: report.mildCount },
            { type: "MODERATE", count: report.moderateCount },
            { type: "SEVERE", count: report.severeCount },
            { type: "FATAL", count: report.fatalCount },
          ];

          return severityLevels.map((severity, i) => {
            if (severity.count > 0) {
              // ✅ Get offset values to shift circles slightly
              const [latOffset, lngOffset] = severityOffsets[severity.type] || [0, 0];

              return (
                <Circle
                  key={`${index}-${i}`}
                  center={[location.lat + latOffset, location.lng + lngOffset]} // ✅ Apply offset to prevent overlap
                  pathOptions={{
                    color: severityColors[severity.type], 
                    fillColor: severityColors[severity.type],
                    fillOpacity: 0.5,
                  }}
                  radius={Math.max(3000, severity.count * 1000)} // ✅ Bigger size
                >
                  <Popup>
                    <strong>City:</strong> {report.city} <br />
                    <strong>Vaccine:</strong> {report.vaccineName} <br />
                    <strong>Severity:</strong> {severity.type} <br />
                    <strong>Cases:</strong> {severity.count}
                  </Popup>
                </Circle>
              );
            }
            return null;
          });
        })}
      </MapContainer>
    </div>
  );
};

export default MapReport;


