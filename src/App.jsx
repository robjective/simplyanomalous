import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
} from "react-router-dom";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TabContent from "./TabContent";
import AnomalyDisplay from "./AnomalyDisplay";
import "./App.css";

function SupervisorRoute({ supervisors, setSelectedSupervisors }) {
  const { supervisorName, districtId } = useParams();

  const supervisor = supervisors.find(
    (sup) =>
      sup.sup_name.replace(/\s+/g, "-").toLowerCase() === supervisorName
  );

  return (
    <TabContent
      district={supervisor ? supervisor.sup_dist_num : districtId}
      setSelectedSupervisors={setSelectedSupervisors}
    />
  );
}

function App() {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState("");

  // Fetch supervisors from an API
  useEffect(() => {
    const fetchSupervisors = async () => {
      const data = await fetch("/api/supervisors").then((res) => res.json());
      setSupervisors([
        { sup_name: "Citywide", sup_dist_num: "citywide" },
        { sup_name: "London Breed", sup_dist_num: "mayor" },
        ...data,
      ]);
    };

    fetchSupervisors();
  }, []);

  const handleSupervisorChange = (event, newSupervisor) => {
    if (newSupervisor !== null) {
      setSelectedSupervisor(newSupervisor);
    }
  };

  return (
    <Router>
      <div className="App p-5">
        <header>
          <div className="header-container">
            <h1>Transparent San Francisco</h1>
            <span className="badge">Beta</span>
            <p>
              This site is built on San Francisco's{" "}
              <a href="https://datasf.org/opendata/">Open Data Project</a>. We
              cut through the noise to reveal trends and insights. We're making
              San Francisco more accountable, one dataset at a time.
            </p>
          </div>
        </header>

        {/* Supervisor Tabs - Scrollable on Mobile */}
        <div className="supervisor-tabs overflow-x-auto py-5">
          <Tabs
            value={selectedSupervisor}
            onChange={handleSupervisorChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="supervisor selection"
          >
            {/* Add the Citywide tab */}
            <Tab
              key="citywide"
              label={
                <div className="flex flex-col items-center">
                  <span className="text-sm">Citywide</span>
                  <span className="text-base">London Breed</span>
                </div>
              }
              value="citywide"
              href="/"
            />
            {/* Display sorted supervisors */}
            {supervisors
              .sort((a, b) => {
                if (a.sup_dist_num === "citywide" || a.sup_dist_num === "mayor")
                  return -1; // Keep Citywide and London Breed tabs at the top
                if (b.sup_dist_num === "citywide" || b.sup_dist_num === "mayor")
                  return 1;
                return parseInt(a.sup_dist_num) - parseInt(b.sup_dist_num);
              })
              .map((supervisor) => (
                <Tab
                  key={supervisor.sup_dist_num}
                  label={
                    <div className="flex flex-col items-center">
                      {/* Conditionally render District X or other labels */}
                      {supervisor.sup_dist_num !== "citywide" &&
                      supervisor.sup_dist_num !== "mayor" ? (
                        <span className="text-sm">
                          {`District ${parseInt(supervisor.sup_dist_num)} `}
                        </span>
                      ) : (
                        <span className="text-sm">{supervisor.sup_name}</span>
                      )}
                      <span className="text-base text-center">
                        {supervisor.sup_name}
                      </span>
                    </div>
                  }
                  value={supervisor.sup_dist_num}
                  href={
                    supervisor.sup_dist_num === "citywide" ||
                    supervisor.sup_dist_num === "mayor"
                      ? "/"
                      : `/${supervisor.sup_name
                          .replace(/\s+/g, "-")
                          .toLowerCase()}/district/${supervisor.sup_dist_num}`
                  }
                />
              ))}
          </Tabs>
        </div>

        {/* Date Selector Placeholder */}
        <div className="date-selector">
          {/* Your date selector component here */}
        </div>

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
          <Route path="/Trends" element={<AnomalyDisplay />} />
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
