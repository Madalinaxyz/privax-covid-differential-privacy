import React, { useState } from "react"
import { Form, FormField, Button, Dropdown, TextArea, Message } from "semantic-ui-react"
import { privaxApi } from "../misc/PrivaxApi"

const severityOptions = [
  { key: "mild",     text: "Mild",     value: "MILD" },
  { key: "moderate", text: "Moderate", value: "MODERATE" },
  { key: "severe",   text: "Severe",   value: "SEVERE" },
  { key: "fatal",    text: "Fatal",    value: "FATAL" },
]

const symptomOptions = [
  "Fever","Fatigue","Headache","Muscle Pain","Chills","Nausea",
  "Dizziness","Joint Pain","Injection Site Pain","Swollen Lymph Nodes","Rash",
  "Vomiting","Brain Fog","Insomnia","Anxiety","Heart Palpitations",
  "Chest Pain","Shortness of Breath","Numbness / Tingling","Tinnitus",
  "Myocarditis","Anaphylaxis","Guillain-Barré Syndrome","Bell's Palsy",
  "Blood Clots","Seizures","Encephalitis","Psychosis",
  "Transverse Myelitis","Immune Thrombocytopenia","POTS","Paralysis",
].map((s) => ({ key: s, text: s, value: s }))

const vaccineOptions = [
  { key: "pfizer",      text: "Pfizer",            value: "Pfizer" },
  { key: "moderna",     text: "Moderna",           value: "Moderna" },
  { key: "astrazeneca", text: "AstraZeneca",       value: "AstraZeneca" },
  { key: "johnson",     text: "Johnson & Johnson", value: "Johnson & Johnson" },
]

const cityOptions = [
  "Bucharest","Cluj-Napoca","Timișoara","Iași","Constanța","Craiova","Brașov","Galați",
  "Ploiești","Oradea","Brăila","Arad","Pitești","Sibiu","Bacău","Târgu Mureș",
  "Baia Mare","Buzău","Satu Mare","Râmnicu Vâlcea","Drobeta-Turnu Severin","Botoșani",
  "Reșița","Deva","Slatina","Focșani","Vaslui","Târgoviște","Bistrița",
].map((c) => ({ key: c, text: c, value: c }))

const MIN_AGE = 0
const MAX_AGE = 120

const emptyForm = () => ({
  patientCode: "",
  age: "",
  symptoms: [],
  severity: "",
  additionalInfo: "",
  reportedAt: new Date().toISOString(),
  vaccineName: "",
  city: "",
})

const DoctorReportForm = ({ onSubmitted }) => {
  const [formData, setFormData] = useState(emptyForm())
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [ageError, setAgeError] = useState("")

  const handleChange = (e, data) => {
    if (data) setFormData((f) => ({ ...f, [data.name]: data.value }))
    else {
      setFormData((f) => ({ ...f, [e.target.name]: e.target.value }))
      if (e.target.name === "age") setAgeError("")
    }
  }

  const validateAge = (value) => {
    if (value === "" || value === null) return "Age is required."
    const n = Number(value)
    if (!Number.isFinite(n) || Number.isNaN(n)) return "Age must be a number."
    if (!Number.isInteger(n)) return "Age must be a whole number."
    if (n < MIN_AGE || n > MAX_AGE) return `Age must be between ${MIN_AGE} and ${MAX_AGE}.`
    return ""
  }

  const handleSubmit = async () => {
    setSuccess("")
    setError("")

    const ageErr = validateAge(formData.age)
    if (ageErr) { setAgeError(ageErr); return }

    setLoading(true)
    try {
      await privaxApi.createClinicianReport(formData)
      setSuccess("Patient report submitted.")
      setFormData(emptyForm())
      onSubmitted?.()
    } catch (e) {
      console.error("Clinician submit failed:", e)
      setError("Failed to submit the report. Please try again.")
    }
    setLoading(false)
  }

  return (
    <Form onSubmit={handleSubmit} loading={loading} success={!!success} error={!!error}>
      <FormField>
        <label>Patient code <span className="form-hint">(optional, e.g. P-4821)</span></label>
        <input
          type="text"
          name="patientCode"
          maxLength={64}
          placeholder="Your internal reference for this patient"
          value={formData.patientCode}
          onChange={handleChange}
        />
      </FormField>

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
        {ageError && <small className="form-field-error">{ageError}</small>}
      </FormField>

      <FormField>
        <label>Symptoms reported</label>
        <Dropdown
          placeholder="Select symptoms"
          fluid multiple selection
          options={symptomOptions}
          name="symptoms"
          value={formData.symptoms}
          onChange={(_, { value }) => setFormData((f) => ({ ...f, symptoms: value }))}
        />
      </FormField>

      <FormField>
        <label>Severity</label>
        <Dropdown
          placeholder="Select severity"
          fluid selection
          options={severityOptions}
          name="severity"
          value={formData.severity}
          onChange={handleChange}
          required
        />
      </FormField>

      <FormField>
        <label>Vaccine administered</label>
        <Dropdown
          placeholder="Select vaccine"
          fluid selection
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
          fluid selection
          options={cityOptions}
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
        />
      </FormField>

      <FormField>
        <label>Clinical observations</label>
        <TextArea
          name="additionalInfo"
          placeholder="Your own clinical notes about onset, duration, treatment, etc."
          rows={4}
          value={formData.additionalInfo}
          onChange={handleChange}
        />
      </FormField>

      <Message success content={success} />
      <Message error content={error} />

      <Button type="submit" primary>Submit patient report</Button>
    </Form>
  )
}

export default DoctorReportForm
