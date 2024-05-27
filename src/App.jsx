import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TopNav from "./TopNav";
import TabContent from "./TabContent";
import "./App.css";

function App() {
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  return (
    <Router>
      <div className="App" style={{ padding: "20px" }}>
        <header>
          <div className="header-container">
            <h1>Transparent San Francisco</h1>
            <span className="badge">Beta</span>
          </div>
        </header>
        <TopNav selectedDistrict={selectedDistrict} setSelectedDistrict={setSelectedDistrict} />
        <Routes>
          <Route path="/" element={<TabContent district={null} />} />
          {Array.from({ length: 11 }, (_, i) => (
            <Route key={i} path={`/district/${i + 1}`} element={<TabContent district={i + 1} />} />
          ))}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
