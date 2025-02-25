import React, { useState } from "react";
import { Form, FormField, Button, Dropdown, TextArea, Message } from "semantic-ui-react";
import { bookApi } from "../misc/BookApi";

// ✅ Severity options
const severityOptions = [
  { key: "mild", text: "Mild", value: "MILD" },
  { key: "moderate", text: "Moderate", value: "MODERATE" },
  { key: "severe", text: "Severe", value: "SEVERE" },
];

// ✅ Symptoms options
const symptomOptions = [
  { key: "fever", text: "Fever", value: "Fever" },
  { key: "fatigue", text: "Fatigue", value: "Fatigue" },
  { key: "headache", text: "Headache", value: "Headache" },
  { key: "nausea", text: "Nausea", value: "Nausea" },
];

// ✅ Vaccine options
const vaccineOptions = [
  { key: "pfizer", text: "Pfizer", value: "Pfizer" },
  { key: "moderna", text: "Moderna", value: "Moderna" },
  { key: "astrazeneca", text: "AstraZeneca", value: "AstraZeneca" },
  { key: "johnson", text: "Johnson & Johnson", value: "Johnson & Johnson" },
];

// ✅ City options (30 major Romanian cities)
const cityOptions = [
  { key: "bucharest", text: "Bucharest", value: "Bucharest" },
  { key: "cluj", text: "Cluj-Napoca", value: "Cluj-Napoca" },
  { key: "timisoara", text: "Timișoara", value: "Timișoara" },
  { key: "iasi", text: "Iași", value: "Iași" },
  { key: "constanta", text: "Constanța", value: "Constanța" },
  { key: "craiova", text: "Craiova", value: "Craiova" },
  { key: "brasov", text: "Brașov", value: "Brașov" },
  { key: "galati", text: "Galați", value: "Galați" },
  { key: "ploiesti", text: "Ploiești", value: "Ploiești" },
  { key: "oradea", text: "Oradea", value: "Oradea" },
  { key: "braila", text: "Brăila", value: "Brăila" },
  { key: "arad", text: "Arad", value: "Arad" },
  { key: "pitesti", text: "Pitești", value: "Pitești" },
  { key: "sibiu", text: "Sibiu", value: "Sibiu" },
  { key: "bacau", text: "Bacău", value: "Bacău" },
  { key: "targu-mures", text: "Târgu Mureș", value: "Târgu Mureș" },
  { key: "baia-mare", text: "Baia Mare", value: "Baia Mare" },
  { key: "buzau", text: "Buzău", value: "Buzău" },
  { key: "satu-mare", text: "Satu Mare", value: "Satu Mare" },
  { key: "ramnicu-valcea", text: "Râmnicu Vâlcea", value: "Râmnicu Vâlcea" },
  { key: "drobeta", text: "Drobeta-Turnu Severin", value: "Drobeta-Turnu Severin" },
  { key: "botosani", text: "Botoșani", value: "Botoșani" },
  { key: "resita", text: "Reșița", value: "Reșița" },
  { key: "deva", text: "Deva", value: "Deva" },
  { key: "slatina", text: "Slatina", value: "Slatina" },
  { key: "focsani", text: "Focșani", value: "Focșani" },
  { key: "vaslui", text: "Vaslui", value: "Vaslui" },
  { key: "targoviste", text: "Târgoviște", value: "Târgoviște" },
  { key: "bistrita", text: "Bistrița", value: "Bistrița" }
];

const FormReport = () => {
  const [formData, setFormData] = useState({
    age: "",
    symptoms: [],
    severity: "",
    additionalInfo: "",
    reportedAt: new Date().toISOString(),
    vaccineName: "",
    city: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ✅ Handles input changes
  const handleChange = (e, data) => {
    if (data) {
      setFormData({ ...formData, [data.name]: data.value });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  // ✅ Handles multi-select dropdown for symptoms
  const handleSymptomsChange = (e, { value }) => {
    setFormData({ ...formData, symptoms: value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      console.log("Submitting report:", formData); // ✅ Debug submission data
      const response = await bookApi.createSideEffectReport(formData);
      console.log("Report created:", response.data);
      setSuccessMessage("Report submitted successfully!");
      setFormData({
        age: "",
        symptoms: [],
        severity: "",
        additionalInfo: "",
        reportedAt: new Date().toISOString(),
        vaccineName: "",
        city: "",
      });
    } catch (error) {
      console.error("Error submitting report:", error);
      setErrorMessage("Failed to submit the report. Please try again.");
    }
    setLoading(false);
  };

  return (
    <Form onSubmit={handleSubmit} loading={loading} success={!!successMessage} error={!!errorMessage}>
      <FormField>
        <label>Age</label>
        <input
          type="number"
          name="age"
          placeholder="Enter age"
          value={formData.age}
          onChange={handleChange}
          required
        />
      </FormField>

      <FormField>
        <label>Symptoms</label>
        <Dropdown
          placeholder="Select symptoms"
          fluid
          multiple
          selection
          options={symptomOptions}
          name="symptoms"
          value={formData.symptoms}
          onChange={handleSymptomsChange}
        />
      </FormField>

      <FormField>
        <label>Severity</label>
        <Dropdown
          placeholder="Select severity"
          fluid
          selection
          options={severityOptions}
          name="severity"
          value={formData.severity}
          onChange={handleChange}
          required
        />
      </FormField>

      <FormField>
        <label>Vaccine Name</label>
        <Dropdown
          placeholder="Select vaccine"
          fluid
          selection
          options={vaccineOptions}
          name="vaccineName"
          value={formData.vaccineName}
          onChange={handleChange}
          required
        />
      </FormField>

      <FormField>
        <label>City</label>
        <Dropdown
          placeholder="Select city"
          fluid
          selection
          options={cityOptions}
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
        />
      </FormField>

      <FormField>
        <label>Additional Info</label>
        <TextArea
          name="additionalInfo"
          placeholder="Provide any additional details..."
          value={formData.additionalInfo}
          onChange={handleChange}
        />
      </FormField>

      <Message success content={successMessage} />
      <Message error content={errorMessage} />

      <Button type="submit" primary>
        Submit Report
      </Button>
    </Form>
  );
};

export default FormReport;
