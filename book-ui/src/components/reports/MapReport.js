// import React, { useEffect, useState } from "react";
// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";
// import { bookApi } from "../misc/BookApi";

// // Define severity colors
// const severityColors = {
//   MILD: "green",
//   MODERATE: "orange",
//   SEVERE: "red",
// };

// // Romania Map Settings
// const romaniaCenter = [45.9432, 24.9668]; // Romania's geographic center
// const romaniaBounds = [
//   [43.5, 20.5], // Southwest corner
//   [48.5, 30.5], // Northeast corner
// ];

// // Custom Marker Icon
// const markerIcon = new L.Icon({
//   iconUrl: "https://leafletjs.com/examples/custom-icons/leaf-green.png", // Use a custom icon if needed
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
// });

// const MapReport = () => {
//   const [reports, setReports] = useState([]);

//   useEffect(() => {
//     const fetchReports = async () => {
//       try {
//         const response = await bookApi.getSideEffectReports();
//         console.log("API Data:", response.data);
        
//         // Only keep reports that have valid coordinates inside Romania
//         const filteredReports = response.data.content.filter(
//           (report) => report.latitude >= 43.5 && report.latitude <= 48.5 && 
//                       report.longitude >= 20.5 && report.longitude <= 30.5
//         );
        
//         setReports(filteredReports);
//       } catch (error) {
//         console.error("Error fetching side effects:", error);
//       }
//     };

//     fetchReports();
//   }, []);

//   return (
//     <MapContainer
//       center={romaniaCenter}
//       zoom={6}
//       style={{ height: "80%", minHeight: "800px", width: "100%" }}
//       maxBounds={romaniaBounds} // Restrict the map to Romania
//       maxBoundsViscosity={1.0} // Ensures the user can't pan outside Romania
//     >
//       {/* OpenStreetMap Tiles */}
//       <TileLayer
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//       />

//       {/* Display Side Effect Reports as Markers */}
//       {reports.map((report, index) => (
//         <Marker
//           key={index}
//           position={[report.latitude, report.longitude]} // Use API data for location
//           icon={markerIcon}
//         >
//           <Popup>
//             <strong>Vaccine:</strong> {report.vaccineName} <br />
//             <strong>Age:</strong> {report.age} <br />
//             <strong>Severity:</strong> {report.severity} <br />
//             <strong>Symptoms:</strong> {report.symptoms.join(", ")}
//           </Popup>
//         </Marker>
//       ))}
//     </MapContainer>
//   );
// };

// export default MapReport;


import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { bookApi } from "../misc/BookApi";
import { Button, Dropdown } from "semantic-ui-react";
import { cityCoordinates } from "../misc/Helpers";

// Define severity colors
const severityColors = {
  MILD: "green",
  MODERATE: "orange",
  SEVERE: "red",
  FATAL: "black",
};

// Define vaccine filter options
const vaccineOptions = [
  { key: "all", text: "All Vaccines", value: "ALL" },
  { key: "Pfizer", text: "Pfizer", value: "Pfizer" },
  { key: "Moderna", text: "Moderna", value: "Moderna" },
  { key: "AstraZeneca", text: "AstraZeneca", value: "AstraZeneca" },
  { key: "Johnson & Johnson", text: "Johnson & Johnson", value: "Johnson & Johnson" },
];

const MapReport = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedVaccine, setSelectedVaccine] = useState("ALL");
const [page, setPage] = useState(0);
  

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await bookApi.getSideEffectReports({ page, size: 100 });
        setReports(response.data.content);
        setFilteredReports(response.data.content);
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    };

    fetchReports();
  }, []);

  // Handle vaccine filter
  const handleFilterChange = (e, { value }) => {
    setSelectedVaccine(value);
    if (value === "ALL") {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter((report) => report.vaccineName === value));
    }
  };

  return (
    <div>
      <Dropdown
        placeholder="Filter by Vaccine"
        fluid
        selection
        options={vaccineOptions}
        value={selectedVaccine}
        onChange={handleFilterChange}
        style={{ marginBottom: "10px" }}
      />

      <MapContainer center={[45.9432, 24.9668]} zoom={6} style={{ height: "800px", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {filteredReports.map((report, index) => {
          const location = cityCoordinates[report.city] || { lat: 45.0, lng: 24.0 };
          return (
            <Circle
              key={index}
              center={[location.lat, location.lng]}
              pathOptions={{
                color: severityColors[report.severity] || "blue",
                fillColor: severityColors[report.severity] || "blue",
                fillOpacity: 0.5,
              }}
              radius={report.severity === "SEVERE" ? 50000 : report.severity === "MODERATE" ? 30000 : 10000}
            >
              <Popup>
                <strong>Vaccine:</strong> {report.vaccineName} <br />
                <strong>Severity:</strong> {report.severity} <br />
                <strong>City:</strong> {report.city} <br />
                <strong>Symptoms:</strong> {report.symptoms.join(", ")}
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapReport;
