import SectionWrapper from "./SectionWrapper"
import { InlineMath, BlockMath } from "react-katex"

function S3_HestonModel() {
  return (
    <SectionWrapper title="3 — The Heston Model">
      <p>
        The Heston model, introduced by Steven Heston in 1993, fixes Black-Scholes' core flaw
        by letting volatility evolve randomly over time. Instead of one fixed <InlineMath math={String.raw`\sigma`} />,
        the variance <InlineMath math={String.raw`v_t`} /> is itself a stochastic process with its own dynamics.
      </p>

      <h3 style={{ fontFamily: "monospace", marginTop: "2rem" }}>The two SDEs</h3>
      <p>
        The model is defined by two coupled stochastic differential equations — one for the
        stock price, one for its variance:
      </p>

      <BlockMath math={String.raw`dS_t = r S_t \, dt + \sqrt{v_t} \, S_t \, dW^1_t`} />
      <BlockMath math={String.raw`dv_t = \kappa(\theta - v_t) \, dt + \sigma \sqrt{v_t} \, dW^2_t`} />
      <BlockMath math={String.raw`dW^1_t \, dW^2_t = \rho \, dt`} />

      <p>
        The first equation says the stock drifts at the risk-free rate <InlineMath math={String.raw`r`} /> and
        is driven by a random shock <InlineMath math={String.raw`dW^1_t`} /> scaled by the <em>current</em> volatility <InlineMath math={String.raw`\sqrt{v_t}`} />.
        Unlike Black-Scholes, that volatility is no longer fixed — it changes every instant.
      </p>
      <p>
        The second equation describes how variance evolves. It's pulled back toward a long-run
        level <InlineMath math={String.raw`\theta`} /> at speed <InlineMath math={String.raw`\kappa`} />, and is perturbed
        by its own random shock <InlineMath math={String.raw`dW^2_t`} />. The two shocks are correlated
        with coefficient <InlineMath math={String.raw`\rho`} />.
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
      <BlockMath math={String.raw`2\kappa\theta > \sigma^2`} />
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
        The negative correlation <InlineMath math={String.raw`\rho &lt; 0`} /> means stock drops and vol spikes
        tend to happen together — the <em>leverage effect</em>. This makes downside options
        relatively more expensive, generating the skew seen in equity markets.
        The vol-of-vol parameter <InlineMath math={String.raw`\sigma`} /> adds curvature to both wings,
        producing the full smile shape.
      </div>
    </SectionWrapper>
  )
}

export default S3_HestonModel