import { useState, useCallback, useId } from "react";
import "./App.css";

const PRESET_TIPS = [10, 15, 18, 20];
const MAX_TIP = 100;
const MAX_BILL = 1_000_000;
const MAX_PEOPLE = 100;

function useField(initial = "") {
  const [value, setValue] = useState(initial);
  const [touched, setTouched] = useState(false);
  const reset = useCallback(() => { setValue(initial); setTouched(false); }, [initial]);
  return { value, setValue, touched, setTouched, reset };
}

function validate({ bill, tip, people }) {
  const errors = {};
  const billNum = parseFloat(bill);
  const tipNum = parseFloat(tip);
  const peopleNum = parseInt(people, 10);

  if (bill === "" || bill === undefined) {
    // no error until touched
  } else if (isNaN(billNum) || !/^\d*\.?\d*$/.test(bill.trim())) {
    errors.bill = "Enter a valid number";
  } else if (billNum <= 0) {
    errors.bill = "Bill must be greater than #0";
  } else if (billNum > MAX_BILL) {
    errors.bill = `Bill cannot exceed #${MAX_BILL.toLocaleString()}`;
  }

  if (tip !== "" && tip !== undefined) {
    if (isNaN(tipNum) || !/^\d*\.?\d*$/.test(String(tip).trim())) {
      errors.tip = "Enter a valid percentage";
    } else if (tipNum < 0) {
      errors.tip = "Tip cannot be negative";
    } else if (tipNum > MAX_TIP) {
      errors.tip = `Tip cannot exceed ${MAX_TIP}%`;
    }
  }

  if (people === "" || people === undefined) {
    // no error until touched
  } else if (!/^\d+$/.test(String(people).trim())) {
    errors.people = "Must be a whole number";
  } else if (peopleNum < 1) {
    errors.people = "At least 1 person required";
  } else if (peopleNum > MAX_PEOPLE) {
    errors.people = `Max ${MAX_PEOPLE} people`;
  }

  return errors;
}

function compute({ bill, tip, people }) {
  const billNum = parseFloat(bill) || 0;
  const tipNum = parseFloat(tip) || 0;
  const peopleNum = Math.max(1, parseInt(people, 10) || 1);

  const tipAmount = billNum * (tipNum / 100);
  const grandTotal = billNum + tipAmount;
  // Rounding policy: round UP per person (ceiling at 2dp) so group never underpays
  const rawPerPerson = grandTotal / peopleNum;
  const perPerson = Math.ceil(rawPerPerson * 100) / 100;
  const tipPerPerson = Math.ceil((tipAmount / peopleNum) * 100) / 100;

  return { tipAmount, grandTotal, perPerson, tipPerPerson };
}

