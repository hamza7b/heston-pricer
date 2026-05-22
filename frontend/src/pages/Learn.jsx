import SectionWrapper from "./components/learn/SectionWrapper"
import S1_WhyVolModel from "./components/learn/S1_WhyVolModel"
import S2_BlackScholes from "./components/learn/S2_BlackScholes"
import S3_HestonModel from "./components/learn/S3_HestonModel"
import S4_Pricing from "./components/learn/S4_Pricing"
import S5_Calibration from "./components/learn/S5_Calibration"
import S6_TryIt from "./components/learn/S6_TryIt"
import "katex/dist/katex.min.css"

function Learn() {
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem", fontFamily: "Georgia, serif", lineHeight: 1.8 }}>
      <h1 style={{ fontFamily: "monospace", borderBottom: "2px solid #333", paddingBottom: "0.5rem" }}>
        Understanding the Heston Model
      </h1>
      <p style={{ color: "#555", marginBottom: "3rem" }}>
        A guide for everyone, from first principles to stochastic volatility.
      </p>
      <S1_WhyVolModel />
      <S2_BlackScholes />
      <S3_HestonModel />
      <S4_Pricing />
      <S5_Calibration />
      <S6_TryIt />
    </div>
  )
}

export default Learn