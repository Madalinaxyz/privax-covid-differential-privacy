// import React from 'react'
// import {
//   TableRow,
//   TableHeaderCell,
//   TableHeader,
//   TableCell,
//   TableBody,
//   Table,
// } from 'semantic-ui-react'

// const TableReport = () => (
//   <Table striped>
//     <TableHeader>
//       <TableRow>
//         <TableHeaderCell>Name</TableHeaderCell>
//         <TableHeaderCell>Status</TableHeaderCell>
//         <TableHeaderCell>Notes</TableHeaderCell>
//       </TableRow>
//     </TableHeader>

//     <TableBody>
//       <TableRow verticalAlign='top'>
//         <TableCell>John</TableCell>
//         <TableCell>Approved</TableCell>
//         <TableCell verticalAlign='top'>
//           Notes
//           <br />
//           1<br />
//           2<br />
//         </TableCell>
//       </TableRow>
//       <TableRow>
//         <TableCell>Jamie</TableCell>
//         <TableCell verticalAlign='bottom'>Approved</TableCell>
//         <TableCell>
//           Notes
//           <br />
//           1<br />
//           2<br />
//         </TableCell>
//       </TableRow>
//     </TableBody>
//   </Table>
// )

// export default TableReport
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  TableRow,
  TableHeaderCell,
  TableHeader,
  TableCell,
  TableBody,
  Table,
  Loader,
  Button
} from "semantic-ui-react";

import { bookApi } from "../misc/BookApi";

const TableReport = ({ handleLogError }) => {
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef(null);
  const tableContainerRef = useRef(null); // To track scrolling

  // ✅ **Fetch Reports Function**
  const fetchReports = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    
    try {
      console.log(`Fetching page: ${page}`);
      const response = await bookApi.getSideEffectReports({ page, size: 10 });

      console.log("API Response:", response.data); // Debug API response

      if (response.data && Array.isArray(response.data.content)) {
        setReports((prev) => [...prev, ...response.data.content]); // Append new data
        setHasMore(response.data.content.length > 0); // Stop loading if empty
        setPage((prev) => prev + 1);
      } else {
        console.error("Unexpected API response:", response.data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      handleLogError?.(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // ✅ **IntersectionObserver for Infinite Scroll**
  const lastRowRef = useCallback(
    (node) => {
      if (loading) return;

      if (observer.current) observer.current.disconnect(); // Disconnect previous observer

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            console.log("🔹 Last row visible - Loading more data...");
            fetchReports();
          }
        },
        { root: tableContainerRef.current, rootMargin: "100px", threshold: 1.0 } // root: container element
      );

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // ✅ **Debug Scrolling Manually**
  const handleManualLoadMore = () => {
    console.log("🔹 Manually triggered load more!");
    fetchReports();
  };

  return (
    <div
      ref={tableContainerRef}
      style={{ height: "80vh", overflowY: "auto", border: "1px solid gray", padding: "10px" }}
      onScroll={() => console.log("🔹 Scrolling detected!")} // Debug if scrolling works
    >
      <Table striped>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Age</TableHeaderCell>
            <TableHeaderCell>Severity</TableHeaderCell>
            <TableHeaderCell>Vaccine</TableHeaderCell>
            <TableHeaderCell>Symptoms</TableHeaderCell>
            <TableHeaderCell>Reported At</TableHeaderCell>
            <TableHeaderCell>Additional Info</TableHeaderCell>
          </TableRow>
        </TableHeader>

        <TableBody>
          {reports.map((report, index) => (
            <TableRow key={report.id} ref={index === reports.length - 1 ? lastRowRef : null}>
              <TableCell>{report.age}</TableCell>
              <TableCell>{report.severity}</TableCell>
              <TableCell>{report.vaccineName}</TableCell>
              <TableCell>{report.symptoms.join(", ")}</TableCell>
              <TableCell>{new Date(report.reportedAt).toLocaleString()}</TableCell>
              <TableCell>{report.additionalInfo || "N/A"}</TableCell>
            </TableRow>
          ))}
        </TableBody>

        {loading && (
          <TableRow>
            <TableCell colSpan="6">
              <Loader active inline="centered" />
            </TableCell>
          </TableRow>
        )}
      </Table>

      {/* ✅ Debugging Button */}
      <Button primary onClick={handleManualLoadMore} disabled={loading} style={{ marginTop: "10px" }}>
        Load More (Debug)
      </Button>
    </div>
  );
};

export default TableReport;
