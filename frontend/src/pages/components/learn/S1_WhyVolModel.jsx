import SectionWrapper from "./SectionWrapper"

function S1_WhyVolModel() {
  return (
    <SectionWrapper title="1 — Why do options need a volatility model?">
      <p>
        When you buy a call option, you're paying for the <em>right</em> to buy a stock at a fixed price in the future.
        How much should that right cost? The answer depends on one key unknown: <strong>how much will the stock move?</strong>
      </p>
      <p>
        That "how much will it move" is volatility. The higher the volatility, the more the stock could swing in your favour,
        and the more the option is worth.
      </p>
      <p>
        The simplest assumption is that volatility is constant — a single number that never changes.
        That's what Black-Scholes assumes. But markets disagree.
      </p>
      <p>
        If you take real option prices from the market and back out the implied volatility at each strike,
        you don't get a flat line. You get a <strong>smile</strong> — implied vol is higher for deep
        in-the-money and out-of-the-money options than for at-the-money ones.
      </p>
      <div style={{
        background: "#f9f9f9",
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: "1rem 1.5rem",
        margin: "1.5rem 0",
        fontFamily: "monospace",
        fontSize: "0.9rem"
      }}>
        <strong>The problem in one sentence:</strong><br />
        Black-Scholes assumes one volatility for all strikes and maturities.
        The market uses a different one for each. Something is missing from the model.
      </div>
      <p>
        That missing ingredient is the fact that volatility itself is <em>random</em> — it changes over time,
        spikes during crashes, and mean-reverts during calm periods. The Heston model captures exactly this.
      </p>
    </SectionWrapper>
  )
}

export default S1_WhyVolModel