import { BrowserRouter, Routes, Route, Link } from "react-router-dom"
import Pricer from "./pages/Pricer"
import Learn from "./pages/Learn"
import "./App.css"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Learn />} />
        <Route path="/pricer" element={<Pricer />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App