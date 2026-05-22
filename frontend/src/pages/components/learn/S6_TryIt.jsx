import SectionWrapper from "./SectionWrapper"
import { Link } from "react-router-dom"

function S6_TryIt() {
  return (
    <SectionWrapper title="6 — Try it yourself">
      <p>
        You've seen the theory — the volatility smile, the two SDEs, the characteristic
        function, the FFT pricer, and calibration. Now try it hands-on.
      </p>
      <p>
        The pricer lets you set all five Heston parameters and instantly see how they
        reshape the implied volatility surface. A few things worth trying:
      </p>
      <ul style={{ lineHeight: 2 }}>
        <li>Set <strong>ρ = 0</strong> and observe the smile become symmetric</li>
        <li>Increase <strong>σ</strong> and watch the wings of the smile steepen</li>
        <li>Set <strong>κ</strong> very high — variance mean-reverts instantly, surface flattens for long maturities</li>
        <li>Violate the Feller condition (<strong>2κθ &lt; σ²</strong>) and see what happens to prices</li>
      </ul>

      <div style={{ marginTop: "2rem" }}>
        <Link
          to="/pricer"
          style={{
            display: "inline-block",
            padding: "0.75rem 2rem",
            background: "#333",
            color: "#fff",
            borderRadius: 6,
            textDecoration: "none",
            fontFamily: "monospace",
            fontSize: "1rem",
            letterSpacing: "0.05em"
          }}
        >
          → Open the Pricer
        </Link>
      </div>
    </SectionWrapper>
  )
}

export default S6_TryIt