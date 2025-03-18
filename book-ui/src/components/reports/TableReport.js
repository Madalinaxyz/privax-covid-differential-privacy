import React, { useEffect, useState } from "react";
import { Table, TableRow, TableHeaderCell, TableHeader, TableCell, TableBody, Button } from "semantic-ui-react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { bookApi } from "../misc/BookApi";
import { applyDifferentialPrivacy } from "../misc/Helpers";

const TableReport = ({ handleLogError }) => {
  const [reports, setReports] = useState([]);
  const [originalReports, setOriginalReports] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [epsilon, setEpsilon] = useState(10.0);

  const fetchReports = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
  
    try {
      console.log(`Fetching page: ${page}`);
      const response = await bookApi.getSideEffectReports({ page, size: 10 });
  
      setOriginalReports((prev) => [...prev, ...response.data.content]); 
      setReports((prev) => [...prev, ...applyDifferentialPrivacy(response.data.content, epsilon)]); 
  
      setHasMore(response.data.content.length > 0);
      setPage((prev) => prev + 1);
    } catch (error) {
      console.error("Error fetching reports:", error);
      handleLogError?.(error);
    }
  
    setLoading(false);
  };

  useEffect(() => {
    if (originalReports.length > 0) {
      setReports(applyDifferentialPrivacy(originalReports, epsilon));
    }
  }, [epsilon, originalReports]);

  return (
    <div style={{ height: "80vh", overflowY: "auto", border: "1px solid gray", padding: "10px" }}>
      <div style={{ marginBottom: "20px" }}>
        <p>Epsilon: {epsilon.toFixed(1)} (Lower = More Privacy, Higher = More Accuracy)</p>
        <Slider min={0.1} max={10} step={0.1} value={epsilon} onChange={setEpsilon} />
      </div>

      <Table striped>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Age</TableHeaderCell>
            <TableHeaderCell>Severity</TableHeaderCell>
            <TableHeaderCell>Vaccine</TableHeaderCell>
            <TableHeaderCell>Symptoms</TableHeaderCell>
            <TableHeaderCell>Reported At</TableHeaderCell>
            <TableHeaderCell>City</TableHeaderCell>
            <TableHeaderCell>Additional Info</TableHeaderCell>
          </TableRow>
        </TableHeader>

        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell><b>{report.age}</b></TableCell>
              <TableCell><b>{report.severity}</b></TableCell>
              <TableCell><b>{report.vaccineName}</b></TableCell>
              <TableCell><b>{report.symptoms.join(", ")}</b></TableCell>
              <TableCell>{new Date(report.reportedAt).toLocaleString()}</TableCell>
              <TableCell><b>{report.city}</b></TableCell>
              <TableCell>{report.additionalInfo}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Button 
        primary 
        onClick={fetchReports} 
        disabled={loading || !hasMore} 
        style={{ marginTop: "10px" }}
      >
        {loading ? "Loading..." : "Load More"}
      </Button>
    </div>
  );
};

export default TableReport;
