function SectionWrapper({ title, children }) {
  return (
    <section style={{ marginBottom: "4rem" }}>
      <h2 style={{
        fontFamily: "monospace",
        fontSize: "1.3rem",
        borderLeft: "4px solid var(--accent)",
        paddingLeft: "0.75rem",
        marginBottom: "1.5rem"
      }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

export default SectionWrapper