// App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TopNav from "./TopNav";
import TabContent from "./TabContent";
import "./App.css";

function App() {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [supervisors, setSupervisors] = useState([]);

  return (
    <Router>
      <div className="App" style={{ padding: "20px" }}>
      <header>
      <div className="header-container">
        <h1>Transparent San Francisco</h1>
        <span className="badge">Beta</span>
      </div>
    </header>   
        <Routes>
          <Route path="/" element={<TabContent district={null} setSelectedSupervisors={setSupervisors} />} />
          {supervisors.map((supervisor) => (
            <Route
              key={supervisor.sup_dist_num}
              path={`/${supervisor.sup_name.replace(/\s+/g, "-").toLowerCase()}/district/${supervisor.sup_dist_num}`}
              element={<TabContent district={supervisor.sup_dist_num} setSelectedSupervisors={setSupervisors} />}
            />
          ))}
        </Routes>
        <TopNav supervisors={supervisors} setSelectedDistrict={setSelectedDistrict} />
      </div>
    </Router>
  );
}

export default App;
