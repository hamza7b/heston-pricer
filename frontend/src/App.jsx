import { useState } from "react"
import Plotly from "plotly.js-dist-min"
import createPlotlyComponent from "react-plotly.js/factory"
const Plot = createPlotlyComponent.default(Plotly)

const DEFAULT_PARAMS = {
  S0: 100, K: 100, T: 1.0,
  r: 0.05, q: 0.0,
  kappa: 1.5, theta: 0.04,
  sigma: 0.3, rho: -0.7, v0: 0.04,
  option_type: "call"
}

function App() {
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [price, setPrice] = useState(null)
  const [surface, setSurface] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setParams(p => ({
      ...p,
      [name]: name === "option_type" ? value : parseFloat(value)
    }))
  }

  const handlePrice = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("http://127.0.0.1:8000/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      setPrice(data.price)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSurface = async () => {
    setLoading(true)
    setError(null)
    try {
      const { S0, r, q, kappa, theta, sigma, rho, v0 } = params
      const res = await fetch("http://127.0.0.1:8000/surface", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ S0, r, q, kappa, theta, sigma, rho, v0 })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      setSurface(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { name: "S0", label: "Spot Price" },
    { name: "K", label: "Strike" },
    { name: "T", label: "Maturity (years)" },
    { name: "r", label: "Risk-free Rate" },
    { name: "q", label: "Dividend Yield" },
    { name: "kappa", label: "κ (mean reversion)" },
    { name: "theta", label: "θ (long-run variance)" },
    { name: "sigma", label: "σ (vol of vol)" },
    { name: "rho", label: "ρ (correlation)" },
    { name: "v0", label: "v₀ (initial variance)" },
  ]

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", maxWidth: 900 }}>
      <h1>Heston Pricer</h1>

      <div style={{ display: "flex", gap: "3rem" }}>
        <div style={{ minWidth: 320 }}>
          {fields.map(f => (
            <div key={f.name} style={{ marginBottom: 10 }}>
              <label style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <span>{f.label}</span>
                <input
                  name={f.name}
                  type="number"
                  step="any"
                  value={params[f.name]}
                  onChange={handleChange}
                  style={{ width: 120, fontFamily: "monospace" }}
                />
              </label>
            </div>
          ))}

          <div style={{ marginBottom: 16 }}>
            <label>
              Option type:{" "}
              <select name="option_type" value={params.option_type} onChange={handleChange}>
                <option value="call">Call</option>
                <option value="put">Put</option>
              </select>
            </label>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={handlePrice} disabled={loading} style={{ padding: "8px 20px" }}>
              {loading ? "..." : "Price"}
            </button>
            <button onClick={handleSurface} disabled={loading} style={{ padding: "8px 20px" }}>
              {loading ? "..." : "Vol Surface"}
            </button>
          </div>

          {price !== null && (
            <p style={{ marginTop: 20, fontSize: 22 }}>
              Price: <strong>${price.toFixed(4)}</strong>
            </p>
          )}
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>

        {surface && (
          <Plot
            data={[{
              type: "surface",
              x: surface.strikes,
              y: surface.maturities,
              z: surface.surface,
              colorscale: "Viridis",
              colorbar: { title: "IV %" }
            }]}
            layout={{
              width: 540,
              height: 480,
              title: "Implied Volatility Surface",
              scene: {
                xaxis: { title: "Strike" },
                yaxis: { title: "Maturity (yr)" },
                zaxis: { title: "IV (%)" }
              },
              margin: { l: 0, r: 0, t: 40, b: 0 }
            }}
          />
        )}
      </div>
    </div>
  )
}

export default App