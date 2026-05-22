import SectionWrapper from "./SectionWrapper"
import { InlineMath, BlockMath } from "./Math"
import { L3_0, L3_1, L3_2, L3_3, L3_4, L3_5, L3_6, L3_7, L3_8, L3_9, L3_10, L3_11, L3_12, L3_13, L3_14 } from "./latex_strings"


function S3_HestonModel() {
  return (
    <SectionWrapper title="3 — The Heston Model">
      <p>
        The Heston model, introduced by Steven Heston in 1993, fixes Black-Scholes' core flaw
        by letting volatility evolve randomly over time. Instead of one fixed <InlineMath math={L3_0} />,
        the variance <InlineMath math={L3_1} /> is itself a stochastic process with its own dynamics.
      </p>

      <h3 style={{ fontFamily: "monospace", marginTop: "2rem" }}>The two SDEs</h3>
      <p>
        The model is defined by two coupled stochastic differential equations — one for the
        stock price, one for its variance:
      </p>

      <BlockMath math={L3_2} />
      <BlockMath math={L3_3} />
      <BlockMath math={L3_4} />

      <p>
        The first equation says the stock drifts at the risk-free rate <InlineMath math={L3_5} /> and
        is driven by a random shock <InlineMath math={L3_6} /> scaled by the <em>current</em> volatility <InlineMath math={L3_7} />.
        Unlike Black-Scholes, that volatility is no longer fixed — it changes every instant.
      </p>
      <p>
        The second equation describes how variance evolves. It's pulled back toward a long-run
        level <InlineMath math={L3_8} /> at speed <InlineMath math={L3_9} />, and is perturbed
        by its own random shock <InlineMath math={L3_10} />. The two shocks are correlated
        with coefficient <InlineMath math={L3_11} />.
      </p>

      <h3 style={{ fontFamily: "monospace", marginTop: "2rem" }}>The five parameters</h3>

      <table style={{ width: "100%", borderCollapse: "collapse", margin: "1.5rem 0", fontFamily: "monospace", fontSize: "0.9rem" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #333" }}>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Parameter</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Meaning</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Intuition</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["κ (kappa)", "Mean reversion speed", "How fast variance snaps back to θ after a shock. High κ = short memory."],
            ["θ (theta)", "Long-run variance", "Where variance settles in the long run. √θ is the long-run volatility."],
            ["σ (sigma)", "Vol of vol", "How much variance itself fluctuates. Controls smile curvature."],
            ["ρ (rho)", "Correlation", "Typically negative: when stock falls, vol spikes. This creates the skew."],
            ["v₀", "Initial variance", "The variance right now, at time 0. √v₀ is today's instantaneous vol."],
          ].map(([param, meaning, intuition]) => (
            <tr key={param} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "0.5rem", fontWeight: "bold" }}>{param}</td>
              <td style={{ padding: "0.5rem" }}>{meaning}</td>
              <td style={{ padding: "0.5rem", color: "#555" }}>{intuition}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ fontFamily: "monospace", marginTop: "2rem" }}>The Feller condition</h3>
      <p>
        For variance to stay strictly positive (never hit zero), the parameters must satisfy:
      </p>
      <BlockMath math={L3_12} />
      <p>
        Intuitively: the mean-reversion force pulling variance back up must be stronger than
        the random shocks pushing it down. If this condition is violated, variance can reach
        zero and the model breaks. In practice, calibrated parameters sometimes violate it
        slightly — it's a known limitation to be aware of.
      </p>

      <div style={{
        background: "#f0f4ff",
        border: "1px solid #99aaee",
        borderRadius: 8,
        padding: "1rem 1.5rem",
        margin: "1.5rem 0",
        fontFamily: "monospace",
        fontSize: "0.9rem"
      }}>
        <strong>Why this produces a smile:</strong><br />
        The negative correlation <InlineMath math={L3_13} /> means stock drops and vol spikes
        tend to happen together — the <em>leverage effect</em>. This makes downside options
        relatively more expensive, generating the skew seen in equity markets.
        The vol-of-vol parameter <InlineMath math={L3_14} /> adds curvature to both wings,
        producing the full smile shape.
      </div>
    </SectionWrapper>
  )
}

export default S3_HestonModel