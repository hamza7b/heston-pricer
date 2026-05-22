import SectionWrapper from "./SectionWrapper"
import { InlineMath, BlockMath } from "./Math"
import { L5_0, L5_1, L5_2, L5_3 } from "./latex_strings"


function S5_Calibration() {
  return (
    <SectionWrapper title="5 — Calibration">
      <p>
        The Heston model has five parameters: <InlineMath math={L5_0} />.
        But where do these numbers come from in practice? You can't observe them directly —
        you have to <em>infer</em> them from market prices. That process is called <strong>calibration</strong>.
      </p>

      <h3 style={{ fontFamily: "monospace", marginTop: "2rem" }}>The idea</h3>
      <p>
        The market quotes option prices at many different strikes and maturities simultaneously.
        Each of those prices implies a different volatility. Calibration asks:
        which set of Heston parameters produces model prices that best match all of those
        market prices at once?
      </p>
      <p>
        Concretely, you minimize the sum of squared differences between model prices
        and market prices across all available options:
      </p>
      <BlockMath math={L5_1} />

      <h3 style={{ fontFamily: "monospace", marginTop: "2rem" }}>How it works in practice</h3>
      <p>
        This is a nonlinear optimization problem. In this project it's solved using
        <code> scipy.optimize.minimize</code> with the Nelder-Mead or L-BFGS-B method.
        The optimizer iteratively adjusts the five parameters, re-prices the full option
        surface at each step, and stops when the error is small enough.
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", margin: "1.5rem 0", fontFamily: "monospace", fontSize: "0.9rem" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #333" }}>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Step</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>What happens</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["1. Market data", "Collect bid/ask option prices across strikes and maturities"],
            ["2. Initial guess", "Start with a reasonable set of parameters"],
            ["3. Price model", "Run the FFT pricer to get model prices at each strike/maturity"],
            ["4. Compute error", "Sum of squared differences vs market prices"],
            ["5. Optimize", "Adjust parameters to reduce the error"],
            ["6. Repeat", "Until convergence — typically 100–500 iterations"],
          ].map(([step, desc]) => (
            <tr key={step} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "0.5rem", fontWeight: "bold" }}>{step}</td>
              <td style={{ padding: "0.5rem" }}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ fontFamily: "monospace", marginTop: "2rem" }}>Practical challenges</h3>
      <p>
        Calibration is deceptively tricky. The objective function is non-convex — there can be
        multiple local minima, and the optimizer can get stuck. Common issues include:
      </p>
      <ul style={{ lineHeight: 2 }}>
        <li>Sensitivity to the initial parameter guess</li>
        <li>The Feller condition being violated during optimization</li>
        <li>Overfitting to noise in the market data</li>
        <li>Slow convergence when <InlineMath math={L5_2} /> and <InlineMath math={L5_3} /> are highly correlated</li>
      </ul>

      <div style={{
        background: "#fff0f0",
        border: "1px solid #fc8181",
        borderRadius: 8,
        padding: "1rem 1.5rem",
        margin: "1.5rem 0",
        fontFamily: "monospace",
        fontSize: "0.9rem"
      }}>
        <strong>Calibration vs estimation:</strong><br />
        Calibration is not statistical estimation. You're not fitting a model to historical
        returns — you're finding parameters that are <em>consistent with today's market prices</em>.
        The result tells you what the market implicitly believes about future volatility dynamics,
        not what history says.
      </div>
    </SectionWrapper>
  )
}

export default S5_Calibration