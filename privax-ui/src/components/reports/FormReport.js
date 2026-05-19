import React, { useState } from "react";
import { Form, FormField, Button, Dropdown, TextArea, Message } from "semantic-ui-react";
import { privaxApi } from "../misc/PrivaxApi";

// ✅ Severity options
const severityOptions = [
  { key: "mild", text: "Mild", value: "MILD" },
  { key: "moderate", text: "Moderate", value: "MODERATE" },
  { key: "severe", text: "Severe", value: "SEVERE" },
];

const symptomOptions = [
  // Common / mild
  { key: "fever",                   text: "Fever",                    value: "Fever" },
  { key: "fatigue",                 text: "Fatigue",                  value: "Fatigue" },
  { key: "headache",                text: "Headache",                 value: "Headache" },
  { key: "muscle-pain",             text: "Muscle Pain",              value: "Muscle Pain" },
  { key: "chills",                  text: "Chills",                   value: "Chills" },
  { key: "nausea",                  text: "Nausea",                   value: "Nausea" },
  { key: "dizziness",               text: "Dizziness",                value: "Dizziness" },
  { key: "joint-pain",              text: "Joint Pain",               value: "Joint Pain" },
  { key: "injection-site-pain",     text: "Injection Site Pain",      value: "Injection Site Pain" },
  { key: "swollen-lymph-nodes",     text: "Swollen Lymph Nodes",      value: "Swollen Lymph Nodes" },
  { key: "rash",                    text: "Rash",                     value: "Rash" },
  // Moderate
  { key: "vomiting",                text: "Vomiting",                 value: "Vomiting" },
  { key: "brain-fog",               text: "Brain Fog",                value: "Brain Fog" },
  { key: "insomnia",                text: "Insomnia",                 value: "Insomnia" },
  { key: "anxiety",                 text: "Anxiety",                  value: "Anxiety" },
  { key: "heart-palpitations",      text: "Heart Palpitations",       value: "Heart Palpitations" },
  { key: "chest-pain",              text: "Chest Pain",               value: "Chest Pain" },
  { key: "shortness-of-breath",     text: "Shortness of Breath",      value: "Shortness of Breath" },
  { key: "numbness-tingling",       text: "Numbness / Tingling",      value: "Numbness / Tingling" },
  { key: "tinnitus",                text: "Tinnitus",                 value: "Tinnitus" },
  // Severe / rare
  { key: "myocarditis",             text: "Myocarditis",              value: "Myocarditis" },
  { key: "anaphylaxis",             text: "Anaphylaxis",              value: "Anaphylaxis" },
  { key: "guillain-barre",          text: "Guillain-Barré Syndrome",  value: "Guillain-Barré Syndrome" },
  { key: "bells-palsy",             text: "Bell's Palsy",             value: "Bell's Palsy" },
  { key: "blood-clots",             text: "Blood Clots",              value: "Blood Clots" },
  { key: "seizures",                text: "Seizures",                 value: "Seizures" },
  { key: "encephalitis",            text: "Encephalitis",             value: "Encephalitis" },
  { key: "psychosis",               text: "Psychosis",                value: "Psychosis" },
  { key: "transverse-myelitis",     text: "Transverse Myelitis",      value: "Transverse Myelitis" },
  { key: "immune-thrombocytopenia", text: "Immune Thrombocytopenia",  value: "Immune Thrombocytopenia" },
  { key: "pots",                    text: "POTS",                     value: "POTS" },
  { key: "paralysis",               text: "Paralysis",                value: "Paralysis" },
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

const MIN_AGE = 0;
const MAX_AGE = 120;

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
  const [ageError, setAgeError] = useState("");

  // ✅ Handles input changes
  const handleChange = (e, data) => {
    if (data) {
      setFormData({ ...formData, [data.name]: data.value });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
      if (e.target.name === "age") setAgeError("");
    }
  };

  // ✅ Validate age inline
  const validateAge = (value) => {
    if (value === "" || value === null) return "Age is required.";
    const n = Number(value);
    if (!Number.isFinite(n) || Number.isNaN(n)) return "Age must be a number.";
    if (!Number.isInteger(n)) return "Age must be a whole number.";
    if (n < MIN_AGE || n > MAX_AGE) return `Age must be between ${MIN_AGE} and ${MAX_AGE}.`;
    return "";
  };

  // ✅ Handles multi-select dropdown for symptoms
  const handleSymptomsChange = (e, { value }) => {
    setFormData({ ...formData, symptoms: value });
  };

  const handleSubmit = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    // Age validation gate — block submission if out of range
    const ageErr = validateAge(formData.age);
    if (ageErr) {
      setAgeError(ageErr);
      return;
    }

    setLoading(true);

    try {
      console.log("Submitting report:", formData); // ✅ Debug submission data
      const response = await privaxApi.createSideEffectReport(formData);
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
      <FormField error={!!ageError}>
        <label>Age</label>
        <input
          type="number"
          name="age"
          min={MIN_AGE}
          max={MAX_AGE}
          step={1}
          placeholder={`Enter age (${MIN_AGE}–${MAX_AGE})`}
          value={formData.age}
          onChange={handleChange}
          onBlur={(e) => setAgeError(validateAge(e.target.value))}
          onInvalid={(e) => e.currentTarget.setCustomValidity(validateAge(e.currentTarget.value) || 'Please complete this field.')}
          onInput={(e) => e.currentTarget.setCustomValidity('')}
          required
        />
        {ageError && (
          <small className="form-field-error">{ageError}</small>
        )}
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
