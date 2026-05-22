import { useState } from "react"
const API_URL = import.meta.env.VITE_API_URL

const TABS = ["Paste data", "Fetch by ticker"]

function CalibrationPanel({ onCalibrated }) {
  const [tab, setTab] = useState(0)
  const [ticker, setTicker] = useState("")
  const [rawStrikes, setRawStrikes] = useState("")
  const [rawMaturities, setRawMaturities] = useState("")
  const [rawPrices, setRawPrices] = useState("")
  const [S0, setS0] = useState(100)
  const [r, setR] = useState(0.05)
  const [q, setQ] = useState(0.0)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const parseCSV = (str) =>
    str.split(",").map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n))

  const handlePasteCalibrate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`${API_URL}/calibrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          S0,
          r,
          q,
          strikes:    parseCSV(rawStrikes),
          maturities: parseCSV(rawMaturities),
          prices:     parseCSV(rawPrices),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTickerCalibrate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      // Step 1 — fetch option chain
      const chainRes = await fetch(`http://127.0.0.1:8000/options/${ticker.toUpperCase()}`)
      const chain = await chainRes.json()
      if (!chainRes.ok) throw new Error(chain.detail)

      // Step 2 — calibrate
      const calRes = await fetch(`${API_URL}/calibrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          S0:         chain.spot,
          r,
          q,
          strikes:    chain.strikes,
          maturities: chain.maturities,
          prices:     chain.prices,
        }),
      })
      const data = await calRes.json()
      if (!calRes.ok) throw new Error(data.detail)
      setResult({ ...data, spot: chain.spot, ticker: chain.ticker })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (!result) return
    onCalibrated({
      kappa: result.kappa,
      theta: result.theta,
      sigma: result.sigma,
      rho:   result.rho,
      v0:    result.v0,
      ...(result.spot ? { S0: result.spot } : {}),
    },result.error)
  }

  const inputStyle = {
    fontFamily: "monospace",
    padding: "4px 8px",
    width: "100%",
    boxSizing: "border-box",
  }

  const labelStyle = {
    display: "block",
    marginBottom: 8,
    fontFamily: "monospace",
    fontSize: "0.9rem",
  }

  return (
    <div style={{ marginTop: "3rem", borderTop: "1px solid #ccc", paddingTop: "2rem" }}>
      <h2 style={{ fontFamily: "monospace", marginBottom: "1rem" }}>Calibration</h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: "1.5rem" }}>
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            style={{
              padding: "6px 18px",
              fontFamily: "monospace",
              cursor: "pointer",
              background: tab === i ? "#333" : "#f0f0f0",
              color: tab === i ? "#fff" : "#333",
              border: "1px solid #ccc",
              borderRight: i === 0 ? "none" : "1px solid #ccc",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Shared rate inputs */}
      <div style={{ display: "flex", gap: 24, marginBottom: "1.5rem" }}>
        <label style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
          Risk-free rate
          <input
            type="number" step="any" value={r}
            onChange={(e) => setR(parseFloat(e.target.value))}
            style={{ ...inputStyle, width: 100, marginLeft: 8 }}
          />
        </label>
        <label style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
          Dividend yield
          <input
            type="number" step="any" value={q}
            onChange={(e) => setQ(parseFloat(e.target.value))}
            style={{ ...inputStyle, width: 100, marginLeft: 8 }}
          />
        </label>
      </div>

      {/* Tab 0 — Paste data */}
      {tab === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 500 }}>
          <label style={labelStyle}>
            Spot price (S₀)
            <input
              type="number" step="any" value={S0}
              onChange={(e) => setS0(parseFloat(e.target.value))}
              style={{ ...inputStyle, marginTop: 4 }}
            />
          </label>
          <label style={labelStyle}>
            Strikes (comma-separated)
            <input
              type="text" value={rawStrikes}
              onChange={(e) => setRawStrikes(e.target.value)}
              placeholder="90, 95, 100, 105, 110"
              style={{ ...inputStyle, marginTop: 4 }}
            />
          </label>
          <label style={labelStyle}>
            Maturities in years (comma-separated)
            <input
              type="text" value={rawMaturities}
              onChange={(e) => setRawMaturities(e.target.value)}
              placeholder="0.25, 0.25, 0.5, 0.5, 1.0"
              style={{ ...inputStyle, marginTop: 4 }}
            />
          </label>
          <label style={labelStyle}>
            Market call prices (comma-separated)
            <input
              type="text" value={rawPrices}
              onChange={(e) => setRawPrices(e.target.value)}
              placeholder="12.3, 8.1, 5.4, 3.2, 1.8"
              style={{ ...inputStyle, marginTop: 4 }}
            />
          </label>
          <button
            onClick={handlePasteCalibrate}
            disabled={loading}
            style={{ padding: "8px 20px", fontFamily: "monospace", cursor: "pointer", width: "fit-content" }}
          >
            {loading ? "Calibrating..." : "Calibrate"}
          </button>
        </div>
      )}

      {/* Tab 1 — Fetch by ticker */}
      {tab === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 500 }}>
          <label style={labelStyle}>
            Ticker symbol
            <input
              type="text" value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="AAPL"
              style={{ ...inputStyle, marginTop: 4 }}
            />
          </label>
          <p style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#555", margin: 0 }}>
            Fetches the live option chain from Yahoo Finance, then calibrates automatically.
            Spot price is set from the market.
          </p>
          <button
            onClick={handleTickerCalibrate}
            disabled={loading || !ticker}
            style={{ padding: "8px 20px", fontFamily: "monospace", cursor: "pointer", width: "fit-content" }}
          >
            {loading ? "Fetching & calibrating..." : "Fetch & Calibrate"}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p style={{ color: "red", fontFamily: "monospace", marginTop: 16 }}>{error}</p>
      )}

      {/* Result */}
      {result && (
        <div style={{
          marginTop: "1.5rem",
          background: "#f9f9f9",
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: "1rem 1.5rem",
          fontFamily: "monospace",
          fontSize: "0.9rem",
          maxWidth: 500,
        }}>
          <div style={{ marginBottom: 8, fontWeight: "bold" }}>
            {result.ticker ? `${result.ticker} — ` : ""}Calibration result
            <span style={{
              marginLeft: 12,
              color: result.success ? "green" : "orange",
              fontWeight: "normal"
            }}>
              {result.success ? "✓ converged" : "⚠ did not fully converge"}
            </span>
          </div>

          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <tbody>
              {[
                ["κ (kappa)", result.kappa],
                ["θ (theta)", result.theta],
                ["σ (sigma)", result.sigma],
                ["ρ (rho)",   result.rho],
                ["v₀",        result.v0],
              ].map(([label, val]) => (
                <tr key={label}>
                  <td style={{ padding: "3px 12px 3px 0", color: "#555" }}>{label}</td>
                  <td style={{ padding: "3px 0" }}>{val.toFixed(6)}</td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: "3px 12px 3px 0", color: "#555" }}>Error</td>
                <td>{result.error.toFixed(6)}</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 12px 3px 0", color: "#555" }}>Method</td>
                <td>{result.method}</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 12px 3px 0", color: "#555" }}>Iterations</td>
                <td>{result.iterations}</td>
              </tr>
            </tbody>
          </table>

          <button
            onClick={handleApply}
            style={{
              marginTop: 16,
              padding: "8px 20px",
              fontFamily: "monospace",
              background: "#333",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            → Apply to pricer
          </button>
        </div>
      )}
    </div>
  )
}

export default CalibrationPanel