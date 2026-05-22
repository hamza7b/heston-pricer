import SectionWrapper from "./SectionWrapper"
import { InlineMath, BlockMath } from "react-katex"

function S2_BlackScholes() {
  return (
    <SectionWrapper title="2 — Black-Scholes in 60 seconds">
      <p>
        Before Heston, there was Black-Scholes — published in 1973, it was the first rigorous
        framework for pricing options. It earned its authors the Nobel Prize and is still the
        industry baseline today.
      </p>

      <p>The formula prices a European call option as:</p>

      <BlockMath math="C = S_0 e^{-qT} N(d_1) - K e^{-rT} N(d_2)" />

      <p>where</p>

      <BlockMath math="d_1 = \frac{\ln(S_0/K) + (r - q + \frac{1}{2}\sigma^2)T}{\sigma\sqrt{T}}, \quad d_2 = d_1 - \sigma\sqrt{T}" />

      <p>The five inputs:</p>

      <table style={{ width: "100%", borderCollapse: "collapse", margin: "1.5rem 0", fontFamily: "monospace", fontSize: "0.9rem" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #333" }}>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Symbol</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Meaning</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["S₀", "Current stock price"],
            ["K", "Strike price — the price you have the right to buy at"],
            ["T", "Time to maturity in years"],
            ["r", "Risk-free interest rate"],
            ["σ", "Volatility — the one number Black-Scholes needs"],
          ].map(([sym, desc]) => (
            <tr key={sym} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "0.5rem", fontWeight: "bold" }}>{sym}</td>
              <td style={{ padding: "0.5rem" }}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        <InlineMath math="N(\cdot)" /> is the cumulative normal distribution —
        intuitively, <InlineMath math="N(d_2)" /> is the probability the option expires in the money,
        and <InlineMath math="N(d_1)" /> adjusts for the expected stock price if it does.
      </p>

      <div style={{
        background: "#fff8e1",
        border: "1px solid #f0c040",
        borderRadius: 8,
        padding: "1rem 1.5rem",
        margin: "1.5rem 0",
        fontFamily: "monospace",
        fontSize: "0.9rem"
      }}>
        <strong>Where it breaks down:</strong><br />
        Black-Scholes assumes <InlineMath math="\sigma" /> is constant across all strikes and maturities.
        But if you back out the implied vol from real market prices at different strikes,
        you get a different number each time — the <strong>volatility smile</strong>.
        A model with a single <InlineMath math="\sigma" /> cannot reproduce this. That's the gap Heston fills.
      </div>
    </SectionWrapper>
  )
}

export default S2_BlackScholes