function fmt(n) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function App() {
  const billField = useField("");
  const tipField = useField("");
  const peopleField = useField("1");
  const [activePreset, setActivePreset] = useState(null);
  const [customTip, setCustomTip] = useState(false);

  const billId = useId();
  const tipId = useId();
  const peopleId = useId();

  // Paste errors are shown separately from validation errors and auto-clear after 3 s.
  const [pasteErrors, setPasteErrors] = useState({});
  function setPasteError(field, msg) {
    setPasteErrors((prev) => ({ ...prev, [field]: msg }));
    setTimeout(() => setPasteErrors((prev) => ({ ...prev, [field]: undefined })), 3000);
  }

  const errors = validate({
    bill: billField.touched ? billField.value : undefined,
    tip: tipField.touched ? tipField.value : undefined,
    people: peopleField.touched ? peopleField.value : undefined,
  });

  const allErrors = validate({
    bill: billField.value,
    tip: tipField.value,
    people: peopleField.value,
  });

  const hasErrors = Object.keys(allErrors).length > 0;
  const hasValues = billField.value !== "" && peopleField.value !== "";
  const ready = hasValues && !hasErrors;

  const result = ready ? compute({
    bill: billField.value,
    tip: tipField.value || "0",
    people: peopleField.value,
  }) : null;

  // Paste handlers: reject anything that isn't a valid positive number for the field type.
  // On rejection the field value is unchanged and an inline error appears for 3 s.
  function handleBillPaste(e) {
    e.preventDefault();
    const raw = (e.clipboardData || window.clipboardData).getData("text").trim();
    // Must be a positive decimal: digits with an optional single dot, value > 0
    if (!/^\d+(\.\d+)?$/.test(raw) || parseFloat(raw) <= 0) {
      setPasteError("bill", "Paste a positive number (e.g. 42.50)");
      return;
    }
    billField.setValue(raw);
    billField.setTouched(true);
  }

  function handleTipPaste(e) {
    e.preventDefault();
    const raw = (e.clipboardData || window.clipboardData).getData("text").trim();
    // Must be a non-negative decimal within bounds (0 is allowed — no tip)
    if (!/^\d+(\.\d+)?$/.test(raw) || parseFloat(raw) < 0 || parseFloat(raw) > MAX_TIP) {
      setPasteError("tip", `Paste a number between 0 and ${MAX_TIP}`);
      return;
    }
    setCustomTip(true);
    setActivePreset(null);
    tipField.setValue(raw);
    tipField.setTouched(true);
  }

  function handlePeoplePaste(e) {
    e.preventDefault();
    const raw = (e.clipboardData || window.clipboardData).getData("text").trim();
    // Must be a positive integer
    if (!/^\d+$/.test(raw) || parseInt(raw, 10) < 1 || parseInt(raw, 10) > MAX_PEOPLE) {
      setPasteError("people", `Paste a whole number between 1 and ${MAX_PEOPLE}`);
      return;
    }
    peopleField.setValue(raw);
    peopleField.setTouched(true);
  }


  function handlePreset(pct) {
    setActivePreset(pct);
    setCustomTip(false);
    tipField.setValue(String(pct));
    tipField.setTouched(false);
  }

  function handleCustomTip(val) {
    // Only allow digits and one decimal point
    const cleaned = val.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    setCustomTip(true);
    setActivePreset(null);
    tipField.setValue(cleaned);
    tipField.setTouched(true);
  }

  function handleBill(val) {
    const cleaned = val.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    billField.setValue(cleaned);
    billField.setTouched(true);
  }

  function handlePeople(val) {
    const cleaned = val.replace(/[^0-9]/g, "");
    peopleField.setValue(cleaned);
    peopleField.setTouched(true);
  }

  function handleReset() {
    billField.reset();
    tipField.reset();
    peopleField.reset();
    setActivePreset(null);
    setCustomTip(false);
  }

  return (
    <div className="app">
      <div className="receipt-card">
        {/* Header */}
        <header className="receipt-header" role="banner">
          <div className="receipt-perforation" aria-hidden="true"></div>
          <div className="logo-row">
            <span className="logo-mark" aria-hidden="true">#</span>
            <div>
              <h1 className="app-title">Naija Zone</h1>
              <p className="app-subtitle">Bill & Tip Calculator</p>
            </div>
          </div>
          <div className="receipt-dashes" aria-hidden="true">- - - - - - - - - - - - - - - - - - - - -</div>
        </header>

        <main className="receipt-body">
          {/* Bill Amount */}
          <section className="field-group" aria-labelledby={`${billId}-label`}>
            <label id={`${billId}-label`} className="field-label" htmlFor={billId}>
              Bill Amount
            </label>
            <div className={`input-wrap ${errors.bill || pasteErrors.bill ? "has-error" : ""}`}>
              <span className="input-prefix" aria-hidden="true">#</span>
              <input
                id={billId}
                className="field-input"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={billField.value}
                onChange={(e) => handleBill(e.target.value)}
                onPaste={handleBillPaste}
                onBlur={() => billField.setTouched(true)}
                autoComplete="off"
                aria-describedby={`${billId}-error`}
                aria-invalid={!!(errors.bill || pasteErrors.bill)}
              />
            </div>
            <p id={`${billId}-error`} className="error-msg" role="alert" aria-live="polite"
               style={{ display: pasteErrors.bill || errors.bill ? "flex" : "none" }}>
              {pasteErrors.bill || errors.bill}
            </p>
          </section>

          {/* Tip % */}
          <section className="field-group" aria-labelledby="tip-section-label">
            <span id="tip-section-label" className="field-label">Tip %</span>
            <div className="preset-row" role="group" aria-label="Tip percentage presets">
              {PRESET_TIPS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  className={`preset-btn ${activePreset === pct ? "active" : ""}`}
                  onClick={() => handlePreset(pct)}
                  aria-pressed={activePreset === pct}
                >
                  {pct}%
                </button>
              ))}
            </div>
            <div className={`input-wrap custom-tip-wrap ${errors.tip || pasteErrors.tip ? "has-error" : ""} ${customTip ? "custom-active" : ""}`}>
              <span className="input-prefix" aria-hidden="true">%</span>
              <input
                id={tipId}
                className="field-input"
                type="text"
                inputMode="decimal"
                placeholder="Custom"
                value={customTip ? tipField.value : ""}
                onChange={(e) => handleCustomTip(e.target.value)}
                onPaste={handleTipPaste}
                onFocus={() => { setCustomTip(true); setActivePreset(null); }}
                onBlur={() => tipField.setTouched(true)}
                autoComplete="off"
                aria-label="Custom tip percentage"
                aria-describedby={`${tipId}-error`}
                aria-invalid={!!(errors.tip || pasteErrors.tip)}
              />
            </div>
            <p id={`${tipId}-error`} className="error-msg" role="alert" aria-live="polite"
               style={{ display: pasteErrors.tip || errors.tip ? "flex" : "none" }}>
              {pasteErrors.tip || errors.tip}
            </p>
          </section>

          {/* Number of People */}
          <section className="field-group" aria-labelledby={`${peopleId}-label`}>
            <label id={`${peopleId}-label`} className="field-label" htmlFor={peopleId}>
              Split Between
            </label>
            <div className={`input-wrap people-wrap ${errors.people || pasteErrors.people ? "has-error" : ""}`}>
              <span className="input-prefix people-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </span>
              <input
                id={peopleId}
                className="field-input"
                type="text"
                inputMode="numeric"
                placeholder="1"
                value={peopleField.value}
                onChange={(e) => handlePeople(e.target.value)}
                onPaste={handlePeoplePaste}
                onBlur={() => peopleField.setTouched(true)}
                autoComplete="off"
                aria-describedby={pasteErrors.people || errors.people ? `${peopleId}-error` : `${peopleId}-hint`}
                aria-invalid={!!(errors.people || pasteErrors.people)}
              />
              <span className="input-suffix" aria-hidden="true">people</span>
            </div>
            <p id={`${peopleId}-hint`} className="field-hint" hidden={!!(errors.people || pasteErrors.people)}>
              Enter 1 for solo dining
            </p>
            <p id={`${peopleId}-error`} className="error-msg" role="alert" aria-live="polite"
               style={{ display: pasteErrors.people || errors.people ? "flex" : "none" }}>
              {pasteErrors.people || errors.people}
            </p>
          </section>

          {/* Divider */}
          <div className="receipt-dashes" aria-hidden="true">- - - - - - - - - - - - - - - - - - - - -</div>

          {/* Results */}
          <section className="results-section" aria-label="Calculation results" aria-live="polite">
            <div className="result-row">
              <span className="result-label">Tip Amount</span>
              <span className="result-value" aria-label={`Tip amount: #${result ? fmt(result.tipAmount) : "0.00"}`}>
                #{result ? fmt(result.tipAmount) : "0.00"}
              </span>
            </div>
            <div className="result-row">
              <span className="result-label">Grand Total</span>
              <span className="result-value" aria-label={`Grand total: #${result ? fmt(result.grandTotal) : "0.00"}`}>
                #{result ? fmt(result.grandTotal) : "0.00"}
              </span>
            </div>

            <div className="receipt-dashes" aria-hidden="true">- - - - - - - - - - - - - - - - - - - - -</div>

            <div className="per-person-block" aria-label={`Per person: #${result ? fmt(result.perPerson) : "0.00"}`}>
              <div className="per-person-label">
                Per Person
                {result && parseInt(peopleField.value) > 1 && (
                  <span className="per-person-tip-hint">
                    (incl. #{fmt(result.tipPerPerson)} tip)
                  </span>
                )}
              </div>
              <div className={`per-person-amount ${result ? "has-value" : ""}`}>
                #{result ? fmt(result.perPerson) : "—"}
              </div>
              {result && parseInt(peopleField.value) > 1 && (
                <p className="rounding-note" aria-live="polite">
                  ↑ Rounded up so no one underpays
                </p>
              )}
            </div>
          </section>

          {/* Reset */}
          <div className="receipt-dashes" aria-hidden="true">- - - - - - - - - - - - - - - - - - - - -</div>
          <div className="actions-row">
            <button
              type="button"
              className="reset-btn"
              onClick={handleReset}
              aria-label="Reset all fields to defaults"
            >
              ↺ Reset
            </button>
          </div>
        </main>

        <footer className="receipt-footer" role="contentinfo">
          <div className="receipt-perforation bottom" aria-hidden="true"></div>
          <p className="footer-note">App built with &#10084; by Joseph</p>
        </footer>
      </div>
    </div>
  );
}