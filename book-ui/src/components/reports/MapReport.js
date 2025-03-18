// import React, { useEffect, useState } from "react";
// import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import { bookApi } from "../misc/BookApi";
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
//         const response = await bookApi.getGroupedSideEffectReports(selectedVaccine);
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
import { bookApi } from "../misc/BookApi";
import { Dropdown } from "semantic-ui-react";
import { cityCoordinates } from "../misc/Helpers";
import { debounce } from "lodash";

import Slider from "rc-slider";
import "rc-slider/assets/index.css"; // Import styles


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
  { key: "Johnson & Johnson", text: "Johnson & Johnson" },
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
      const response = await bookApi.getGroupedSideEffectReports(selectedVaccine, selectedSeverity, epsilon);
      console.log("API Response:", response.data);
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
        options={vaccineOptions}
        value={selectedVaccine}
        onChange={(e, { value }) => setSelectedVaccine(value)}
        style={{ marginBottom: "10px" }}
      />

      <Dropdown
        placeholder="Filter by Severity"
        fluid
        selection
        options={severityOptions}
        value={selectedSeverity}
        onChange={(e, { value }) => setSelectedSeverity(value)}
        style={{ marginBottom: "10px" }}
      />

      <div style={{ marginBottom: "20px" }}>
        <p>Epsilon: {epsilon.toFixed(1)} (Lower = More Privacy, Higher = More Accuracy)</p>
        <Slider
          min={0.1}
          max={10}
          step={0.1}
          value={epsilon}
          onChange={(value) => setEpsilon(value)}
        />
      </div>



      <MapContainer center={[45.9432, 24.9668]} zoom={6} style={{ height: "800px", width: "100%", zIndex: "3" }}>
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


