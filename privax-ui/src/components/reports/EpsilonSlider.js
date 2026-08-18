import React from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

// One canonical description of the privacy dial. Individual tabs may pass a more
// specific `hint` (e.g. the symptom chart), but the label, value readout, range,
// and styling are defined once here so the three Reports tabs can never drift.
const DEFAULT_HINT = "Lower ε = more privacy · Higher ε = more accuracy";

const EpsilonSlider = ({
  value,
  onChange,
  hint = DEFAULT_HINT,
  label = "Privacy budget (epsilon)",
  min = 0.1,
  max = 10,
  step = 0.1,
  disabled = false,
}) => (
  <div className="report-epsilon">
    <div className="report-epsilon-label">
      <span>{label}</span>
      <span className="report-epsilon-value">{value.toFixed(1)}</span>
    </div>
    <Slider min={min} max={max} step={step} value={value} onChange={onChange} disabled={disabled} />
    <p className="report-epsilon-hint">{hint}</p>
  </div>
);

export default EpsilonSlider;
