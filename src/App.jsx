import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
  useLocation,
} from "react-router-dom";
import TopNav from "./TopNav";
import TabContent from "./TabContent";
import "./App.css";

function SupervisorRoute({ supervisors, setSelectedSupervisors }) {
  const { supervisorName, districtId } = useParams();
  const location = useLocation();

  const supervisor = supervisors.find(
    (sup) =>
      sup.sup_name.replace(/\s+/g, "-").toLowerCase() === supervisorName
  );

  let activeTab = "dashboard";
  if (location.pathname.endsWith("/Details")) {
    activeTab = "details";
  } else if (location.pathname.endsWith("/Trends")) {
    activeTab = "alerts";
  }

  return (
    <TabContent
      district={supervisor ? supervisor.sup_dist_num : districtId}
      setSelectedSupervisors={setSelectedSupervisors}
      activeTab={activeTab}
    />
  );
}

function App() {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [supervisors, setSupervisors] = useState([]);

  // Fetch supervisors from an API
  useEffect(() => {
    const fetchSupervisors = async () => {
      const data = await fetch("/api/supervisors").then((res) => res.json());
      setSupervisors(data);
    };

    fetchSupervisors();
  }, []);

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
          {/* Home Route */}
          <Route
            path="/"
            element={
              <TabContent
                district={null}
                setSelectedSupervisors={setSupervisors}
                activeTab="dashboard"
              />
            }
          />
          {/* Details Route */}
          <Route
            path="/Details"
            element={
              <TabContent
                district={null}
                setSelectedSupervisors={setSupervisors}
                activeTab="details"
              />
            }
          />
          {/* Trends Route */}
          <Route
            path="/Trends"
            element={
              <TabContent
                district={null}
                setSelectedSupervisors={setSupervisors}
                activeTab="alerts"
              />
            }
          />
          {/* Dynamic Supervisor Routes */}
          <Route
            path="/:supervisorName/district/:districtId"
            element={
              <SupervisorRoute
                supervisors={supervisors}
                setSelectedSupervisors={setSupervisors}
              />
            }
          />
          <Route
            path="/:supervisorName/district/:districtId/Details"
            element={
              <SupervisorRoute
                supervisors={supervisors}
                setSelectedSupervisors={setSupervisors}
              />
            }
          />
          <Route
            path="/:supervisorName/district/:districtId/Trends"
            element={
              <SupervisorRoute
                supervisors={supervisors}
                setSelectedSupervisors={setSupervisors}
              />
            }
          />
        </Routes>
        <TopNav
          supervisors={supervisors}
          setSelectedDistrict={setSelectedDistrict}
        />
        {/* Footer Links */}
        <footer>
          <nav>
            <a href="/Details">Details</a> | <a href="/Trends">Trends</a>
          </nav>
        </footer>
      </div>
    </Router>
  );
}

export default App;
