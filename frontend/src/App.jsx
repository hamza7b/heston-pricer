import { useState, useEffect } from "react"

function App() {
  const [status, setStatus] = useState("checking...")

  useEffect(() => {
    fetch("http://127.0.0.1:8000")
      .then(res => res.json())
      .then(data => setStatus(data.status))
      .catch(() => setStatus("❌ could not reach API"))
  }, [])

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>Heston Pricer</h1>
      <p>API status: <strong>{status}</strong></p>
    </div>
  )
}

export default App