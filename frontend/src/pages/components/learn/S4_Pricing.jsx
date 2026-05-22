import SectionWrapper from "./SectionWrapper"
import { InlineMath, BlockMath } from "./Math"
import { L4_0, L4_1, L4_2, L4_3, L4_4, L4_5, L4_6, L4_7, L4_8, L4_9, L4_10, L4_11, L4_12, L4_13, L4_14, L4_15, L4_16 } from "./latex_strings"


function S4_Pricing() {
  return (
    <SectionWrapper title="4 — How Heston Prices Options">
      <p>
        Black-Scholes has a closed-form formula you can evaluate directly. Heston doesn't —
        the stochastic variance makes the distribution of <InlineMath math={L4_0} /> too complex
        to write down in simple terms. So how do we get a price?
      </p>
      <p>
        The answer is to work in <em>frequency space</em> using a mathematical object called
        the <strong>characteristic function</strong>.
      </p>

      <h3 style={{ fontFamily: "monospace", marginTop: "2rem" }}>The characteristic function</h3>
      <p>
        The characteristic function of a random variable <InlineMath math={L4_1} /> is defined as:
      </p>
      <BlockMath math={L4_2} />
      <p>
        Think of it as the Fourier transform of the probability distribution of <InlineMath math={L4_3} />.
        It encodes the full distribution — mean, variance, skewness, everything — in a single function of <InlineMath math={L4_4} />.
      </p>
      <p>
        The remarkable fact about Heston is that even though the distribution of <InlineMath math={L4_5} />
        has no simple closed form, its characteristic function <em>does</em>:
      </p>
      <BlockMath math={L4_6} />
      <p>
        where <InlineMath math={L4_7} /> and <InlineMath math={L4_8} /> are known functions of the
        Heston parameters <InlineMath math={L4_9} /> and time <InlineMath math={L4_10} />.
        This is the key result that makes Heston tractable.
      </p>

      <h3 style={{ fontFamily: "monospace", marginTop: "2rem" }}>Gil-Pelaez inversion</h3>
      <p>
        Once we have the characteristic function, we can recover option prices via the
        Gil-Pelaez inversion theorem. For a European call:
      </p>
      <BlockMath math={L4_11} />
      <p>
        This looks just like Black-Scholes — and intentionally so. The two probabilities are:
      </p>
      <BlockMath math={L4_12} />
      <p>
        <InlineMath math={L4_13} /> is the risk-neutral probability of expiring in the money.
        <InlineMath math={L4_14} /> is a similar probability weighted by the stock price.
        Both are recovered by integrating the characteristic function numerically.
      </p>

      <h3 style={{ fontFamily: "monospace", marginTop: "2rem" }}>Carr-Madan FFT</h3>
      <p>
        Evaluating the integral above for every single strike separately is slow. The
        Carr-Madan method reformulates the problem so that a single
        Fast Fourier Transform prices the option across an <em>entire grid of strikes at once</em> —
        reducing the cost from <InlineMath math={L4_15} /> to <InlineMath math={L4_16} />.
      </p>
      <p>
        This is what the pricer in this app uses under the hood. When you click
        "Vol Surface", it runs one FFT pass to compute implied volatilities across
        120 strike-maturity combinations simultaneously.
      </p>

      <div style={{
        background: "#f0fff4",
        border: "1px solid #68d391",
        borderRadius: 8,
        padding: "1rem 1.5rem",
        margin: "1.5rem 0",
        fontFamily: "monospace",
        fontSize: "0.9rem"
      }}>
        <strong>The key insight in one sentence:</strong><br />
        We can't integrate the Heston density directly because we don't have it in closed form —
        but we <em>do</em> have its Fourier transform, and that's enough to price any European option.
      </div>
    </SectionWrapper>
  )
}

export default S4_Pricing